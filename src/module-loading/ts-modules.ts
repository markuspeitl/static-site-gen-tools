import Module from 'module';
import { calcHash } from '../fragement-cache';
import * as fs from 'fs';
import path from 'path';
import { SsgConfig } from '../config';
import { FalsyAble, SingleOrArray } from '../components/helpers/generic-types';
import { arrayifyFilter } from '../components/helpers/array-util';
import {
    requireFromString,
    importFromString,
    importFromStringSync
} from 'module-from-string';
import * as ts from "typescript";
import { unescape } from 'lodash';

export function callClassConstructor(classType) {
    const factoryFunction = classType.bind.apply(classType, arguments);
    return new factoryFunction();
}

export function getClassInstance(className: string, classType: any, nameRegexPattern?: string, requiredClassProps?: string[]): any | null {

    let classProto = classType;
    if (classProto.prototype) {
        classProto = classType.prototype;
    }

    if (className && nameRegexPattern) {
        const nameRegexp = new RegExp(nameRegexPattern);
        if (!nameRegexp.test(className)) {
            return null;
        }
    }

    let passFnTest: boolean = true;
    if (requiredClassProps) {
        passFnTest = requiredClassProps.every((classFn) => Boolean(classProto[ classFn ] && typeof classProto[ classFn ] !== 'undefined' /*&& typeof classProto[ classFn ] === 'function'*/));
    }

    if (passFnTest) {
        const newPrototype = Object.create(classType);
        //const constructor = classType.constructor.bind.apply(classType.contructor);
        //const initConstructorInstance = new constructor();
        const initConstructorInstance = callClassConstructor(classType);
        //const initConstructorInstance = new newPrototype.constructor();
        return initConstructorInstance;

    }
    return null;
}

export function getFirstInstanceTargetClass(module: Module, nameRegex?: string, requiredClassProps?: string[]): any {

    for (const modulePropKey in module) {
        const propValue = module[ modulePropKey ];
        const firstMatchingInstance: any = getClassInstance(modulePropKey, propValue, nameRegex, requiredClassProps);
        if (firstMatchingInstance) {
            return firstMatchingInstance;
        }
    }
    return null;
}

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

export function getFirstDefPropAsFn(obj: Object | null | undefined, propKeys: string[]): any {
    if (!obj) {
        return null;
    }

    for (const key of propKeys) {
        if (obj[ key ]) {
            return getFnFromParam(obj[ key ]);
        }
    }
    return null;
}

const defaultTsModulesCache: Record<string, Module> = {};

export async function loadTsModuleFromPath<ModuleInterface>(modulePath: FalsyAble<string>, tsModulesCache?: Record<string, Module>): Promise<ModuleInterface | null> {
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


function ts2EsCompile(tsCode: string, moduleType: ts.ModuleKind): string {
    //const options: ts.TranspileOptions = { compilerOptions: { module: moduleType } };
    const compiledTs = ts.transpileModule(tsCode, {});
    const dia = compiledTs.diagnostics;
    return compiledTs.outputText;

    //return ts.transpileModule(tsCode, options).outputText;
}


export async function loadTsModuleFromPathFromString<ModuleInterface>(moduleContent: FalsyAble<string>, tsModulesCache?: Record<string, Module>): Promise<ModuleInterface | null> {
    if (!moduleContent) {
        return null;
    }
    if (!tsModulesCache) {
        tsModulesCache = defaultTsModulesCache;
    }

    const moduleId: string = calcHash(moduleContent);

    //https://stackoverflow.com/questions/57121467/import-a-module-from-string-variable
    //const base64EncodedModule = `data:text/javascript;base64,${btoa(moduleContent)}`;

    //const unescaped = unescape(moduleContent);
    const jsModuleContent: string = ts2EsCompile(moduleContent, ts.ModuleKind.Node16);

    const loadedModule: any = await requireFromString(jsModuleContent);

    //const loadedModule: Module = await importFromString(jsModuleContent);


    //loadedModule = eval(moduleContent);
    //const loadedModule: Module | null = await import(base64EncodedModule);
    if (loadedModule) {
        tsModulesCache[ moduleId ] = loadedModule;
    }
    return loadedModule as ModuleInterface;
}

export async function getTsModule(moduleContent: FalsyAble<string>, modulePath: FalsyAble<string>, tsModulesCache?: Record<string, Module>): Promise<Module | null> {

    if (!tsModulesCache) {
        tsModulesCache = defaultTsModulesCache;
    }

    if (modulePath && !path.isAbsolute(modulePath)) {
        modulePath = path.join(process.cwd(), modulePath);
    }

    let loadedModule: Module | null = null;
    try {
        loadedModule = await loadTsModuleFromPath(modulePath, tsModulesCache);
    }
    catch (error: any) {
        console.error(`Failed to load ts module at ${loadedModule}:`);
        console.error(`Reason:`);
        console.error(error);
    }
    if (!loadedModule && moduleContent) {

        try {
            loadedModule = await loadTsModuleFromPathFromString(moduleContent, tsModulesCache);
        }
        catch (error: any) {
            console.error(`Failed to load ts module from string:\n ${moduleContent}`);
            console.error(`Reason:`);
            console.error(error);
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

    const loadedModule: ModuleInterface | null = await loadTsModuleFromPath<ModuleInterface>(moduleAbsPath, tsModulesCache);

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
            const loadedTsModule: Module | null = await loadTsModuleFromPath(dirFileAbs);
            if (loadedTsModule) {
                loadedModules.push(loadedTsModule);
            }

        }

    }
    return loadedModules;
}

export function getModuleId(modulePath: string, excludePostFix?: string): string {
    const parsedModulePath: path.ParsedPath = path.parse(modulePath);
    let parsedModuleName: string = parsedModulePath.name;
    if (!excludePostFix) {
        return parsedModuleName;
    }
    const postfixIndex = parsedModuleName.indexOf(excludePostFix);
    if (postfixIndex > -1) {
        return parsedModuleName.slice(0, postfixIndex);
    }
    return parsedModuleName;
}