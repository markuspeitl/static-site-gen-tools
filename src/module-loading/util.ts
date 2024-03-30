import Module from 'module';
import { calcHash } from '../fragement-cache';
import * as fs from 'fs';
import path from 'path';
import { arrayifyFilter, FalsyAble } from '../utils/util';
import { SingleOrArray } from '../utils/util2';
import { SsgConfig } from '../config';

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

export async function loadTsModule<ModuleInterface>(modulePath: FalsyAble<string>, tsModulesCache?: Record<string, Module>): Promise<ModuleInterface | null> {
    if (!modulePath) {
        return null;
    }
    if (!tsModulesCache) {
        tsModulesCache = defaultTsModulesCache;
    }
    if (tsModulesCache[ modulePath ]) {
        return tsModulesCache[ modulePath ] as ModuleInterface | null;
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
        return tsModulesCache[ moduleId ] as ModuleInterface | null;
    }

    //tsModulesCache[ moduleId ] = eval(moduleContent);
    tsModulesCache[ moduleId ] = await import(modulePath);
    return tsModulesCache[ moduleId ] as ModuleInterface | null;

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

export function findExistingPathFromRelative(relPath: string, resolvePathRoots: SingleOrArray<FalsyAble<string>>): string | null {
    const passedResolveRoots: string[] = arrayifyFilter(resolvePathRoots) as string[];

    for (const resolvePathRoot of passedResolveRoots) {

        const documentRunnerPath: string = path.join(resolvePathRoot, relPath);
        if (fs.existsSync(documentRunnerPath)) {
            return documentRunnerPath;
        }
    }
    return null;
}

export function findExistingPath(relOrAbsPath: string, relResolvePathRoots: SingleOrArray<FalsyAble<string>>): string | null {
    if (!relOrAbsPath) {
        return null;
    }

    if (path.isAbsolute(relOrAbsPath) && fs.existsSync(relOrAbsPath)) {
        return relOrAbsPath;
    }
    const absTargetModulePath: string | null = findExistingPathFromRelative(relOrAbsPath, relResolvePathRoots);
    return absTargetModulePath;
}

export async function getResolveTsModule<ModuleInterface>(moduleIdOrPath: string, resolvePathRoots: SingleOrArray<FalsyAble<string>>, tsModulesCache?: Record<string, Module>, config?: SsgConfig): Promise<ModuleInterface | null> {
    if (!config) {
        config = {};
    }
    if (!tsModulesCache) {
        tsModulesCache = config.tsModulesCache;
    }
    if (!resolvePathRoots) {
        resolvePathRoots = [];
    }
    if (!tsModulesCache) {
        tsModulesCache = defaultTsModulesCache;
    }
    if (tsModulesCache[ moduleIdOrPath ]) {
        return tsModulesCache[ moduleIdOrPath ] as ModuleInterface;
    }

    let moduleAbsPath: string | null = findExistingPath(moduleIdOrPath, resolvePathRoots);

    const loadedModule: ModuleInterface | null = await loadTsModule<ModuleInterface>(moduleAbsPath, tsModulesCache);

    return loadedModule;
}

export async function getResolveTsModuleWithConfig<ModuleInterface>(
    moduleIdOrPath: string | null,
    resolvePathRoots: SingleOrArray<FalsyAble<string>>,
    tsModulesCache?: Record<string, Module>,
    config?: SsgConfig,
    configResolvePathsKey?: string,
): Promise<ModuleInterface | null> {

    if (!moduleIdOrPath) {
        return null;
    }

    if (!config) {
        return null;
    }
    if (!tsModulesCache) {
        tsModulesCache = config.tsModulesCache;
    }
    let configResolvePaths: string[] = [];
    if (configResolvePathsKey) {
        configResolvePaths = config[ configResolvePathsKey ];
    }

    let filteredResolvePaths: string[] = arrayifyFilter(resolvePathRoots) as string[];
    filteredResolvePaths = filteredResolvePaths.concat(configResolvePaths);

    return getResolveTsModule<ModuleInterface>(moduleIdOrPath, filteredResolvePaths, tsModulesCache, config);
}


export async function loadModulesFrom(srcDirPath: string, extension: string = 'ts'): Promise<Module[] | null> {
    //const compilersDirRel = './compilers';
    //let compilersDirPath = path.join(__dirname, compilersDirRel);

    if (!path.isAbsolute(srcDirPath)) {
        srcDirPath = path.join(process.cwd(), srcDirPath);
    }

    if (!fs.existsSync(srcDirPath)) {
        return null;
    }

    const srcDirFiles: string[] = await fs.promises.readdir(srcDirPath);

    const loadedModules: Module[] = [];

    for (const dirFile of srcDirFiles) {
        const dirFileAbs = path.join(srcDirPath, dirFile);
        const dirFileParsed: path.ParsedPath = path.parse(dirFileAbs);
        //const dirFileName = dirFileParsed.name;
        const dirFileExt = dirFileParsed.ext;

        if (dirFileExt === extension) {
            const loadedTsModule: Module | null = await loadTsModule(dirFileAbs);
            if (loadedTsModule) {
                loadedModules.push(loadedTsModule);
            }

        }

    }
    return loadedModules;
}