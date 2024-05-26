import type { SsgConfig } from "../config";
import type { FalsyAble } from "./helpers/generic-types";
import type { IProcessResource } from "../pipeline/i-processor";
import path from "path";
import fs from 'fs';
import { anchorAndGlob, globInDirsCollectFlat } from "../utils/globbing";
import { callClassConstructor, getFirstInstanceTargetClass, getModuleId, getTsModule } from "../module-loading/ts-modules";
import { BaseComponent, DocumentData, IInternalComponent } from "./base-component";
import { filterFalsy } from "./helpers/array-util";
import { PassthroughComponent } from "./default/passthrough.component";
import { getFsNodeStat } from "../utils/fs-util";

import { FileComponent } from "./default/file.component";


export function getComponentIdFromPath(runnerPath: string): string {
    return getModuleId(runnerPath, '.component');
}

export function getTargetModulePath(dataCtx: FalsyAble<DocumentData>): FalsyAble<string> {
    if (!dataCtx) {
        return null;
    }
    const componentModulePath: string = dataCtx?.inputPath || dataCtx?.path || dataCtx?.src;
    return componentModulePath;
}

//Only 1 component per file is allowed right now
export function moduleToComponentInstance(module: any): FalsyAble<IInternalComponent> {

    let componentInstance: BaseComponent | null = null;
    const passThroughComponent: PassthroughComponent = new PassthroughComponent();

    const defaultExport = module.default;
    if (defaultExport) {
        if (defaultExport.constructor) {
            //A component class is exported
            componentInstance = callClassConstructor(defaultExport.constructor);
        }
        if (defaultExport.render || module.data) {
            //A component instance is exported through default
            componentInstance = defaultExport;
        }
        if (typeof defaultExport === 'function') {
            //A rendering function is exported through default export
            componentInstance = passThroughComponent;
            componentInstance.render = defaultExport;
        }
    }

    if (module.render || module.data) {
        //The module itself is a component
        componentInstance = module as BaseComponent;
    }

    if (!componentInstance) {
        componentInstance = getFirstInstanceTargetClass(module, '.+Component.*', [ 'render' ]);
    }

    if (!componentInstance) {
        return null;
    }
    //The module contains a Component (as we are using the file name as id, currently only 1 component per file is allowed)

    if (!componentInstance.render) {
        componentInstance.render = passThroughComponent.render;
    }
    if (!componentInstance.data) {
        componentInstance.data = passThroughComponent.data;
    }

    if (componentInstance.render && typeof componentInstance.render === 'string') {

        const renderContent: string = componentInstance.render;
        componentInstance.render = async (dataCtx?: DocumentData | null, config?: SsgConfig) => {
            return {
                content: renderContent,
                data: dataCtx,
            };
        };
    }
    if (componentInstance.data && typeof componentInstance.data === 'object') {

        const staticData: Object = componentInstance.data;
        componentInstance.data = async (dataCtx?: DocumentData | null, config?: SsgConfig) => {
            return {
                content: '',
                data: staticData //Object.assign(staticData, dataCtx),
            };
        };
    }

    //TODO add special component: not function and export is specified, but the 'data', 'config' properties can be assumed to
    //be available during runtime and the compiled document string is printed to std.out

    return componentInstance as FalsyAble<IInternalComponent>;
}


export async function getComponentFrom(componentPath: FalsyAble<string>, config?: SsgConfig, moduleContent?: FalsyAble<string>): Promise<FalsyAble<IInternalComponent>> {

    if ((componentPath && componentPath.endsWith('.ts')) || moduleContent) {
        return getTsComponentFrom(componentPath, config, moduleContent);
    }

    if (componentPath) {

        return new FileComponent(componentPath);
        //return getComponentFromPath(componentPath, config);
    }
    return null;
}

export async function getTsComponentFrom(componentPath: FalsyAble<string>, config?: SsgConfig, moduleContent?: FalsyAble<string>): Promise<FalsyAble<IInternalComponent>> {
    let loadedModule: any = await getTsModule(moduleContent, componentPath, config?.tsModulesCache);
    if (!loadedModule) {
        return null;
    }

    return moduleToComponentInstance(loadedModule);

    //const componentInstance: BaseComponent = loadedModule.default;

    /*if (componentPath) {
        const componentId: string = getComponentIdFromPath(componentPath);
        (componentInstance as any).id = componentId;
    }*/

    //return componentInstance;
}

export async function getComponent(dataCtx?: DocumentData | null, moduleContent?: FalsyAble<string>, config?: SsgConfig): Promise<FalsyAble<IInternalComponent>> {

    const modulePath: FalsyAble<string> = getTargetModulePath(dataCtx);
    return getComponentFrom(modulePath, config, moduleContent);
}

export function getCachesValue(key: string, caches: Record<string, any>[]): any {
    const truthyCaches: Record<string, IInternalComponent>[] = filterFalsy(caches);
    for (const cache of truthyCaches) {
        if (cache[ key ]) {
            return cache[ key ];
        }
    }
    return null;
}
export function setCachesValue(key: string, value: any, caches: Record<string, any>[]): void {
    const truthyCaches: Record<string, IInternalComponent>[] = filterFalsy(caches);
    for (const cache of truthyCaches) {
        cache[ key ] = value;
    }
}
export function syncCachesValue(key: string, value: any, caches: Record<string, any>[]): any {
    const truthyCaches: Record<string, IInternalComponent>[] = filterFalsy(caches);
    for (const cache of truthyCaches) {
        if (!cache[ key ]) {
            cache[ key ] = value;
        }
    }
    return value;
}

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