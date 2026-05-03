/**
 * Cache Manager - Handles API response caching with expiration
 */

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.initMemoryCleanup()
  }

  initMemoryCleanup() {
    // Clean up expired items every 10 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiresAt < now) {
          this.memoryCache.delete(key)
        }
      }
    }, 10 * 60 * 1000)
  }

  // Get from cache
  get(key) {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    if (cached.expiresAt < Date.now()) {
      this.memoryCache.delete(key)
      return null
    }

    return cached.data
  }

  // Set in cache
  set(key, data, durationMs = CACHE_DURATION) {
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + durationMs
    })
  }

  // Clear specific cache
  clear(key) {
    this.memoryCache.delete(key)
  }

  // Clear all cache
  clearAll() {
    this.memoryCache.clear()
  }

  // Get or fetch - wraps API calls with caching
  async getOrFetch(key, fetchFn, durationMs = CACHE_DURATION) {
    const cached = this.get(key)
    if (cached) {
      return cached
    }

    try {
      const data = await fetchFn()
      this.set(key, data, durationMs)
      return data
    } catch (error) {
      // Return stale cache on error if available
      const staleCached = this.memoryCache.get(key)
      if (staleCached) {
        return staleCached.data
      }
      throw error
    }
  }
}

export const cacheManager = new CacheManager()
