/**
 * Stable hash calculation from string seed.
 */
export function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Returns a 0-based index deterministically picked from seed and count.
 * Returns null if count <= 0.
 */
export function getCoverIndex(seed: string, count: number): number | null {
  if (count <= 0) return null
  if (!seed) return 0
  const hash = hashSeed(seed)
  return hash % count
}
