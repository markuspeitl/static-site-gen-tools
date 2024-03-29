import Module from 'module';
import { calcHash } from '../fragement-cache';
import * as fs from 'fs';
import { FalsyAble } from '../document-compile';

export function getValueFromFnOrVar(fnOrVar: any, ...fnPassArgs: any[]): any {

    if (!fnOrVar) {
        return null;
    }
    if (typeof fnOrVar === 'function') {
        return fnOrVar(...fnPassArgs);
    }
    return fnOrVar;
}

export function getCallDefModuleValOrFn(module: any, propKeys: string[], ...fnPassArgs: any[]): any {
    for (const key of propKeys) {
        if (module[ key ]) {
            return getValueFromFnOrVar(module[ key ], ...fnPassArgs);
        }
    }
    return null;
}

export function getFnFromParam(paramItem: any): (...args: any[]) => any {
    if (!paramItem) {
        return () => null;
    }
    if (typeof paramItem === 'function') {
        return paramItem;
    }
    return () => paramItem;
}

export function getFirstDefPropAsFn(obj: Object, propKeys: string[]): any {
    for (const key of propKeys) {
        if (obj[ key ]) {
            return getFnFromParam(obj[ key ]);
        }
    }
    return null;
}

const defaultTsModulesCache: Record<string, Module> = {};

export async function loadTsModule(modulePath: FalsyAble<string>, tsModulesCache?: Record<string, Module>): Promise<Module | null> {
    if (!modulePath) {
        return null;
    }
    if (!tsModulesCache) {
        tsModulesCache = defaultTsModulesCache;
    }
    if (tsModulesCache[ modulePath ]) {
        return tsModulesCache[ modulePath ];
    }
    if (!fs.existsSync(modulePath)) {
        return null;
    }

    const moduleContent: string = (await fs.promises.readFile(modulePath)).toString();
    if (!moduleContent) {
        return null;
    }
    const moduleId: string = calcHash(moduleContent);
    if (tsModulesCache[ moduleId ]) {
        return tsModulesCache[ moduleId ];
    }

    //tsModulesCache[ moduleId ] = eval(moduleContent);
    tsModulesCache[ moduleId ] = await import(modulePath);
    return tsModulesCache[ moduleId ];

}

export async function getTsModule(moduleContent: FalsyAble<string>, modulePath: FalsyAble<string>, tsModulesCache?: Record<string, Module>): Promise<Module | null> {

    if (!tsModulesCache) {
        tsModulesCache = defaultTsModulesCache;
    }
    let loadedModule: Module | null = await loadTsModule(modulePath, tsModulesCache);
    if (!loadedModule && moduleContent) {
        const moduleId: string = calcHash(moduleContent);

        loadedModule = eval(moduleContent);
        if (loadedModule) {
            tsModulesCache[ moduleId ] = loadedModule;
        }
    }

    return loadedModule;
}