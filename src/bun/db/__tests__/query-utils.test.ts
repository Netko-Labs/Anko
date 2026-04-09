import { describe, expect, test } from 'bun:test'
import { extractTableFromSelect } from '../query-utils'

describe('extractTableFromSelect', () => {
  test('extracts simple table name', () => {
    expect(extractTableFromSelect('SELECT * FROM users')).toBe('users')
  })

  test('extracts table with WHERE clause', () => {
    expect(extractTableFromSelect('SELECT id, name FROM orders WHERE id = 1')).toBe('orders')
  })

  test('extracts table with LIMIT', () => {
    expect(extractTableFromSelect('SELECT * FROM products LIMIT 10')).toBe('products')
  })

  test('extracts table with ORDER BY', () => {
    expect(extractTableFromSelect('SELECT * FROM items ORDER BY created_at')).toBe('items')
  })

  test('extracts table with GROUP BY and HAVING', () => {
    expect(
      extractTableFromSelect('SELECT status, COUNT(*) FROM orders GROUP BY status HAVING COUNT(*) > 1'),
    ).toBe('orders')
  })

  test('handles schema.table format', () => {
    expect(extractTableFromSelect('SELECT * FROM public.users')).toBe('users')
  })

  test('handles backtick-quoted table', () => {
    expect(extractTableFromSelect('SELECT * FROM `my_table`')).toBe('my_table')
  })

  test('handles double-quoted table', () => {
    expect(extractTableFromSelect('SELECT * FROM "my_table"')).toBe('my_table')
  })

  test('returns undefined for non-SELECT queries', () => {
    expect(extractTableFromSelect('INSERT INTO users VALUES (1)')).toBeUndefined()
  })

  test('returns undefined for queries without FROM', () => {
    expect(extractTableFromSelect('SELECT 1 + 1')).toBeUndefined()
  })

  test('handles JOIN clauses', () => {
    expect(extractTableFromSelect('SELECT * FROM users JOIN orders ON users.id = orders.user_id')).toBe(
      'users',
    )
  })

  test('handles LEFT JOIN', () => {
    expect(
      extractTableFromSelect('SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id'),
    ).toBe('users')
  })

  test('case insensitive FROM keyword', () => {
    expect(extractTableFromSelect('select * from Users')).toBe('Users')
  })
})
