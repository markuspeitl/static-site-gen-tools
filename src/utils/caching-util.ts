import { filterFalsy } from "./util";

export function getCachesValue(key: string, caches: Record<string, any>[]): any {
    const truthyCaches: Record<string, any>[] = filterFalsy(caches);
    for (const cache of truthyCaches) {
        if (cache[ key ]) {
            return cache[ key ];
        }
    }
    return null;
}
export function setCachesValue(key: string, value: any, caches: Record<string, any>[]): any {
    const truthyCaches: Record<string, any>[] = filterFalsy(caches);
    for (const cache of truthyCaches) {
        cache[ key ] = value;
    }
    return value;
}
export function syncCachesValue(key: string, value: any, caches: Record<string, any>[]): any {
    const truthyCaches: Record<string, any>[] = filterFalsy(caches);
    for (const cache of truthyCaches) {
        if (!cache[ key ]) {
            cache[ key ] = value;
        }
    }
    return value;
}

export async function getOrCreateCacheItem(itemId: string, createItemFn: (itemId: string) => any, caches: Record<string, any>[]): Promise<any> {
    const cachedItem: any = getCachesValue(itemId, caches);
    if (cachedItem) {
        return syncCachesValue(itemId, cachedItem, caches);
    }
    const createdItem: any = await createItemFn(itemId);
    if (!createdItem) {
        return null;
    }
    return setCachesValue(itemId, createdItem, caches);
}