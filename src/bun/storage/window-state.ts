import type { Database } from 'bun:sqlite'

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

const DEFAULT_STATE: WindowState = {
  x: 200,
  y: 200,
  width: 1200,
  height: 800,
  isMaximized: false,
}

export class WindowStateStorage {
  constructor(private db: Database) {
    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS window_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        is_maximized INTEGER NOT NULL DEFAULT 0
      )
    `)
  }

  get(): WindowState {
    const row = this.db
      .prepare('SELECT x, y, width, height, is_maximized FROM window_state WHERE id = 1')
      .get() as { x: number; y: number; width: number; height: number; is_maximized: number } | null

    if (!row) return DEFAULT_STATE

    return {
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      isMaximized: row.is_maximized === 1,
    }
  }

  save(state: WindowState): void {
    this.db
      .prepare(
        `INSERT INTO window_state (id, x, y, width, height, is_maximized)
         VALUES (1, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           x = excluded.x,
           y = excluded.y,
           width = excluded.width,
           height = excluded.height,
           is_maximized = excluded.is_maximized`,
      )
      .run(state.x, state.y, state.width, state.height, state.isMaximized ? 1 : 0)
  }
}
