import { describe, it, expect } from 'vitest'
import { getCoverIndex, hashSeed } from '@/utils/cover'

describe('Unit: Cover Index Selector', () => {
  it('returns null when there are 0 covers', () => {
    expect(getCoverIndex('assignment-1', 0)).toBeNull()
    expect(getCoverIndex('assignment-1', -1)).toBeNull()
  })

  it('produces stable index for the same seed', () => {
    const idx1 = getCoverIndex('assignment-abc', 6)
    const idx2 = getCoverIndex('assignment-abc', 6)
    expect(idx1).toBe(idx2)
    expect(idx1).not.toBeNull()
    expect(idx1).toBeGreaterThanOrEqual(0)
    expect(idx1).toBeLessThan(6)
  })

  it('always produces an index within range', () => {
    const seeds = ['a', 'b', '123', 'assignment-due-tomorrow', 'uuid-9842', 'test-xyz']
    for (const seed of seeds) {
      const idx = getCoverIndex(seed, 6)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(6)
    }
  })

  it('handles empty string seed safely', () => {
    expect(getCoverIndex('', 6)).toBe(0)
  })

  it('hashes deterministically', () => {
    expect(hashSeed('sample')).toBe(hashSeed('sample'))
    expect(typeof hashSeed('sample')).toBe('number')
  })
})
