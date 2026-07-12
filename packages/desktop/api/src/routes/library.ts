import type {
  AddQueryHistoryInput,
  CreateSavedQueryInput,
  UpdateSavedQueryInput,
} from '@anko/desktop-domain'
import {
  addQueryHistory,
  clearQueryHistory,
  createSavedQuery,
  deleteQueryHistory,
  deleteSavedQuery,
  listQueryHistory,
  listSavedQueries,
  updateSavedQuery,
} from '@anko/desktop-repository'
import { rpc } from 'mirinjs/rpc'

/** Query history and saved-query persistence commands. */
export function libraryRoutes() {
  return {
    // ---- Query history ----
    addQueryHistory: rpc.mutation(({ input }: { input: AddQueryHistoryInput }) =>
      addQueryHistory(input),
    ),
    listQueryHistory: rpc.query(
      ({ connectionId, limit }: { connectionId?: string; limit?: number }) =>
        listQueryHistory(connectionId, limit),
    ),
    deleteQueryHistory: rpc.mutation(({ id }: { id: string }) => {
      deleteQueryHistory(id)
    }),
    clearQueryHistory: rpc.mutation(() => {
      clearQueryHistory()
    }),

    // ---- Saved queries ----
    createSavedQuery: rpc.mutation(({ input }: { input: CreateSavedQueryInput }) =>
      createSavedQuery(input),
    ),
    listSavedQueries: rpc.query(({ workspaceId }: { workspaceId?: string }) =>
      listSavedQueries(workspaceId),
    ),
    updateSavedQuery: rpc.mutation(({ id, input }: { id: string; input: UpdateSavedQueryInput }) =>
      updateSavedQuery(id, input),
    ),
    deleteSavedQuery: rpc.mutation(({ id }: { id: string }) => {
      deleteSavedQuery(id)
    }),
  }
}
