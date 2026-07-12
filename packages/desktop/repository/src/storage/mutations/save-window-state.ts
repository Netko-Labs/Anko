import { getDb } from '../client'
import type { WindowState } from '@anko/desktop-domain'
import { windowStateTable } from '@anko/desktop-domain/db'

export function saveWindowState(state: WindowState): void {
  getDb()
    .insert(windowStateTable)
    .values({
      id: 1,
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      isMaximized: state.isMaximized,
    })
    .onConflictDoUpdate({
      target: windowStateTable.id,
      set: {
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        isMaximized: state.isMaximized,
      },
    })
    .run()
}
