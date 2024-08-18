import * as lodash from 'lodash';
import { settleValueOrNull, settleValueOrNullFilter } from "@markus/ts-node-util-mk1";
import { loadProcessorInstancesFromPaths } from "../processing-tree/load-file-processors";
import type { SsgConfig } from "../config/ssg-config";
import { anchorAndGlob } from "@markus/ts-node-util-mk1";
import { getFirstInstanceTargetClass, getModuleId } from "../module-loading/ts-modules";
import { getKeyFromDict } from "@markus/ts-node-util-mk1";
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import { getKeyMatches, getKeyMatchValues, MatchedDictKeyRes } from "@markus/ts-node-util-mk1";
import { filterFalsy } from "@markus/ts-node-util-mk1";
import type { IProcessingNode, IProcessResource, IResourceProcessor } from '../processors/shared/i-processor-resource';



export type ChainIds = string[];
export interface StageInfo {
    id?: string;
    inputProp: any;
    matchChains: Record<string, ChainIds>;
    instances?: Record<string, IResourceProcessor>;
    postProcess?: (resource: IProcessResource, config: SsgConfig) => Promise<IProcessResource>;
    preProcess?: (resource: IProcessResource, config: SsgConfig) => Promise<IProcessResource>;
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

        const stageProcessorInstancesOfDirs = await loadProcessorInstancesFromPaths<IResourceProcessor>(searchRootAnchorDirs, stageProcessorsGlobs, '.' + stageName);
        processingStages[ stageName ].instances = stageProcessorInstancesOfDirs;
    }
}

export function getMatchedChainsFromStage(resource: IProcessResource, processingStage: StageInfo): ChainIds[] | null {
    const currentStageInfo: StageInfo = processingStage;

    const stageSelectionKey = currentStageInfo.inputProp;
    const stageSelectionValue = getKeyFromDict(resource, stageSelectionKey);
    const currentStageIdChainOpts = currentStageInfo.matchChains;

    const matchedIdChains: ChainIds[] | null = getKeyMatchValues(stageSelectionValue, currentStageIdChainOpts);
    return matchedIdChains;
}

export async function findChainCanHandleResource(resource: IProcessResource, config: any, matchedIdChains: ChainIds[] | null, processingStage: StageInfo): Promise<ChainIds | null> {
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



export async function useResourceProcessorMerge(resource: IProcessResource, config: any, processor: IResourceProcessor): Promise<IProcessResource> {

    if (!processor) {
        return resource;
    }

    //Process does only return the data that it produces
    //The processor is not themselves resposible for data merging
    const transformedResource: IProcessResource = await processor.process(resource, config);

    const mergedResource: IProcessResource = lodash.merge({}, resource, transformedResource);
    return mergedResource;
}

export async function passThroughProcessChain(resource: IProcessResource, config: any, chainToProcess: IResourceProcessor[]): Promise<IProcessResource> {

    let resultResource: IProcessResource = resource;
    for (const processor of chainToProcess) {
        resultResource = await useResourceProcessorMerge(resultResource, config, processor);
    }
    return resultResource;
}


export async function processConfStage(stageName: string, resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    return processStage(stageName, resource, config, config.processingTree);
}

export function getProcessorInstance(currentStageInfo: StageInfo, id: string): IResourceProcessor | null {
    if (currentStageInfo.instances) {
        return currentStageInfo.instances[ id ];
    }
    return null;
}

export async function processStage(stageName: string, resource: IProcessResource, config: SsgConfig, processingStages?: IProcessingNode): Promise<IProcessResource> {
    if (!processingStages) {
        return resource;
    }

    const currentStageInfo: StageInfo = processingStages[ stageName ];

    const matchedStageChains: ChainIds[] | null = getMatchedChainsFromStage(resource, currentStageInfo);
    const resourceConfirmedChain: ChainIds | null = await findChainCanHandleResource(resource, config, matchedStageChains, currentStageInfo);

    if (!resourceConfirmedChain || resourceConfirmedChain.length <= 0) {
        return resource;
    }

    const chainToProcess: FalsyAble<IResourceProcessor>[] = resourceConfirmedChain.map((id: string) => getProcessorInstance(currentStageInfo, id));

    let processingResult: IProcessResource = resource;
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

export async function processAllPassingStages(resource: IProcessResource, config: any, processingStages: IProcessingNode): Promise<IProcessResource> {

    let stageProcessedResource: IProcessResource = resource;
    for (const stageName in processingStages) {

        stageProcessedResource = await processStage(stageName, stageProcessedResource, config, processingStages);
    }
    return stageProcessedResource;
}


/*export function findStageForResource(resource: IProcessResource, processingStages: ProcessingStagesInfo): StageInfo | null {
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

export function processDetectStages(resource: IProcessResource, processingStages: ProcessingStagesInfo);
*/


export const processDir = processFsNodeAtPath;
export const processFile = processFsNodeAtPath;

export async function processFsNodeAtPath(inputPath: string, outputPath: string | null, config: SsgConfig): Promise<IProcessResource> {

    const toProcessResource: IProcessResource = {
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

export async function processResource(resource: IProcessResource, config: SsgConfig, forkResourceData: boolean = false): Promise<IProcessResource> {

    if (forkResourceData) {
        resource = forkDataScope(resource);
    }

    /*const resourceProcessorDirs = config.defaultResourceProcessorDirs || [];
    const processingStages: ProcessingStagesInfo = config.processingStages || {};
    await loadStageProcessorInstances(resourceProcessorDirs, processingStages);*/

    const processedDocument: IProcessResource | undefined = await config.processingTree?.process(resource, config);
    if (!processedDocument) {
        return resource;
    }

    return processedDocument;

    //const processedDocument: IProcessResource = await processAllPassingStages(resource, config, config.processingStages);
    //return processedDocument;


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

export async function useReaderStageToRead(documentPath: string, config: SsgConfig): Promise<IProcessResource> {
    //Use process stage to read resource to memory
    const toReadResource = {
        id: documentPath,
        data: {
            document: {
                src: documentPath
            }
        }
    };
    const readResource: IProcessResource = await processConfStage('reader', toReadResource, config);
    return readResource;
}