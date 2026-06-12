import type { WindowState } from '../entities'
import { getDb } from '../client'
import { windowStateTable } from '../schema'

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
