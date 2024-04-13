import { SsgConfig } from "../config";
import { defaultCompileRunnersFileMap } from "../defaults";
import { getResolveTsModule, loadTsModule } from "../module-loading/util";
import { FalsyAble, FalsyString, getKeyMatches, MatchedAndExpression, setDefaults } from "../utils/util";

export type DocumentData = Record<string, any>;

export interface DataParsedDocument {
    content?: any; //string | null;
    data?: DocumentData | null;
}
export interface DocumentCompileData extends DataParsedDocument {
    dataCtx?: DocumentData | null;
}

export interface DataExtractor {
    extractData(fileContent: string, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | DocumentData | null>;
}
export interface DocumentCompiler {
    compile(fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
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
    writeResource(compiledResource: any, resourceId: FalsyString, targetId: string, config: SsgConfig): Promise<void>;
}

export interface ResourceReader {
    readResource(resourceId: string, targetId: string, config: SsgConfig): Promise<any>;
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

export function initGetConfigDict<PropType>(config: any, key: string): PropType {
    if (!config[ key ]) {
        config[ key ] = {};
    }
    return config[ key ];
}

export function getRunnerInstanceFromModule(targetKey: FalsyAble<string>, module: FalsyAble<CompileRunnerInstantiator>, config: SsgConfig): CompileRunner | null {

    if (!targetKey) {
        return null;
    }

    const runnerInstances: Record<string, CompileRunner> = initGetConfigDict(config, 'compileRunners');

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
        instantiator = await loadTsModule<CompileRunnerInstantiator | null>(nameFilterOrPath, config.tsModulesCache);
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