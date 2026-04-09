import { describe, expect, test } from 'bun:test'
import type { ColumnDetail } from '@/types'
import { generateSchema } from '../schema-generators'

const columns: ColumnDetail[] = [
  { name: 'id', data_type: 'integer', nullable: false, key: 'PRI' },
  { name: 'name', data_type: 'varchar', nullable: false },
  { name: 'email', data_type: 'varchar', nullable: true },
  { name: 'age', data_type: 'int', nullable: true },
  { name: 'is_active', data_type: 'boolean', nullable: false },
  { name: 'metadata', data_type: 'jsonb', nullable: true },
  { name: 'created_at', data_type: 'timestamp', nullable: false },
]

describe('generateSchema', () => {
  describe('zod', () => {
    test('generates valid zod schema', () => {
      const result = generateSchema('zod', 'user_profiles', columns)
      expect(result).toContain('import { z } from "zod"')
      expect(result).toContain('export const UserProfilesSchema = z.object({')
      expect(result).toContain('id: z.number().int(), // PRI')
      expect(result).toContain('email: z.string().nullable(),')
      expect(result).toContain('is_active: z.boolean(),')
      expect(result).toContain('metadata: z.unknown().nullable(),')
      expect(result).toContain('created_at: z.string().datetime(),')
      expect(result).toContain('export type UserProfiles = z.infer<typeof UserProfilesSchema>')
    })
  })

  describe('yup', () => {
    test('generates valid yup schema', () => {
      const result = generateSchema('yup', 'user_profiles', columns)
      expect(result).toContain('import * as yup from "yup"')
      expect(result).toContain('id: yup.number().integer().required(), // PRI')
      expect(result).toContain('email: yup.string().nullable(),')
      expect(result).toContain('is_active: yup.boolean().required(),')
    })
  })

  describe('valibot', () => {
    test('generates valid valibot schema', () => {
      const result = generateSchema('valibot', 'user_profiles', columns)
      expect(result).toContain('import * as v from "valibot"')
      expect(result).toContain('id: v.pipe(v.number(), v.integer()), // PRI')
      expect(result).toContain('email: v.nullable(v.string()),')
      expect(result).toContain('export type UserProfiles = v.InferOutput<typeof UserProfilesSchema>')
    })
  })

  describe('typebox', () => {
    test('generates valid typebox schema', () => {
      const result = generateSchema('typebox', 'user_profiles', columns)
      expect(result).toContain('import { Type, type Static } from "@sinclair/typebox"')
      expect(result).toContain('id: Type.Integer(), // PRI')
      expect(result).toContain('email: Type.Union([Type.String(), Type.Null()]),')
      expect(result).toContain('age: Type.Union([Type.Integer(), Type.Null()]),')
      expect(result).toContain('is_active: Type.Boolean(),')
    })

    test('uses Type.Union with Type.Null for nullable columns, not Type.Optional', () => {
      const result = generateSchema('typebox', 'test_table', [
        { name: 'col', data_type: 'varchar', nullable: true },
      ])
      expect(result).toContain('Type.Union([Type.String(), Type.Null()])')
      expect(result).not.toContain('Type.Optional')
    })
  })

  describe('table name conversion', () => {
    test('converts snake_case to PascalCase', () => {
      const result = generateSchema('zod', 'order_line_items', [
        { name: 'id', data_type: 'int', nullable: false },
      ])
      expect(result).toContain('OrderLineItemsSchema')
    })

    test('converts kebab-case to PascalCase', () => {
      const result = generateSchema('zod', 'order-items', [
        { name: 'id', data_type: 'int', nullable: false },
      ])
      expect(result).toContain('OrderItemsSchema')
    })
  })

  describe('SQL type classification', () => {
    test('classifies serial as integer', () => {
      const result = generateSchema('zod', 't', [
        { name: 'id', data_type: 'bigserial', nullable: false },
      ])
      expect(result).toContain('z.number().int()')
    })

    test('classifies decimal as number', () => {
      const result = generateSchema('zod', 't', [
        { name: 'price', data_type: 'decimal(10,2)', nullable: false },
      ])
      expect(result).toContain('z.number()')
    })

    test('classifies uuid', () => {
      const result = generateSchema('zod', 't', [
        { name: 'id', data_type: 'uuid', nullable: false },
      ])
      expect(result).toContain('z.string().uuid()')
    })

    test('classifies bytea as binary', () => {
      const result = generateSchema('zod', 't', [
        { name: 'data', data_type: 'bytea', nullable: false },
      ])
      expect(result).toContain('z.instanceof(Uint8Array)')
    })

    test('classifies array types', () => {
      const result = generateSchema('zod', 't', [
        { name: 'tags', data_type: 'text[]', nullable: false },
      ])
      expect(result).toContain('z.array(z.unknown())')
    })
  })
})
