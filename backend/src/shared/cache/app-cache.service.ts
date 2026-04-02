import { Injectable } from '@nestjs/common';

export type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export type CacheSetOptions = {
  ttlMs?: number;
};

export interface CacheStore {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

class MemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    return (this.store.get(key) as CacheEntry<T> | undefined) ?? null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

@Injectable()
export class AppCacheService {
  private readonly defaultTtlMs = parseInt(process.env.CACHE_TTL_MS ?? '60000', 10);
  private readonly store: CacheStore;

  constructor() {
    this.store = new MemoryCacheStore();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.store.get<T>(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      await this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    await this.store.set(key, {
      value,
      expiresAt: Date.now() + (options?.ttlMs ?? this.defaultTtlMs),
    });
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    return factory().then(async (value) => {
      await this.set(key, value, options);
      return value;
    });
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const keys = await this.store.keys();
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        await this.store.delete(key);
      }
    }
  }
}
