import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { SsgConfig } from '../config';
import type { IProcessor, IProcessResource } from '../pipeline/i-processor';
import type { IInternalComponent } from '../components/base-component';
import type fs from 'fs';
import path from 'path';
import { getComponentFromPath } from '../components/components';
import { getOrCreateCacheItem, syncCachesValue } from "@markus/ts-node-util-mk1";
import { getFsNodeStat } from "@markus/ts-node-util-mk1";
import { anchorAndGlob } from "@markus/ts-node-util-mk1";
import { resolveDataRefPathsFromDocDir } from '../components/component-imports';
import { settleValueOrNull } from "@markus/ts-node-util-mk1";

export type IImportInstance = IProcessor | IInternalComponent;


export type PathOrNameSpace = string | Record<string, string>;
export type ImportSymbolsToPaths = Record<string, PathOrNameSpace>;

export interface ImportReference {
    path?: string;
    as?: string;
    content?: string;
    //Invoke data functionality at import time (for data file: .json, .yml, for components that affect data, .etc)
    data?: boolean;
    //Request standalone rendered instance or instances of the imported components and put the result into a local variable.
    //Example: Render/Import all posts with a certain <import> ed directory and then generate an index by iterating over the resulting collection
    rendered?: boolean;
    where?: string[]; //List of data conditions to match (for globbed or directory style multi imports)
}
//`data` and `rendered` cause the component extractor/compiler to be invoked immediately, instead of using them 
//in the compile content/body of the component.

export function getImportAliasFromFilePath(importPath: string): string {
    const name: string = path.basename(importPath);
    const nameParts: string[] = name.split('.');
    return nameParts[ 0 ];
}

//importRef.as defined + importRef.path refers to a file --> alias the file module by that name
//importRef.as not defined + importRef.path refers to a file --> alias the module by the id extracted from its file name

//importRef.path refers to a glob (multiple files):
// + importRef.as defined --> auto detect symbol for file names ++ apply those symbols under the specified 'namespace' (importRef.as)

//importRef.path refers to a dir --> same as a glob that matches all subfiles (import files under specified importRef.as namespace || import file aliases in current scope)
export async function registerImportReferenceSymbol(importRef: ImportReference | string, importSymbolsToPaths: ImportSymbolsToPaths, namespace?: string): Promise<void> {

    if (typeof importRef === 'string') {
        importRef = {
            path: importRef
        };
    }

    if (!importRef.path) {
        importRef.path = importRef.content;
    }

    if (!importRef.path) {
        console.error(`Can not import: ${importRef} as no path to import was defined`);
        return;
    }

    const importPath: string = importRef.path;

    if (namespace && !importSymbolsToPaths[ namespace ]) {
        importSymbolsToPaths[ namespace ] = {};
    }

    const stat: fs.Stats | null = await getFsNodeStat(importPath);
    if (stat && stat.isFile()) {
        const importAliasSymbol: string = importRef.as || getImportAliasFromFilePath(importPath);

        let targetSymbolPathDict: any = importSymbolsToPaths;
        if (namespace) {
            targetSymbolPathDict = importSymbolsToPaths[ namespace ];
        }

        targetSymbolPathDict[ importAliasSymbol ] = importPath;
        return;
    }

    let subPathGlobs: string[] = [];
    if (stat && stat.isDirectory()) {
        //Select all files under the dir
        subPathGlobs = [
            '/*',
            '/**'
        ];
    }

    const importMatchedPaths: string[] = await anchorAndGlob(subPathGlobs, importPath, false);

    const registerSymbolPromises: Promise<any>[] = [];
    for (const importPath of importMatchedPaths) {

        const subImportRef: ImportReference = {
            path: importPath
        };
        const namespace: string | undefined = importRef.as;
        registerSymbolPromises.push(registerImportReferenceSymbol(subImportRef, importSymbolsToPaths, namespace));
    }
    await settleValueOrNull(registerSymbolPromises);
}

export async function registerImportDirs(dirsToImport: string[], targetSymbolPathsMapper: ImportSymbolsToPaths): Promise<void> {
    for (const importDirPath of dirsToImport) {
        /*const importDirFilesRef: ImportReference = {
            path: path.join(importDirPath, '*'),
        };*/
        const importDirDescendantsRef: ImportReference = {
            path: path.join(importDirPath, '**'),
        };
        //await registerImportReferenceSymbol(importDirFilesRef, targetSymbolPathsMapper);
        await registerImportReferenceSymbol(importDirDescendantsRef, targetSymbolPathsMapper);
    }
}

export async function evaluateLocalImportSymbols(resource: IProcessResource, config: SsgConfig): Promise<ImportSymbolsToPaths> {

    const localImportSymbolPaths: ImportSymbolsToPaths = {};

    //Make any path in data fully qualified
    await resolveDataRefPathsFromDocDir(resource, config);

    const importRefs: ImportReference[] = resource.data.import;

    for (const importRef of importRefs) {
        await registerImportReferenceSymbol(importRef, localImportSymbolPaths);
    }

    return localImportSymbolPaths;
}

export async function initDefaultImportSymbols(config: SsgConfig): Promise<ImportSymbolsToPaths> {
    if (config.defaultImportSymbolPaths) {
        return config.defaultImportSymbolPaths;
    }
    if (!config.defaultImportSymbolPaths) {
        config.defaultImportSymbolPaths = {};
    }

    if (!config.defaultImportsDirs) {
        config.defaultImportsDirs = [];
    }
    await registerImportDirs(config.defaultImportsDirs, config.defaultImportSymbolPaths);
    return config.defaultImportSymbolPaths;
}

export async function initLocalImportSymbols(resource: IProcessResource, config: SsgConfig): Promise<ImportSymbolsToPaths> {
    if (resource.data.localImportSymbols) {
        return resource.data.localImportSymbols;
    }
    const localImportSymbolPaths: ImportSymbolsToPaths = await evaluateLocalImportSymbols(resource, config);
    resource.data.localImportSymbols = localImportSymbolPaths;
    return resource.data.localImportSymbols;
}

export async function initResourceImportSymbols(resource: IProcessResource, config: SsgConfig): Promise<ImportSymbolsToPaths> {

    const defaultImportSymbolPaths: ImportSymbolsToPaths = await initDefaultImportSymbols(config);
    const localImportSymbolPaths: ImportSymbolsToPaths = await initLocalImportSymbols(resource, config);

    const currentImportSymbolsToPaths: ImportSymbolsToPaths = Object.assign({}, defaultImportSymbolPaths, localImportSymbolPaths);
    resource.data.currentImportSymbols = currentImportSymbolsToPaths;
    return currentImportSymbolsToPaths;
}

//Get a flat list of all the referencable symbols available to the scope
// like 'for' or 'mynamespace.for'
export async function getFlatResourceImportSymbols(resource: IProcessResource, config: SsgConfig): Promise<string[]> {

    const currentImportSymbolsToPaths: ImportSymbolsToPaths = await initResourceImportSymbols(resource, config);

    const symbolIds: string[] = [];

    for (const symbolsAlias in currentImportSymbolsToPaths) {

        //const symbolIdKeys: string[] = [ symbolsAlias ];
        const aliasValue: PathOrNameSpace = currentImportSymbolsToPaths[ symbolsAlias ];
        if (typeof aliasValue === 'object') {
            for (const key in aliasValue) {
                symbolIds.push([ symbolsAlias, key ].join('.'));
            }
        }
        else {
            symbolIds.push(symbolsAlias);
        }
    }

    return symbolIds;
}


export async function getImportInstance(symbol: string, resource: IProcessResource, config: SsgConfig): Promise<FalsyAble<IImportInstance>> {
    const currentImportSymbolsToPaths: ImportSymbolsToPaths = resource.data.currentImportSymbols;

    const symbolParts: string[] = symbol.split('.');

    let currentSymbolMapperLevel: any = currentImportSymbolsToPaths;
    for (let i = 0; i < symbolParts.length - 1; i++) {
        const currentLevelKey: string = symbolParts[ i ];
        currentSymbolMapperLevel = currentSymbolMapperLevel[ currentLevelKey ];
    }

    const lastSymbolPart: string | undefined = symbolParts.at(-1);
    if (!lastSymbolPart || !currentSymbolMapperLevel[ lastSymbolPart ]) {
        return null;
    }

    const symbolImportModulePath: string = currentSymbolMapperLevel[ lastSymbolPart ];

    if (!config.globalImportsCache) {
        config.globalImportsCache = {};
    }

    const cachedImportInstance: IImportInstance | undefined = config.globalImportsCache[ symbolImportModulePath ];
    if (cachedImportInstance) {
        return cachedImportInstance;
    }

    return loadImportInstanceFromPath(symbolImportModulePath, config.globalImportsCache, config);
}

export async function loadImportInstanceFromPath(importFilePath: string, cache: Record<string, IImportInstance>, config: SsgConfig = {}): Promise<FalsyAble<IImportInstance>> {
    if (cache[ importFilePath ]) {
        return cache[ importFilePath ];
    }

    return getComponentFromPath(importFilePath, config);
    //TODO handle all the different importable file types
}

//export async function loadDefaultImportSymbols

/**
 * At component:
 * 1. Get symbols referenced in current scope (default symbols + symbols from explicit imports)
 * 2. Check in content if any of the symbols are used
 * 3. Replace detected nodes/components with placeholders
 * 4. Compile
 * 5. Get symbols from pending sub compiles
 * 6. Get Instance of the import referenced by the symbol (get instance from cache, or use the ModuleLoader to instantiate the component/import)
 */


/**
 * Types of imports:
 * - Data file import (.json, .yml, .txt, .etc) --> should use registered processors to read data:
 *  1. If no rename symbol defined --> merge data from import into current scope (at data extraction time)
 *  2. If 'as="myname' property is defined then data is loaded to sub variable
 * - Document import (.md, .html, .njk, .liquid, .etc):
 *  1. Use according processors, based on document type to process
 * - Processors:
 *  1. Load processor from file
 * - Functions (.ts only):
 *  1. Load default export function (similarly called as component) --> but can only process data
 *  2. Usage as normal fn (if we simply covert it to a component, then the whole data scope is forked --> instead we could only use data passed as attributes + content)
 * - Data default export
 *  1. Check if default export it is an object (and not a component or processor)
 * - Component:
 * 
 * 
 * Types of imports based on eval time:
 * - Data imports (call on import, as importing happens during data evaluation)
 * - Functional imports (instantiate on first usage)
 * 
 * Functional imports should be the default (--really lightweight helper functions become possible)
 * Data imports, need to either be marked, or need to be a certain file type (.json, .yml, .txt)
 * 
 * Components might have both Data and Fn functionality and therefore would need to be loaded at import time.
 * Most components currently have no `data` functionality. (they are more functions that are called on the content and not so much on the data)
 * 
 * 
 * ADD property to importRef that tells import statement to invoke
 * an imported module instance immediately (process, or, data, depending on what it is)
 * 
 */


/**
 * Initialization:
 * 1. Find and load default import symbols and import loaders (we do not need to actually dynamically import the modules yet)
 * add the import symbols
 * 
 * 
 * 
 * Symbols are aliases to modules imported into the current scope:
 *  - They are not unique globally: (but their associated paths are)
 * 
 * 
 * globalImportLoadersCache: Record<symbolAlias: string, >
 * 
 * 
 * properties of a ImportLoader:
 * - 
 * 
 * 
 * 
 * 
 * //Holds all initialized import IProcessor Modules (uniquely associated with their path)
 * globalImportsCache: Record<filePath: string, importInstance: IProcessor>
 * globalImportLoadersCache: Record<filePath: string, importInstance: IModuleLoader>
 * 
 * //defaultImportLoadersCache: Record<filePath: string, importInstance: IModuleLoader>;
 * //defaultImportsCache: Record<filePath: string, importInstance: IModuleLoader>;
 * 
 * defaultImportsSymbolsToPaths: Record<symbol: string, path: string>
 * 
 * For current scope/resource:
 * - localImportSymbolsToPaths: Record<symbol: string, path: string> (based on the data.import property)
 * - currentImportSymbolsToPaths = defaultImportsSymbolsToPaths + localImportSymbolsToPaths
 * - With 'currentImportSymbolsToPaths' we can find the referenced modules in the resource body, and create the IModuleLoaders for them if they are not
 * available with their path in 'globalImportLoadersCache'
 * - Then when it comes to compiling these modules, we can look up their path via the symbol,
 * and get the IProcessor or IInternalComponent instance from them by either dynamically creating using 'globalImportLoadersCache' or getting the cached version from
 * 'globalImportsCache'
 */

/*export interface IImportLoader {
    getInstance(): Promise<IImportInstance>;
}

export function getSymbolFromPath(runnerPath: string): string {
    //TODO extend to other importable file type
    return getModuleId(runnerPath, '.component');
}

export async function pathToImportLoader(modulePath: string, config: SsgConfig, caches: Record<string, IImportLoader>[]): Promise<FalsyAble<IImportLoader>> {
    const importUseSymbol: string = getSymbolFromPath(modulePath);
    const createImportLoaderFn = (symbolId: string) => {
        return {
            getInstance: () => getComponentFrom(modulePath, config, undefined)
        };
    };

    return getOrCreateCacheItem(importUseSymbol, createImportLoaderFn, caches);
}

export async function getImportLoadersFrom(dirPaths: string[], fileMatchGlobs: string[] | undefined, config: SsgConfig, cache: Record<string, IImportLoader>): Promise<Record<string, IImportLoader>> {
    if (!fileMatchGlobs) {
        fileMatchGlobs = [ '*', '**' ];
    }

    const dirsLoadedImportLoaders: Record<string, IImportLoader> = {};

    await globInDirsCollectFlat(dirPaths, fileMatchGlobs, pathToImportLoader, config, [ dirsLoadedImportLoaders, cache ]);

    return dirsLoadedImportLoaders;
}

export async function loadDefaultComponentImportLoaders(config: SsgConfig): Promise<void> {
    if (!config.defaultImportsDirs || !config.defaultImportsMatchGlobs) {
        return;
    }
    if (!config.importLoadersCache) {
        config.importLoadersCache = {};
    }
    //const defaultImportLoadersCache: Record<string, IImportLoader> = config.defaultImportLoaders;

    const defaultImportLoaders: Record<string, IImportLoader> = await getImportLoadersFrom(config.defaultImportsDirs, config.defaultImportsMatchGlobs, config, config.importLoadersCache);

    config.defaultImportSymbols = Object.keys(defaultImportLoaders);
    return;
}



export async function getCurrentScopeImportSymbols(resource: IProcessResource, config: SsgConfig): Promise<string[]> {
    await resolveImportsFromDocDir(resource, config);

    if (!resource?.data?.imports || resource.data.imports.length === 0) {
        return config.defaultImportSymbols || [];
    }
    if (resource.control?.importScope) {
        return Object.keys(resource.control.importScope);
    }
    if (!config.importLoadersCache) {
        config.importLoadersCache = {};
    }
    if (!resource.control) {
        resource.control = {};
    }

    const importPaths: string[] = resource.data.imports;
    const currentScopeImportLoaders: Record<string, IImportLoader> = await getImportLoadersFrom(importPaths, [], config, config.importLoadersCache);
    return Object.keys(currentScopeImportLoaders);
}

export async function getImportInstancesFromSymbols(importSymbols: string[], resource: IProcessResource, config: SsgConfig): Promise<Record<string, IImportInstance>> {

    if (!config.importLoadersCache) {
        config.importLoadersCache = {};
    }

    const importInstancesCaches: any[] = [ resource.control?.importScope, config.importInstancesCache ];
    const importLoadersCache: Record<string, IImportLoader> = config.importLoadersCache;
    const loadedImportInstances: Record<string, IImportInstance> = {};

    for (const importLoaderSymbol of importSymbols) {

        const createImportInstanceFn = async (symbolId: string) => {
            const newImportInstance: IImportInstance = await importLoadersCache[ importLoaderSymbol ].getInstance();
            return newImportInstance;
        };

        loadedImportInstances[ importLoaderSymbol ] = await getOrCreateCacheItem(importLoaderSymbol, createImportInstanceFn, importInstancesCaches);
    }

    return loadedImportInstances;
}*/
