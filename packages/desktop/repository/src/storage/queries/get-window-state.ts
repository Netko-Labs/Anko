import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import type { WindowState } from '@anko/desktop-domain'
import { windowStateTable } from '@anko/desktop-domain/db'

const DEFAULT_STATE: WindowState = {
  x: 200,
  y: 200,
  width: 1200,
  height: 800,
  isMaximized: false,
}

export function getWindowState(): WindowState {
  const [row] = getDb().select().from(windowStateTable).where(eq(windowStateTable.id, 1)).all()

  if (!row) return DEFAULT_STATE

  return {
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    isMaximized: row.isMaximized,
  }
}
