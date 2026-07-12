import { describe, expect, test } from 'bun:test'
import { getTableRef, quoteIdentifier } from '../sql-generator'

describe('SQL identifier quoting', () => {
  test('escapes PostgreSQL double quotes', () => {
    expect(quoteIdentifier('user"name', 'postgresql')).toBe('"user""name"')
  })

  test('escapes MySQL backticks', () => {
    expect(quoteIdentifier('order`items', 'mysql')).toBe('`order``items`')
  })

  test('escapes each segment in a qualified table reference', () => {
    expect(
      getTableRef({
        databaseName: 'unused',
        schemaName: 'tenant"one',
        tableName: 'order"items',
        driver: 'postgresql',
      }),
    ).toBe('"tenant""one"."order""items"')
  })
})
