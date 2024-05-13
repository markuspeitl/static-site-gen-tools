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

export async function processFsNodeAtPath(inputPath: string, outputPath: string, config: SsgConfig): Promise<DataParsedDocument> {

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
}

export interface ProcessingStagesInfo {
    [ stageName: string ]: StageInfo;
}

export function getDefaultProcessingStages(): ProcessingStagesInfo {
    const processingStages: ProcessingStagesInfo = {
        reader: {
            inputProp: 'id',
            matchChains: {
                '.+\.html': [ 'file' ],
                '.+\.md': [ 'file' ],
                '.+\.njk': [ 'file' ],
                '.+\.ts': [ 'file' ],
                'network/[a-zA-Z0-9\.\-\_]+/[a-zA-Z0-9\.\-\_/]+\.[a-zA-Z0-9\.]+': [ 'network' ],
                '.+/.+.jpg': [ 'asset' ], //Checks if file exists, tags outputFormat as 'asset' and set document.target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                '.+\/': [ 'dir' ],
                '.+': [ 'dir' ],
            }

        },
        extractor: {
            inputProp: 'data.document.inputFormat',
            matchChains: {
                'html': [ 'html' ],
                'md': [ 'md', 'html' ],
                'njk': [ 'md', 'html' ],
                'ts': [ 'md', 'ts' ]
            }
        },
        compiler: {
            inputProp: 'data.document.inputFormat',
            matchChains: {
                'html': [ 'placeholder', 'component' ], // or 'placeholder', 'component' instead of component
                'md': [ 'placeholder', 'md', 'component', 'njk' ],
                'njk': [ 'placeholder', 'njk', 'component' ],
                'ts': [ 'ts', 'placeholder', 'html', 'component' ]
            }
        },
        writer: {
            inputProp: 'data.document.outputFormat',
            matchChains: {
                'html': [ 'file' ],
                'md': [ 'file' ],
                'njk': [ 'file' ],
                'ts': [ 'file' ],
                'asset': [ 'copy' ], //Receives all files tagged as asset -> uses document.src and document.target to copy file
                '.+': [ 'dir' ],
            }
        }
    };

    for (const stageName in processingStages) {
        const currentStageInfo: StageInfo = processingStages[ stageName ];
        currentStageInfo.id = stageName;
    }

    return processingStages;
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

export async function processAllPassingStages(resource: DataParsedDocument, config: any, processingStages: ProcessingStagesInfo): Promise<DataParsedDocument> {
    for (const stageName in processingStages) {
        const currentStageInfo: StageInfo = processingStages[ stageName ];

        const matchedStageChains: ChainIds[] | null = getMatchedChainsFromStage(resource, currentStageInfo);
        const resourceConfirmedChain: ChainIds | null = await findChainCanHandleResource(resource, config, matchedStageChains, currentStageInfo);
        if (resourceConfirmedChain && resourceConfirmedChain.length > 0) {

            const chainToProcess: FalsyAble<IResourceProcessor>[] = resourceConfirmedChain.map((id: string) => {
                if (currentStageInfo.instances) {
                    return currentStageInfo.instances[ id ];
                }
                return null;
            });
            const processingResult: DataParsedDocument = await passThroughProcessChain(resource, config, filterFalsy(chainToProcess));
            if (processingResult) {
                resource = processingResult;
            }
        }
    }
    return resource;
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

    const resourceProcessorDirs = [ __dirname ];
    const processingStages: ProcessingStagesInfo = getDefaultProcessingStages();
    await loadStageProcessorInstances(resourceProcessorDirs, processingStages);

    const processedDocument: DataParsedDocument = await processAllPassingStages(resource, config, processingStages);
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