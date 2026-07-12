import { create } from 'zustand'
import type { LeftSidebarStore } from './lib/types'

export const useLeftSidebarStore = create<LeftSidebarStore>((set) => ({
  open: true,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}))
