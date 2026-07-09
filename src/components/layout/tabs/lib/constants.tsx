import type { TabActionMode } from './types'

export const TAB_ACTION_LABELS: Record<
  TabActionMode,
  {
    title: string
    description: string
    action: string
  }
> = {
  query: {
    title: 'New Query',
    description: 'Choose a connection and database for the new query tab.',
    action: 'Create Query',
  },
  table: {
    title: 'Open Table',
    description: 'Choose a connection, database, and table to browse.',
    action: 'Open Table',
  },
}
