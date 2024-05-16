import path from "path";
import { DataParsedDocument } from "../compilers/runners";
import { SsgConfig } from "../config";
import { anchorAndGlob } from "../utils/globbing";
import Module from "module";
import { getFirstInstanceTargetClass, getModuleId } from "../module-loading/ts-modules";
import { getKeyFromDict } from "../components/helpers/dict-util";
import { FalsyAble } from "../components/helpers/generic-types";
import { IResourceProcessor } from "./i-resource-processor";
import { getKeyMatches, getKeyMatchValues, MatchedDictKeyRes } from "../utils/regex-match-util";
import { filterFalsy } from "../components/helpers/array-util";


/*export async function processDir(inputPath: string, outputPath: string, config: SsgConfig): Promise<DataParsedDocument> {

}*/

export const processDir = processFsNodeAtPath;
export const processFile = processFsNodeAtPath;

export async function processFsNodeAtPath(inputPath: string, outputPath: string | null, config: SsgConfig): Promise<DataParsedDocument> {

    const toProcessResource: DataParsedDocument = {
        id: inputPath,
        content: null,
        data: {
            document: {
                src: inputPath,
                target: outputPath
            }
        }
    };

    return processResource(toProcessResource, config);
};

export async function loadModuleFromPath<InstanceType>(modulePath: string, targetDict: Record<string, InstanceType>, nameToIdPostfix: string = ''): Promise<void> {

    const moduleId = getModuleId(modulePath, nameToIdPostfix);

    const importedModule: Module = await import(modulePath);

    const moduleInstance = getFirstInstanceTargetClass(importedModule, '.+', [ 'process' ]);

    targetDict[ moduleId ] = moduleInstance;
}

export async function loadModuleInstancesFromPaths<InstanceType>(anchorPaths: string[], filesMatchGlobs: string[], moduleNamePostfix: string): Promise<Record<string, InstanceType>> {

    const resultModulesDict: Record<string, InstanceType> = {};

    for (const anchorPath of anchorPaths) {

        const modulePaths: string[] = await anchorAndGlob(filesMatchGlobs, path.resolve(anchorPath), true);

        const importModulePromises: Promise<any>[] = modulePaths.map((runnerModulePath) => loadModuleFromPath(runnerModulePath, resultModulesDict, moduleNamePostfix));

        await Promise.all(importModulePromises);
    }
    return resultModulesDict;
}

export type ChainIds = string[];
export interface StageInfo {
    id?: string;
    inputProp: any;
    matchChains: Record<string, ChainIds>;
    instances?: Record<string, IResourceProcessor>;
    postProcess?: (resource: DataParsedDocument, config: SsgConfig) => Promise<DataParsedDocument>;
    preProcess?: (resource: DataParsedDocument, config: SsgConfig) => Promise<DataParsedDocument>;
}

export interface ProcessingStagesInfo {
    [ stageName: string ]: StageInfo;
}



export async function loadStageProcessorInstances(searchRootAnchorDirs: string[], processingStages: ProcessingStagesInfo): Promise<void> {
    const availableStages = Object.keys(processingStages);
    //const resourceProcessorDirs = [ __dirname ];
    for (const stageName of availableStages) {

        const stageProcessorsGlobs = [
            `**/*.${stageName}.ts`,
            `*.${stageName}.ts`
        ];

        const stageProcessorInstancesOfDirs = await loadModuleInstancesFromPaths<IResourceProcessor>(searchRootAnchorDirs, stageProcessorsGlobs, '.' + stageName);
        processingStages[ stageName ].instances = stageProcessorInstancesOfDirs;
    }
}

export function getMatchedChainsFromStage(resource: DataParsedDocument, processingStage: StageInfo): ChainIds[] | null {
    const currentStageInfo: StageInfo = processingStage;

    const stageSelectionKey = currentStageInfo.inputProp;
    const stageSelectionValue = getKeyFromDict(resource, stageSelectionKey);
    const currentStageIdChainOpts = currentStageInfo.matchChains;

    const matchedIdChains: ChainIds[] | null = getKeyMatchValues(stageSelectionValue, currentStageIdChainOpts);
    return matchedIdChains;
}

export async function findChainCanHandleResource(resource: DataParsedDocument, config: any, matchedIdChains: ChainIds[] | null, processingStage: StageInfo): Promise<ChainIds | null> {
    if (!matchedIdChains) {
        return null;
    }
    if (!processingStage.instances) {
        return null;
    }


    for (const idsChain of matchedIdChains) {

        for (let i = 0; i < idsChain.length; i++) {
            const id = idsChain[ i ];
            const processorOfChain: IResourceProcessor | undefined = processingStage.instances[ id ];

            if (processorOfChain && await processorOfChain.canHandle(resource, config)) {
                return idsChain.slice(i);
            }
        }
    }
    return null;
}

import * as lodash from 'lodash';
import { forkDataScope } from "../manage-scopes";
export async function useResourceProcessorMerge(resource: DataParsedDocument, config: any, processor: IResourceProcessor): Promise<DataParsedDocument> {

    if (!processor) {
        return resource;
    }

    //Process does only return the data that it produces
    //The processor is not themselves resposible for data merging
    const transformedResource: DataParsedDocument = await processor.process(resource, config);

    const mergedResource: DataParsedDocument = lodash.merge({}, resource, transformedResource);
    return mergedResource;
}

export async function passThroughProcessChain(resource: DataParsedDocument, config: any, chainToProcess: IResourceProcessor[]): Promise<DataParsedDocument> {

    let resultResource: DataParsedDocument = resource;
    for (const processor of chainToProcess) {
        resultResource = await useResourceProcessorMerge(resultResource, config, processor);
    }
    return resultResource;
}


export async function processConfStage(stageName: string, resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    return processStage(stageName, resource, config, config.processingStages || {});
}

export function getProcessorInstance(currentStageInfo: StageInfo, id: string): IResourceProcessor | null {
    if (currentStageInfo.instances) {
        return currentStageInfo.instances[ id ];
    }
    return null;
}

export async function processStage(stageName: string, resource: DataParsedDocument, config: SsgConfig, processingStages: ProcessingStagesInfo): Promise<DataParsedDocument> {
    const currentStageInfo: StageInfo = processingStages[ stageName ];

    const matchedStageChains: ChainIds[] | null = getMatchedChainsFromStage(resource, currentStageInfo);
    const resourceConfirmedChain: ChainIds | null = await findChainCanHandleResource(resource, config, matchedStageChains, currentStageInfo);

    if (!resourceConfirmedChain || resourceConfirmedChain.length <= 0) {
        return resource;
    }

    const chainToProcess: FalsyAble<IResourceProcessor>[] = resourceConfirmedChain.map((id: string) => getProcessorInstance(currentStageInfo, id));

    let processingResult: DataParsedDocument = resource;
    if (currentStageInfo.preProcess) {
        processingResult = await currentStageInfo.preProcess(processingResult, config);
    }

    if (chainToProcess && chainToProcess.length > 0) {
        processingResult = await passThroughProcessChain(resource, config, filterFalsy(chainToProcess));
    }

    if (currentStageInfo.postProcess) {
        processingResult = await currentStageInfo.postProcess(processingResult, config);
    }

    if (!processingResult) {
        return resource;
    }

    return processingResult;
}

export async function processAllPassingStages(resource: DataParsedDocument, config: any, processingStages: ProcessingStagesInfo): Promise<DataParsedDocument> {

    let stageProcessedResource: DataParsedDocument = resource;
    for (const stageName in processingStages) {

        stageProcessedResource = await processStage(stageName, stageProcessedResource, config, processingStages);
    }
    return stageProcessedResource;
}


/*export function findStageForResource(resource: DataParsedDocument, processingStages: ProcessingStagesInfo): StageInfo | null {
    for (const stageName in processingStages) {
        const currentStageInfo: StageInfo = processingStages[ stageName ];

        const stageSelectionKey = currentStageInfo.inputProp;
        const stageSelectionValue = getKeyFromDict(resource, stageSelectionKey);
        const currentStageIdChainOpts = currentStageInfo.matchChains;

        const matchedIdChains: MatchedDictKeyRes<ChainIds>[] | null = getKeyMatches(stageSelectionValue, currentStageIdChainOpts);
        if (matchedIdChains && matchedIdChains.length > 0) {
            return currentStageInfo;
        }
    }
    return null;
}

export function processDetectStages(resource: DataParsedDocument, processingStages: ProcessingStagesInfo);
*/

export async function processResource(resource: DataParsedDocument, config: SsgConfig, forkResourceData: boolean = false): Promise<DataParsedDocument> {

    if (forkResourceData) {
        resource = forkDataScope(resource);
    }

    /*const resourceProcessorDirs = config.defaultResourceProcessorDirs || [];
    const processingStages: ProcessingStagesInfo = config.processingStages || {};
    await loadStageProcessorInstances(resourceProcessorDirs, processingStages);*/

    const processedDocument: DataParsedDocument = await processAllPassingStages(resource, config, config.processingStages || {});
    return processedDocument;


    /**
     * Selection processor:
     * Entry and exit at any stage should be possible (programmatic usage etc)
     * - Read a resource in particular format and use to further process manuall
     * - Extract data on a buffer, on which we know the format
     * - Compile a buffer to a different format
     * - Write resource to target location
     * 
     * 
     * TODO: compilers need to also have an outputFormat setting:
     * Maybe split to parsers and unparsers (assemblers/composers, .etc)
     * 
     */



    //return resource;
};

export async function useReaderStageToRead(documentPath: string, config?: SsgConfig): Promise<DataParsedDocument> {
    //Use process stage to read resource to memory
    const toReadResource = {
        id: documentPath,
        data: {
            document: {
                src: documentPath
            }
        }
    };
    const readResource: DataParsedDocument = await processConfStage('reader', toReadResource, config || {});
    return readResource;
}