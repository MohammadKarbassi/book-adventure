// Tiny typed key-value layer over localStorage. Pure (no React) so it runs in
// Node tests; lib/store.ts builds the hydration-safe hooks on top of it.

export const STORAGE_PREFIX = "book-adventure:v1:"

/** Fired on window after every write so hooks in the same tab update. */
export const STORAGE_EVENT = "book-adventure:storage"

export type StorageEventDetail = { name: string }

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

export type Validator<T> = (value: unknown) => value is T

export function storageKey(name: string): string {
  return STORAGE_PREFIX + name
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    // Access itself can throw (blocked cookies, sandboxed iframes).
    return null
  }
}

function notify(name: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<StorageEventDetail>(STORAGE_EVENT, { detail: { name } })
  )
}

export function createStorage(
  getStorage: () => StorageLike | null = browserStorage
) {
  // Raw string → parsed value per key, so repeated reads of an unchanged key
  // return the same reference (useSyncExternalStore needs stable snapshots).
  const cache = new Map<string, { raw: string; value: unknown }>()

  function getRaw(name: string): string | null {
    try {
      return getStorage()?.getItem(storageKey(name)) ?? null
    } catch {
      return null
    }
  }

  function read<T>(name: string, fallback: T, validate?: Validator<T>): T {
    const raw = getRaw(name)
    if (raw === null) return fallback
    const cached = cache.get(name)
    if (cached && cached.raw === raw) return cached.value as T
    let value: T = fallback
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!validate || validate(parsed)) value = parsed as T
    } catch {
      // Corrupt JSON: keep the fallback.
    }
    cache.set(name, { raw, value })
    return value
  }

  /** Returns false when storage is missing or full; the value is not kept. */
  function write<T>(name: string, value: T): boolean {
    let ok = false
    try {
      const storage = getStorage()
      if (storage) {
        storage.setItem(storageKey(name), JSON.stringify(value))
        ok = true
      }
    } catch {
      ok = false
    }
    if (ok) notify(name)
    return ok
  }

  /** Returns false when storage is missing or throws; the value stays. */
  function remove(name: string): boolean {
    try {
      const storage = getStorage()
      if (!storage) return false
      storage.removeItem(storageKey(name))
    } catch {
      return false
    }
    cache.delete(name)
    notify(name)
    return true
  }

  /** Calls back on writes to `name` in this tab and in other tabs. */
  function subscribe(name: string, callback: () => void): () => void {
    if (typeof window === "undefined") return () => {}
    const key = storageKey(name)
    const onLocal = (event: Event) => {
      const detail = (event as CustomEvent<StorageEventDetail>).detail
      if (detail?.name === name) callback()
    }
    // Native "storage" fires in other tabs; key is null after clear().
    const onOtherTab = (event: StorageEvent) => {
      if (event.key === null || event.key === key) callback()
    }
    window.addEventListener(STORAGE_EVENT, onLocal)
    window.addEventListener("storage", onOtherTab)
    return () => {
      window.removeEventListener(STORAGE_EVENT, onLocal)
      window.removeEventListener("storage", onOtherTab)
    }
  }

  return { read, write, remove, subscribe }
}

export type TypedStorage = ReturnType<typeof createStorage>

/** The app-wide instance over window.localStorage. */
export const storage = createStorage()
