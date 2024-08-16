import { FalseAbleVal } from "@markus/ts-node-util-mk1";
import type { SsgConfig } from "./config";
import { forkDataScope } from "./manage-scopes";
import type { CanHandleFunction, IProcessingNode, IProcessor, IProcessResource, IResourceProcessor, ProcessFunction } from "./pipeline/i-processor";
import * as lodash from 'lodash';

/*export class ProcessingTreeWrapper implements IResourceProcessor {
    id: string = 'tree-wrapper';
    private subjectProcessingNode: IProcessingNode;
    canHandle: CanHandleFunction;
    process: ProcessFunction;
    constructor (subjectProcessingNode: IProcessingNode) {
        this.subjectProcessingNode = subjectProcessingNode;
        this.canHandle = this.subjectProcessingNode.canHandle;
        this.process = this.subjectProcessingNode.process;
    }
}*/


export function registerProcessedDocument(
    resource: IProcessResource,
    config: SsgConfig,
): void {
    if (resource?.data?.document?.src) {
        if (!config.processedDocuments) {
            config.processedDocuments = [];
        }
        config.processedDocuments.push(resource?.data?.document);
    }
}

/*export async function processRegisterDocument(
    resource: IProcessResource,
    config: SsgConfig,
    processFn: ProcessFunction,
    ...stagesToProcess: string[]
): Promise<IProcessResource> {
    const processedResource: IProcessResource = await processFn(resource, config, ...stagesToProcess);
    registerProcessedDocument(processedResource, config);
    return processedResource;
}*/

export async function processStagesOnResourceRegisterDoc(
    resource: IProcessResource,
    config: SsgConfig,
    stagesToProcess?: string[]
): Promise<IProcessResource> {

    const processedResource: IProcessResource = await processStagesOnResource(resource, config, stagesToProcess);
    registerProcessedDocument(processedResource, config);
    return processedResource;
}


export function extractSubChainNode(
    srcProcessorNode: IProcessingNode,
    chainStages: FalseAbleVal<string[]>,
    cache?: Record<string, IProcessingNode>
): IProcessingNode {

    let stageChainId: string = 'default';
    if (chainStages) {
        stageChainId = chainStages.join();
    }
    if (cache && cache[ stageChainId ]) {
        return cache[ stageChainId ];
    }

    const srcProcessorCopy: IProcessingNode = lodash.cloneDeep(srcProcessorNode);

    if (chainStages) {
        const selectedSubProcessorSubset: IProcessor[] | undefined = srcProcessorNode.processors?.filter((processor) => chainStages.includes(processor.id));
        srcProcessorCopy.processors = selectedSubProcessorSubset;
    }

    if (cache) {
        cache[ stageChainId ] = srcProcessorCopy;
    }

    return srcProcessorCopy;
}

//Very rudimentary and specific currently, only 1 level beneath top
export async function processStagesOnResource(
    resource: IProcessResource,
    config: SsgConfig,
    stagesToProcess?: string[]
): Promise<IProcessResource> {


    if (!config.processingTree) {
        return resource;
    }
    if (!config.subTreePathCache) {
        config.subTreePathCache = {};
    }

    //Compiles and caches a subchain of the main processor
    const selectedSubChainNode: IProcessingNode = extractSubChainNode(
        config.processingTree,
        stagesToProcess,
        config.subTreePathCache
    );

    const processedResource: IProcessResource = await selectedSubChainNode.process(
        resource,
        config
    );

    registerProcessedDocument(processedResource, config);

    return processedResource;
}

export async function forkSubResourceProcessStages(
    parentResource: IProcessResource,
    config: SsgConfig,
    stagesToProcess: string[] | undefined,
    processRunnerId?: string, //appended to resource id to track changes, not required
): Promise<IProcessResource> {

    const childForkedResource: IProcessResource = forkDataScope(parentResource);

    if (!processRunnerId) {
        processRunnerId = 'child';
    }

    childForkedResource.id = parentResource.id + '->' + processRunnerId;

    //Reset control flow
    childForkedResource.control = {
        parent: parentResource,
        handledProcIds: [],
    };

    return processStagesOnResource(childForkedResource, config, stagesToProcess);
}

//Example: Use process stage to read resource to memory
export async function processStagesOnInputPath(documentPath: string, config: SsgConfig, stagesToProcess?: string[]): Promise<IProcessResource> {

    const toReadResource = {
        id: documentPath,
        data: {
            document: {
                src: documentPath
            }
        }
    };

    return processStagesOnResource(toReadResource, config, stagesToProcess);
}

export async function processStagesFromToPath(
    inputPath: string,
    outputPath: string | null,
    config: SsgConfig,
    stagesToProcess?: string[],
): Promise<IProcessResource> {

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

    return processStagesOnResource(toProcessResource, config, stagesToProcess);
}

//export const processStagesFromToPath = (inputPath: string, outputPath: string | null, config: SsgConfig) => processStagesFromToPath(inputPath, outputPath, config, undefined);

//Render the resource content with predefined 'extractor' and 'compiler' stages
//Mainly for rendering generated sub content/body from within components (return render control to bssg)
export async function renderComponentBodyContent(
    resource: IProcessResource,
    config: SsgConfig,
    processRunId?: string
): Promise<IProcessResource> {

    //forkedResource.id = forkedResource.id + processRunId;
    //const stagesRunId: string = processRunId;
    return forkSubResourceProcessStages(
        resource,
        config,
        [
            'extractor',
            'compiler'
        ],
        processRunId
    );
}

export interface ProcessingWrapper {
    renderFork: (
        parentResource: IProcessResource,
        config: SsgConfig,
        processRunId?: string
    ) => Promise<IProcessResource>;

    processFork: (
        parentResource: IProcessResource,
        config: SsgConfig,
        stagesToProcess?: string[],
        processRunId?: string
    ) => Promise<IProcessResource>;

    processDocument: (
        inputPath: string,
        config: SsgConfig,
        stagesToProcess?: string[],
    ) => Promise<IProcessResource>;

    processDocumentTo: (
        inputPath: string,
        outputPath: string | null,
        config: SsgConfig,
        stagesToProcess?: string[],
    ) => Promise<IProcessResource>;

    processStages: (
        parentResource: IProcessResource,
        config: SsgConfig,
        stagesToProcess?: string[]
    ) => Promise<IProcessResource>;
}

export const defaultProcessingWrapper: ProcessingWrapper = {
    renderFork: renderComponentBodyContent,
    processFork: forkSubResourceProcessStages,
    processDocument: processStagesOnInputPath,
    processDocumentTo: processStagesFromToPath,
    processStages: processStagesOnResource
};