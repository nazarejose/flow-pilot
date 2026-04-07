declare module 'vue-mention' {
  import { DefineComponent } from 'vue'

  export interface MentionItem {
    value: string | number
    searchText?: string
    [key: string]: unknown
  }

  export const Mentionable: DefineComponent<{
    keys: string[]
    items?: MentionItem[]
    insertSpace?: boolean
    limit?: number
    offset?: number
    theme?: string
    caretHeight?: number
    omitKey?: boolean
    filteringDisabled?: boolean
    mapInsert?: (insertStr: string, key: string) => string
  }, {}, {}, {}, {}, {}, {}, {
    search: (key: string, text: string) => void
    open: (key: string) => void
    close: (key: string) => void
    apply: (result: string) => void
  }>
}
