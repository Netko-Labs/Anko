import { describe, expect, test } from 'bun:test'
import { classifySql, wrapReadOnlyQuery } from '../sql-safety'

describe('classifySql', () => {
  test.each([
    'mysql',
    'postgresql',
    'sqlite',
  ] as const)('accepts a single select for %s', (driver) => {
    expect(classifySql('SELECT * FROM users', driver)).toEqual({ safe: true, reasons: [] })
  })

  test('accepts read-only CTEs', () => {
    expect(
      classifySql('WITH ids AS (SELECT id FROM users) SELECT * FROM ids', 'postgresql').safe,
    ).toBe(true)
  })

  test('rejects mutating CTEs', () => {
    const result = classifySql(
      'WITH changed AS (DELETE FROM users RETURNING id) SELECT * FROM changed',
      'postgresql',
    )
    expect(result.safe).toBe(false)
  })

  test('rejects explain and transaction control', () => {
    expect(classifySql('EXPLAIN SELECT * FROM users', 'postgresql').safe).toBe(false)
    expect(classifySql('BEGIN', 'postgresql').safe).toBe(false)
  })

  test.each([
    'UPDATE users SET active = false',
    'DELETE FROM users',
    'DROP TABLE users',
    'SELECT * INTO users_copy FROM users',
    'SELECT 1; SELECT 2',
    'SELECT * FROM users FOR UPDATE',
    'PRAGMA journal_mode=WAL',
  ])('fails closed for %s', (sql) => {
    expect(classifySql(sql, 'postgresql').safe).toBe(false)
  })

  test('does not treat keywords inside literals as mutations', () => {
    expect(classifySql("SELECT 'DROP TABLE users' AS example", 'postgresql').safe).toBe(true)
  })

  test('does not treat keywords inside comments as mutations', () => {
    expect(classifySql('/* DELETE FROM users */ SELECT 1', 'postgresql').safe).toBe(true)
  })

  test('fails closed on parser errors', () => {
    expect(classifySql('SELECT FROM', 'postgresql').safe).toBe(false)
  })
})

test('wrapReadOnlyQuery adds one lookahead row', () => {
  expect(wrapReadOnlyQuery('SELECT * FROM users;', 200)).toBe(
    'SELECT * FROM (SELECT * FROM users) AS anko_mcp_result LIMIT 201',
  )
})
