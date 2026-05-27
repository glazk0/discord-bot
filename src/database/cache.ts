import { getTableName, is, Table } from "drizzle-orm";
import { Cache, type MutationOption } from "drizzle-orm/cache/core";
import type { CacheConfig } from "drizzle-orm/cache/core/types";
import type { Redis } from "ioredis";

const QUERY_PREFIX = "drizzle:query:";
const TABLE_PREFIX = "drizzle:table:";
const DEFAULT_TTL_MS = 60_000;

export class IoredisCache extends Cache {
  constructor(private readonly redis: Redis) {
    super();
  }

  override strategy(): "explicit" {
    return "explicit";
  }

  override async get(key: string): Promise<unknown[] | undefined> {
    const raw = await this.redis.get(QUERY_PREFIX + key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as unknown[];
  }

  override async put(
    key: string,
    response: unknown,
    tables: string[],
    _isTag: boolean,
    config?: CacheConfig,
  ): Promise<void> {
    const payload = JSON.stringify(response);
    const ttlMs = resolveTtlMs(config) ?? DEFAULT_TTL_MS;

    const pipeline = this.redis.pipeline();

    pipeline.set(QUERY_PREFIX + key, payload, "PX", ttlMs);

    for (const table of tables) {
      pipeline.sadd(TABLE_PREFIX + table, key);
    }

    await pipeline.exec();
  }

  override async onMutate({ tags, tables }: MutationOption): Promise<void> {
    const tagList = Array.isArray(tags) ? tags : tags ? [tags] : [];
    const tableList = Array.isArray(tables) ? tables : tables ? [tables] : [];
    const tableNames = tableList.map((t) => (is(t, Table) ? getTableName(t) : t));

    const pipeline = this.redis.pipeline();

    for (const tag of tagList) {
      pipeline.del(QUERY_PREFIX + tag);
    }

    if (tableNames.length > 0) {
      const setKeys = tableNames.map((name) => TABLE_PREFIX + name);
      const members = await this.redis.sunion(...setKeys);
      for (const member of members) {
        pipeline.del(QUERY_PREFIX + member);
      }
      for (const setKey of setKeys) {
        pipeline.del(setKey);
      }
    }

    await pipeline.exec();
  }
}

function resolveTtlMs(config: CacheConfig | undefined): number | null {
  if (!config) return null;
  if (config.ex !== undefined) return config.ex * 1000;
  if (config.px !== undefined) return config.px;
  if (config.exat !== undefined) return Math.max(0, config.exat * 1000 - Date.now());
  if (config.pxat !== undefined) return Math.max(0, config.pxat - Date.now());
  return null;
}
