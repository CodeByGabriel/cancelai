/**
 * LRU Cache generico usando Map (preserva insertion order).
 *
 * Eviction: ao atingir maxSize, remove a key mais antiga (first key do Map).
 * Complexidade: get/set O(1) amortizado.
 */
export class LRUCache<K, V> {
  private readonly cache = new Map<K, V>();

  constructor(private readonly maxSize: number) {
    if (maxSize < 1) throw new Error('maxSize must be >= 1');
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) return undefined;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete first to refresh position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key)
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
