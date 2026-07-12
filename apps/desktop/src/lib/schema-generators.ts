import type { ColumnDetail } from '@/types'

export type ValidatorLib = 'zod' | 'yup' | 'valibot' | 'typebox'

export const VALIDATOR_OPTIONS: { value: ValidatorLib; label: string }[] = [
  { value: 'zod', label: 'Zod' },
  { value: 'yup', label: 'Yup' },
  { value: 'valibot', label: 'Valibot' },
  { value: 'typebox', label: 'TypeBox' },
]

export function generateSchema(
  lib: ValidatorLib,
  tableName: string,
  columns: ColumnDetail[],
): string {
  switch (lib) {
    case 'zod':
      return generateZod(tableName, columns)
    case 'yup':
      return generateYup(tableName, columns)
    case 'valibot':
      return generateValibot(tableName, columns)
    case 'typebox':
      return generateTypeBox(tableName, columns)
  }
}

// ── Shared helpers ───────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

type SqlCategory =
  | 'int'
  | 'number'
  | 'bool'
  | 'date'
  | 'json'
  | 'uuid'
  | 'binary'
  | 'array'
  | 'string'

function classifySqlType(dataType: string): SqlCategory {
  const t = dataType.toLowerCase()
  if (t.includes('int') || t.includes('serial')) return 'int'
  if (
    t.includes('decimal') ||
    t.includes('numeric') ||
    t.includes('float') ||
    t.includes('double') ||
    t.includes('real') ||
    t.includes('money')
  )
    return 'number'
  if (t.includes('bool') || t === 'bit') return 'bool'
  if (t.includes('date') || t.includes('time') || t.includes('timestamp') || t.includes('year'))
    return 'date'
  if (t === 'json' || t === 'jsonb') return 'json'
  if (t === 'uuid') return 'uuid'
  if (t.includes('blob') || t.includes('binary') || t.includes('bytea')) return 'binary'
  if (t.includes('[]') || t.includes('array')) return 'array'
  return 'string'
}

// ── Zod ──────────────────────────────────────────────────────

function zodType(cat: SqlCategory): string {
  const map: Record<SqlCategory, string> = {
    int: 'z.number().int()',
    number: 'z.number()',
    bool: 'z.boolean()',
    date: 'z.string().datetime()',
    json: 'z.unknown()',
    uuid: 'z.string().uuid()',
    binary: 'z.instanceof(Uint8Array)',
    array: 'z.array(z.unknown())',
    string: 'z.string()',
  }
  return map[cat]
}

function generateZod(tableName: string, columns: ColumnDetail[]): string {
  const name = toPascalCase(tableName)
  const fields = columns.map((c) => {
    let t = zodType(classifySqlType(c.data_type))
    if (c.nullable) t = `${t}.nullable()`
    const comment = c.key ? ` // ${c.key}` : ''
    return `  ${c.name}: ${t},${comment}`
  })
  return [
    'import { z } from "zod"',
    '',
    `export const ${name}Schema = z.object({`,
    ...fields,
    '})',
    '',
    `export type ${name} = z.infer<typeof ${name}Schema>`,
  ].join('\n')
}

// ── Yup ──────────────────────────────────────────────────────

function yupType(cat: SqlCategory): string {
  const map: Record<SqlCategory, string> = {
    int: 'yup.number().integer()',
    number: 'yup.number()',
    bool: 'yup.boolean()',
    date: 'yup.date()',
    json: 'yup.mixed()',
    uuid: 'yup.string().uuid()',
    binary: 'yup.mixed()',
    array: 'yup.array()',
    string: 'yup.string()',
  }
  return map[cat]
}

function generateYup(tableName: string, columns: ColumnDetail[]): string {
  const name = toPascalCase(tableName)
  const fields = columns.map((c) => {
    let t = yupType(classifySqlType(c.data_type))
    if (c.nullable) t = `${t}.nullable()`
    else t = `${t}.required()`
    const comment = c.key ? ` // ${c.key}` : ''
    return `  ${c.name}: ${t},${comment}`
  })
  return [
    'import * as yup from "yup"',
    '',
    `export const ${name}Schema = yup.object({`,
    ...fields,
    '})',
    '',
    `export type ${name} = yup.InferType<typeof ${name}Schema>`,
  ].join('\n')
}

// ── Valibot ──────────────────────────────────────────────────

function valibotType(cat: SqlCategory): string {
  const map: Record<SqlCategory, string> = {
    int: 'v.pipe(v.number(), v.integer())',
    number: 'v.number()',
    bool: 'v.boolean()',
    date: 'v.pipe(v.string(), v.isoTimestamp())',
    json: 'v.unknown()',
    uuid: 'v.pipe(v.string(), v.uuid())',
    binary: 'v.instance(Uint8Array)',
    array: 'v.array(v.unknown())',
    string: 'v.string()',
  }
  return map[cat]
}

function generateValibot(tableName: string, columns: ColumnDetail[]): string {
  const name = toPascalCase(tableName)
  const fields = columns.map((c) => {
    let t = valibotType(classifySqlType(c.data_type))
    if (c.nullable) t = `v.nullable(${t})`
    const comment = c.key ? ` // ${c.key}` : ''
    return `  ${c.name}: ${t},${comment}`
  })
  return [
    'import * as v from "valibot"',
    '',
    `export const ${name}Schema = v.object({`,
    ...fields,
    '})',
    '',
    `export type ${name} = v.InferOutput<typeof ${name}Schema>`,
  ].join('\n')
}

// ── TypeBox ──────────────────────────────────────────────────

function typeboxType(cat: SqlCategory): string {
  const map: Record<SqlCategory, string> = {
    int: 'Type.Integer()',
    number: 'Type.Number()',
    bool: 'Type.Boolean()',
    date: 'Type.String({ format: "date-time" })',
    json: 'Type.Unknown()',
    uuid: 'Type.String({ format: "uuid" })',
    binary: 'Type.Uint8Array()',
    array: 'Type.Array(Type.Unknown())',
    string: 'Type.String()',
  }
  return map[cat]
}

function generateTypeBox(tableName: string, columns: ColumnDetail[]): string {
  const name = toPascalCase(tableName)
  const fields = columns.map((c) => {
    let t = typeboxType(classifySqlType(c.data_type))
    if (c.nullable) t = `Type.Union([${t}, Type.Null()])`
    const comment = c.key ? ` // ${c.key}` : ''
    return `  ${c.name}: ${t},${comment}`
  })
  return [
    'import { Type, type Static } from "@sinclair/typebox"',
    '',
    `export const ${name}Schema = Type.Object({`,
    ...fields,
    '})',
    '',
    `export type ${name} = Static<typeof ${name}Schema>`,
  ].join('\n')
}
