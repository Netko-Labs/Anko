import { Parser } from 'node-sql-parser'
import type { DatabaseDriver } from '../db/connector'

export interface SqlSafetyResult {
  safe: boolean
  reasons: string[]
}

type AstNode = Record<string, unknown>

const DIALECTS: Record<DatabaseDriver, string> = {
  mysql: 'MySQL',
  postgresql: 'Postgresql',
  sqlite: 'SQLite',
}

const parser = new Parser()

export function classifySql(sql: string, driver: DatabaseDriver): SqlSafetyResult {
  if (!sql.trim()) return { safe: false, reasons: ['The query is empty'] }

  try {
    const parsed = parser.astify(sql, { database: DIALECTS[driver] }) as unknown
    if (Array.isArray(parsed)) {
      if (parsed.length !== 1) {
        return { safe: false, reasons: ['Multiple SQL statements require approval'] }
      }
      return classifyNode(parsed[0] as AstNode)
    }
    return classifyNode(parsed as AstNode)
  } catch {
    return { safe: false, reasons: ['The SQL could not be classified safely'] }
  }
}

function classifyNode(node: AstNode): SqlSafetyResult {
  if (node.type !== 'select') {
    return {
      safe: false,
      reasons: [`${String(node.type ?? 'Unknown')} statements can modify state`],
    }
  }

  const into = asRecord(node.into)
  if (into?.position) {
    return { safe: false, reasons: ['SELECT INTO creates or modifies data'] }
  }
  if (node.locking_read || node.for_update) {
    return { safe: false, reasons: ['Locking reads require approval'] }
  }

  const withClauses = Array.isArray(node.with) ? node.with : []
  for (const clause of withClauses) {
    const statement = asRecord(asRecord(clause)?.stmt)
    if (!statement || classifyNode(statement).safe === false) {
      return { safe: false, reasons: ['A common table expression may modify state'] }
    }
  }

  return { safe: true, reasons: [] }
}

function asRecord(value: unknown): AstNode | undefined {
  return typeof value === 'object' && value !== null ? (value as AstNode) : undefined
}

export function wrapReadOnlyQuery(sql: string, maxRows: number): string {
  const normalized = sql.trim().replace(/;+\s*$/, '')
  return `SELECT * FROM (${normalized}) AS anko_mcp_result LIMIT ${maxRows + 1}`
}
