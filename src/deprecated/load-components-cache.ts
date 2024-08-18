import type { SsgConfig } from "../config";
import type { FalsyAble } from "./helpers/generic-types";
import type { IProcessResource } from "../processing-tree/i-processor";
import path from "path";
import fs from 'fs';
import { anchorAndGlob, globInDirsCollectFlat } from "../utils/globbing";
import { callClassConstructor, getFirstInstanceTargetClass, getModuleId, getTsModule } from "../module-loading/ts-modules";
import { BaseComponent, DocumentData, IInternalComponent } from "./base-component";
import { filterFalsy } from "./helpers/array-util";
import { PassthroughComponent } from "./default/passthrough.component";
import { getFsNodeStat } from "../utils/fs-util";

import { FileComponent } from "./default/file.component";
export async function loadComponentToCaches(modulePath: string, config: SsgConfig, caches: Record<string, IInternalComponent>[]): Promise<FalsyAble<IInternalComponent>> {
    const componentId: string = getComponentIdFromPath(modulePath);
    const foundVal: IInternalComponent = getCachesValue(componentId, caches);
    if (foundVal) {
        return syncCachesValue(componentId, foundVal, caches);
    }
    const loadedComponent: FalsyAble<IInternalComponent> = await getComponentFrom(modulePath, config, null);
    if (!loadedComponent) {
        return null;
    }
    setCachesValue(componentId, loadedComponent, caches);
    return loadedComponent;
}

export async function loadComponents(searchAnchorPaths: string[], componentMatchGlobs: string[], config: SsgConfig, caches?: Record<string, IInternalComponent>[]): Promise<FalsyAble<IInternalComponent[]>> {
    if (!config.defaultComponentsCache) {
        config.defaultComponentsCache = {};
    }
    if (!config.componentsCache) {
        config.componentsCache = {};
    }
    if (!searchAnchorPaths || !componentMatchGlobs) {
        return null;
    }

    return globInDirsCollectFlat(searchAnchorPaths, componentMatchGlobs, loadComponentToCaches, config, caches);
}

export async function loadDefaultComponents(config: SsgConfig): Promise<FalsyAble<BaseComponent[]>> {
    if (!config.defaultComponentsCache) {
        config.defaultComponentsCache = {};
    }
    if (!config.componentsCache) {
        config.componentsCache = {};
    }
    if (!config.defaultComponentImportDirs || !config.defaultComponentsMatchGlobs) {
        return null;
    }

    return loadComponents(config.defaultComponentImportDirs, config.defaultComponentsMatchGlobs, config, [
        config.defaultComponentsCache, config.componentsCache
    ]);
}

export function getCachedDefaultComponent(componentId: string, config: SsgConfig): FalsyAble<IInternalComponent> {
    if (config.defaultComponentsCache && config.defaultComponentsCache[ componentId ]) {
        return config.defaultComponentsCache[ componentId ];
    }
    return null;
}

export async function getImportComponentsPool(importPaths: string[], config: SsgConfig): Promise<Record<string, IInternalComponent>> {
    const currentImportComponentsPool: Record<string, IInternalComponent> = {};

    if (!config.defaultComponentsMatchGlobs) {
        config.defaultComponentsMatchGlobs = [];
    }
    if (!config.defaultComponentsCache) {
        config.defaultComponentsCache = {};
    }

    const loadComponentsPromises: Promise<any>[] = [
        loadDefaultComponents(config),
        loadComponents(importPaths, config.defaultComponentsMatchGlobs, config, [ currentImportComponentsPool ]),
    ];

    await Promise.all(loadComponentsPromises);

    const defaultComponentsCache: Record<string, IInternalComponent> = config.defaultComponentsCache;
    return Object.assign({}, defaultComponentsCache, currentImportComponentsPool);
    //return currentImportComponentsPool;
}

/*export async function loadComponentToCache(modulePath: string, config: SsgConfig, cacheKey: string = 'componentsCache'): Promise<FalsyAble<BaseComponent>> {
    const componentId: string = getComponentIdFromPath(modulePath);
    if (!config[ cacheKey ]) {
        config[ cacheKey ] = {};
    }
    if (config[ cacheKey ][ componentId ]) {
        return config[ cacheKey ][ componentId ];
    }

    const loadedComponent: FalsyAble<BaseComponent> = await getComponentFrom(modulePath, config, null);
    if (!loadedComponent) {
        return null;
    }
    config[ cacheKey ][ componentId ] = loadedComponent;

    return loadedComponent;
}*/