import { describe, expect, test } from 'bun:test'
import { isPatchOnlyUpdate } from '../updater'

describe('isPatchOnlyUpdate', () => {
  test('patch bump is patch-only', () => {
    expect(isPatchOnlyUpdate('0.7.3', '0.7.4')).toBe(true)
    expect(isPatchOnlyUpdate('1.2.0', '1.2.9')).toBe(true)
  })

  test('minor bump is significant', () => {
    expect(isPatchOnlyUpdate('0.7.3', '0.8.0')).toBe(false)
  })

  test('major bump is significant', () => {
    expect(isPatchOnlyUpdate('0.7.3', '1.0.0')).toBe(false)
    expect(isPatchOnlyUpdate('1.9.9', '2.0.0')).toBe(false)
  })

  test('tolerates v prefixes', () => {
    expect(isPatchOnlyUpdate('v0.7.3', 'v0.7.5')).toBe(true)
    expect(isPatchOnlyUpdate('v0.7.3', 'v1.0.0')).toBe(false)
  })

  test('unparsable versions are treated as significant', () => {
    expect(isPatchOnlyUpdate('unknown', '1.0.0')).toBe(false)
    expect(isPatchOnlyUpdate('1.0.0', 'nightly')).toBe(false)
  })
})
