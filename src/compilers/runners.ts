import path from "path";
import { SsgConfig } from "../config";
import { defaultCompileRunnersFileMap } from "../deprecated/defaults";
import { getFirstInstanceTargetClass, getModuleId, getResolveTsModule, loadTsModuleFromPath } from "../module-loading/ts-modules";
import { FalsyAble, FalsyString } from "../components/helpers/generic-types";
import { setDefaults } from "../utils/arg-util";
import { MatchedDictKeyRes, getKeyMatches } from "../utils/regex-match-util";
import { anchorAndGlob } from "../utils/globbing";
import Module from "module";
import { arrayify, filterFalsy } from "../utils/util";

export type DocumentData = Record<string, any>;

export interface DataParsedDocument {
    id?: string;
    content?: any; //string | null;
    data?: DocumentData | null;
}
export interface DocumentCompileData extends DataParsedDocument {
    dataCtx?: DocumentData | null;
}

export interface DataExtractor {
    extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}
export interface DocumentCompiler {
    compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}

export interface CompileRunner extends DataExtractor, DocumentCompiler {
    //compile(fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: SsgConfig);
    //extractData(fileContent: string, config?: SsgConfig);
}

export type CompileRunners = Record<string, CompileRunner>;
export type DocumentCompilers = Record<string, DocumentCompiler>;
export type DataExtractors = Record<string, DataExtractor>;

export interface CompileRunnerInstantiator {
    getInstance(): CompileRunner;
}

export interface ResourceWriter {
    writeResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<void>;
}

export interface ResourceReader {
    readResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}

export interface ResourceRunner extends CompileRunner, ResourceReader, ResourceWriter {

}



/*export function getExistingRunner(typeString: string, config?: SsgConfig): CompileRunner | null {
    if (config && config.compileRunners) {
        return config.compileRunners[ typeString ] as CompileRunner;
    }
    return null;
}*/


export function getRunnerPath(name: string): string {
    return './ts-runner.ts';
}

/*export function getRunnerInstance(name: string, config?: SsgConfig): CompileRunner | null {
    const existingRunner: CompileRunner | null = getExistingRunner(name, config);

    if (!existingRunner) {
        const runnerPath: string = getRunnerPath(name);
        getResolveTsModule();
    }
}*/

//Runner caching structures:
//1. Path matcher (glob, regex or ext name) --> Runner Instance
//2. Runner holding Module path --> Runner Instance
//3. Runner name --> Runner Instance
//4. Runner path --> runner modules

/**
 * 1. If the runner *instance* is cached -> we should access and return this instance
 * 2. If the runner module is cached -> the create the runner instance with the `getInstance()` method, when it is first needed and push the *instance* on the runner cache
 * 3. If the runner module is not cached -> find the module and load it (needs identity -> module path association), push it onto the cache and continue with option 2.
 */

/*export function getRunnerInstanceFromModule(targetKey: FalsyAble<string>, module: FalsyAble<CompileRunnerInstantiator>, config: SsgConfig): CompileRunner | null {

    if (!targetKey) {
        return null;
    }

    const runnerInstances: Record<string, CompileRunner> = initGetConfigDict(config, 'idCompileRunnersDict');

    if (runnerInstances[ targetKey ]) {
        return runnerInstances[ targetKey ];
    }

    if (!module) {
        return null;
    }

    const runnerInstance: CompileRunner = module.getInstance();
    runnerInstances[ targetKey ] = runnerInstance;
    return runnerInstance;
}

export async function getRunnerInstance(nameFilterOrPath: string, config?: SsgConfig): Promise<CompileRunner | null> {
    if (!config) {
        return null;
    }
    const runnerInstances: Record<string, CompileRunner> = initGetConfigDict(config, 'compileRunners');
    const runnerInstantiators: Record<string, CompileRunnerInstantiator> = initGetConfigDict(config, 'compileRunnerInstatiators');

    if (runnerInstances && runnerInstances[ nameFilterOrPath ]) {
        return runnerInstances[ nameFilterOrPath ];
    }

    let instantiator: CompileRunnerInstantiator | null = null;
    if (runnerInstantiators && runnerInstantiators[ nameFilterOrPath ]) {
        instantiator = runnerInstantiators[ nameFilterOrPath ];
    }

    if (!instantiator) {
        instantiator = await loadTsModuleFromPath<CompileRunnerInstantiator | null>(nameFilterOrPath, config.tsModulesCache);
    }

    return getRunnerInstanceFromModule(nameFilterOrPath, instantiator, config);
}

export async function findRunnerInstanceFor(fsNodePath: string, config: SsgConfig = {}): Promise<CompileRunner | null | undefined> {
    const directMatchRunnerInstance: CompileRunner | null = await getRunnerInstance(fsNodePath);
    if (directMatchRunnerInstance) {
        return directMatchRunnerInstance;
    }

    const runnerMatches: MatchedAndExpression[] | null = getKeyMatches(fsNodePath, config.compileRunners);
    if (runnerMatches && runnerMatches.length > 0) {
        const lastMatch: MatchedAndExpression | undefined = runnerMatches.at(-1);
        return lastMatch?.match;
    }

    const runnerInstantiatorMatches: MatchedAndExpression[] | null = getKeyMatches(fsNodePath, config.compileRunnerInstatiators);
    if (runnerInstantiatorMatches && runnerInstantiatorMatches.length > 0) {
        const lastMatch: MatchedAndExpression | undefined = runnerInstantiatorMatches.at(-1);
        const instantiator: CompileRunnerInstantiator | undefined = lastMatch?.match;
        return getRunnerInstanceFromModule(lastMatch?.expression, instantiator, config);
    }

    //Maybe also look in the specified runner file paths

    return null;
}

export async function loadNewInstantiatorsFromFilesMap(config: SsgConfig): Promise<void> {
    const runnerInstantiators: Record<string, CompileRunnerInstantiator> = initGetConfigDict(config, 'compileRunnerInstatiators');

    for (const key in config.runnerFilesMap) {
        const targetFilePath = config.runnerFilesMap[ key ];
        if (!runnerInstantiators[ key ]) {
            let instantiator: CompileRunnerInstantiator | null = await getResolveTsModule(targetFilePath, [ config.defaultRunnersRoot, __dirname ], config.tsModulesCache, config);

            if (instantiator) {
                runnerInstantiators[ key ] = instantiator;
            }
        }
    }
}

export async function setDefaultRunnerInstantiatorsFromFiles(config: SsgConfig): Promise<void> {
    config.runnerFilesMap = setDefaults(config.runnerFilesMap, defaultCompileRunnersFileMap, false);

    if (!config.defaultRunnersRoot) {
        config.defaultRunnersRoot = __dirname;
    }

    return loadNewInstantiatorsFromFilesMap(config);
}

function getRunnerAtRootPath(runnerFilePath: string, config: SsgConfig): string | null {
    if (path.isAbsolute(runnerFilePath)) {
        return runnerFilePath;
    }

    if (!config.defaultRunnersRoot) {
        return null;
    }
    const rootRunnerPath: string = path.join(config.defaultRunnersRoot, runnerFilePath);
    return rootRunnerPath;
}

export async function addRunnerFromFile(matchKey: string, fileName: string, config: SsgConfig): Promise<void> {
    if (!config.runnerFilesMap) {
        config.runnerFilesMap = {};
    }
    if (!fileName.endsWith('.ts')) {
        fileName += '.ts';
    }

    config.runnerFilesMap[ matchKey ] = fileName;
    return loadNewInstantiatorsFromFilesMap(config);

    const runnerAtRootPath: string | null = getRunnerAtRootPath(fileName, config);

    if (runnerAtRootPath) {
        config.runnerFilesMap[ matchKey ] = runnerAtRootPath;
        return loadNewInstantiatorsFromFilesMap(config);
    }
    return;
}

export function removeRunnerById(runnerId: string, config: SsgConfig): void {
    if (config.idCompileRunnersDict) {
        delete config.idCompileRunnersDict[ runnerId ];
    }
    for (const key in config.resourceMatchCompileRunnersDict) {
        const currentRunnerId = config.resourceMatchCompileRunnersDict[ key ];
        if (currentRunnerId === runnerId) {
            removeRunner(key, config);
        }
    }
}

export function removeRunner(matchKey: string, config: SsgConfig): void {
    if (config.runnerFilesMap) {
        delete config.runnerFilesMap[ matchKey ];
    }
    if (config.compileRunnerInstatiators) {
        delete config.compileRunnerInstatiators[ matchKey ];
    }

    if (!config.resourceMatchCompileRunnersDict) {
        return;
    }

    const compileRunnerId: string = config.resourceMatchCompileRunnersDict[ matchKey ];
    if (config.idCompileRunnersDict) {
        delete config.idCompileRunnersDict[ compileRunnerId ];
    }

    delete config.resourceMatchCompileRunnersDict[ matchKey ];
}*/

// ------------------------------------------------------------


export interface CompileRunnerModule extends Module {
    getInstance(): CompileRunner;
}

export function getRunnerIdFromPath(runnerPath: string): string {
    return getModuleId(runnerPath, '.runner');
}

export async function loadRunnerInstanceFrom(modulePath: string): Promise<CompileRunner | null> {
    const runnerModule: CompileRunnerModule = await import(modulePath);

    if (runnerModule.getInstance) {
        const runnerInstance: CompileRunner = runnerModule.getInstance();
        return runnerInstance;
    }
    return getFirstInstanceTargetClass(runnerModule, '.+Runner.*', [ 'compile' ]);
}
export function addRunnerInstance(runnerId: string, runnerInstance: CompileRunner, config: SsgConfig): void {
    if (!config.idCompileRunnersDict) {
        config.idCompileRunnersDict = {};
    }
    config.idCompileRunnersDict[ runnerId ] = runnerInstance;
}

export async function addRunnerInstanceFromPath(runnerPath: string, config: SsgConfig): Promise<void> {
    if (!config.idCompileRunnersDict) {
        config.idCompileRunnersDict = {};
    }
    const runnerId: string = getRunnerIdFromPath(runnerPath);
    if (!config.idCompileRunnersDict[ runnerId ]) {

        const runnerInstance: CompileRunner | null = await loadRunnerInstanceFrom(runnerPath);

        if (runnerInstance) {
            config.idCompileRunnersDict[ runnerId ] = runnerInstance;
        }
    }
}

export async function loadDefaultRunners(config: SsgConfig): Promise<void> {
    if (!config.idCompileRunnersDict) {
        config.idCompileRunnersDict = {};
    }

    if (config.defaultRunnerDirs && config.defaultRunnersMatchGlobs) {
        for (const runnersDir of config.defaultRunnerDirs) {
            //const runnerMatchGlob = path.join()

            const runnerModulePaths: string[] = await anchorAndGlob(config.defaultRunnersMatchGlobs, path.resolve(runnersDir), true);

            const addModulesPromises: Promise<any>[] = runnerModulePaths.map((runnerModulePath) => addRunnerInstanceFromPath(runnerModulePath, config));

            await Promise.all(addModulesPromises);

            /*for (const runnerModulePath of runnerModulePaths) {
                await addRunnerInstanceFromPath(runnerModulePath, config);
            }*/
        }
    }
}

export interface PatternMatchValueDict<ValueType> {
    [ regexPattern: string ]: ValueType;
}

export interface PatternIdChainDict extends PatternMatchValueDict<string[]> { }

export function findMatchedKeyDictValue<ValueType>(resourceId: FalsyAble<string>, matchingDict: FalsyAble<PatternMatchValueDict<ValueType>>): FalsyAble<ValueType> {
    if (!resourceId || !matchingDict) {
        return null;
    }
    /*const directMatchRunnerInstance: CompileRunner | null = await getRunnerInstance(fsNodePath);
    if (directMatchRunnerInstance) {
        return directMatchRunnerInstance;
    }*/
    const runnerMatches: MatchedDictKeyRes<ValueType>[] | null = getKeyMatches(resourceId, matchingDict);
    if (runnerMatches && runnerMatches.length > 0) {
        const lastRegexMatched: MatchedDictKeyRes<ValueType> | undefined = runnerMatches.at(-1);
        const runnerChainIds: FalsyAble<ValueType> = lastRegexMatched?.dictValue;
        return runnerChainIds;
    }
    return null;
}

/*export function findRunnerIdsChainForResource(resourceId: string, config: SsgConfig): FalsyAble<string[]> {
    if (!resourceId || !config.resMatchCompileRunnersDict) {
        return null;
    }
    return findMatchedValueIds(resourceId, config.resMatchCompileRunnersDict);
}*/

export async function getRunnerInstance(runnerId: string, config: SsgConfig): Promise<FalsyAble<CompileRunner>> {
    if (!runnerId) {
        return null;
    }
    if (!config.idCompileRunnersDict) {
        config.idCompileRunnersDict = {};
    }

    if (config.idCompileRunnersDict[ runnerId ]) {
        return config.idCompileRunnersDict[ runnerId ];
    }

    return null;
}
export async function getRunnerChainInstances(runnerIds: string[] | string, config: SsgConfig): Promise<CompileRunner[]> {

    runnerIds = parseRunnerIds(runnerIds);
    const getRunnerChainPromises = runnerIds.map((runnerId: string) => getRunnerInstance(runnerId, config));
    const compileRunnerChain: FalsyAble<CompileRunner>[] = await Promise.all(getRunnerChainPromises);

    return filterFalsy(compileRunnerChain);

    //const compileRunnerChain: FalsyAble<CompileRunner>[] = runnerIds.map(async (runnerId: string) => await getRunnerInstance(runnerId, config));
}

export function getResourceMatchIds(resource: FalsyAble<DataParsedDocument>, dataStoreKey?: string, configMatchDictKey?: string, config?: SsgConfig): string[] {
    if (!dataStoreKey && (!configMatchDictKey || !config)) {
        return [];
    }
    if (!resource || !resource.data) {
        return [];
    }

    if (dataStoreKey) {
        let dataStoredIdChain: string | string[] = resource.data[ dataStoreKey ];

        if (dataStoredIdChain && dataStoredIdChain.length > 0) {
            if (typeof dataStoredIdChain === 'string') {
                dataStoredIdChain = parseRunnerIds(resource.data[ dataStoreKey ]);
            }
            return arrayify(dataStoredIdChain);
        }
    }

    if (!resource.data.src) {
        console.log('Can not match runner/compiler/etc ids for empty resource src');
        return [];
    }

    if (config && configMatchDictKey) {
        const selectedMatchedIdsForResource: FalsyAble<string[]> = findMatchedKeyDictValue(resource.data.src, config[ configMatchDictKey ]);

        if (selectedMatchedIdsForResource) {
            return selectedMatchedIdsForResource;
        }
    }


    return [];
}

export function getRunnerIdsFor(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): string[] {
    return getResourceMatchIds(resource, 'compileRunner', 'resMatchCompileRunnersDict', config);
}
export function getExtractRunnerIdsFor(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): string[] {
    return getResourceMatchIds(resource, 'extractRunner', 'resMatchDataExtractorsDict', config);
}

/*export async function getRunnerInstanceChainFromIds(runnerIds: string[] | string, config: SsgConfig): Promise<CompileRunner[]> {
    const compileRunnerInstance: CompileRunner[] = await getRunnerChainInstances(runnerIds, config);

    //const compileRunnerInstance: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resource.data.src, config) as ResourceRunner;
    return compileRunnerInstance;
}*/

export async function getExtractRunnerInstanceChainForResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<CompileRunner[]> {
    if (!resource) {
        return [];
    }
    if (!resource.data) {
        resource.data = {};
    }
    resource.data.extractRunner = await getExtractRunnerIdsFor(resource, config);
    const compileRunnerInstance: CompileRunner[] = await getRunnerChainInstances(resource.data.compileRunner, config);
    return compileRunnerInstance;
}

export async function getRunnerInstanceChainForResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<CompileRunner[]> {

    if (!resource) {
        return [];
    }
    if (!resource.data) {
        resource.data = {};
    }
    resource.data.compileRunner = await getRunnerIdsFor(resource, config);
    const compileRunnerInstance: CompileRunner[] = await getRunnerChainInstances(resource.data.compileRunner, config);
    return compileRunnerInstance;
}

export function parseRunnerIds(runnerIdsString: string | string[]): string[] {
    if (typeof runnerIdsString === 'string') {
        return runnerIdsString.split(' ');
    }
    return runnerIdsString;
}