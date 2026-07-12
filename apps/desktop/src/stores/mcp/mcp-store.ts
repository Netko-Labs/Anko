import type { McpApprovalRequest, McpSettings } from '@anko/desktop-domain'
import { create } from 'zustand'

interface McpStore {
  settingsOpen: boolean
  settings: McpSettings | null
  pending: McpApprovalRequest[]
  setSettingsOpen(open: boolean): void
  setSettings(settings: McpSettings): void
  setPending(pending: McpApprovalRequest[]): void
  addPending(request: McpApprovalRequest): void
  removePending(id: string): void
}

export const useMcpStore = create<McpStore>((set) => ({
  settingsOpen: false,
  settings: null,
  pending: [],
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSettings: (settings) => set({ settings }),
  setPending: (pending) => set({ pending }),
  addPending: (request) =>
    set((state) => ({
      pending: state.pending.some((item) => item.id === request.id)
        ? state.pending
        : [...state.pending, request],
    })),
  removePending: (id) =>
    set((state) => ({ pending: state.pending.filter((item) => item.id !== id) })),
}))
