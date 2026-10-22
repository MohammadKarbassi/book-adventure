import Form from "next/form"
import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { TypeFilter } from "@/lib/browse"

type SearchFormProps = {
  query: string
  type: TypeFilter
}

/** GET form to /search: works without JS, navigates client-side with it. */
export function SearchForm({ query, type }: SearchFormProps) {
  return (
    <Form action="/search" role="search" className="w-full">
      <InputGroup className="h-12 rounded-xl bg-card shadow-sm dark:bg-card">
        <InputGroupAddon>
          <SearchIcon className="size-5" />
        </InputGroupAddon>
        <InputGroupInput
          // Remount when the query changes so the field shows the new one.
          key={query}
          type="search"
          name="q"
          defaultValue={query}
          placeholder="جستجوی کتاب، نویسنده، گوینده…"
          aria-label="عبارت جستجو"
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={!query}
          className="text-base"
        />
        {type !== "all" ? (
          <input type="hidden" name="type" value={type} />
        ) : null}
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            variant="default"
            size="sm"
            className="h-9 px-4"
          >
            جستجو
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Form>
  )
}
