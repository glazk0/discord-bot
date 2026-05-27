import { redis } from "./client.ts";

const NULL_SENTINEL = " null";

export const cache = {
  async get<T>(key: string): Promise<T | null | undefined> {
    const raw = await redis.get(key);
    if (raw === null) return undefined;
    if (raw === NULL_SENTINEL) return null;
    return JSON.parse(raw) as T;
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = value === null ? NULL_SENTINEL : JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(key, payload, "EX", ttlSeconds);
    } else {
      await redis.set(key, payload);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },
};
