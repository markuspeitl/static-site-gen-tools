import type { SsgConfig } from "./config/ssg-config";
import type { IGenericResource, IProcessingNode, IProcessor, ProcessFunction } from "./processing-tree/i-processor";
import type { FalseAbleVal } from "@markus/ts-node-util-mk1";
import type { IProcessResource } from "./processors/shared/i-processor-resource";
import * as lodash from 'lodash';
import { IRuntimeConfig, processNode } from "./processing-tree/processing-strategy-fns";


export function registerProcessedDocument(
    resource: IProcessResource,
    config: SsgConfig,
): void {
    if (resource.src) {
        if (!config.processedDocuments) {
            config.processedDocuments = [];
        }
        config.processedDocuments.push(resource.document);
    }
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

    //Set the 'process' fn newly as first processNode still points to the old (full processing node) node reference
    srcProcessorCopy.process = (
        resource: IGenericResource,
        config: any,
    ) => processNode(
        srcProcessorCopy as IProcessingNode,
        resource,
        config,
        (srcProcessorCopy as IProcessingNode).strategy
    );
    //nodeConfig.strategy);
    //srcProcessorCopy.process = processNodeFn;

    if (cache) {
        cache[ stageChainId ] = srcProcessorCopy;
    }



    return srcProcessorCopy;
}

//Very rudimentary and specific currently, only 1 level beneath top
async function processStagesOnResource(
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

    /*const processedResource: IProcessResource = await processNode(
        selectedSubChainNode,
        resource,
        config as IRuntimeConfig,
    );*/

    const processedResource: IProcessResource = await selectedSubChainNode.process(
        resource,
        config
    );

    registerProcessedDocument(processedResource, config);

    return processedResource;
}

async function forkProcessMergeBack(
    resource: IProcessResource,
    config: SsgConfig,
    stagesToProcess?: string[],
    propOverrides?: Record<string, any>,
    mergeBackExcludes?: string[]
): Promise<IProcessResource> {

    if (!propOverrides) {
        propOverrides = {
            //id: 'extract__' + resource.src
            id: this.id + "_" + resource.src
        };
    }

    const forkedResource: IGenericResource = config.scopes.forkFromResource(
        resource,
        propOverrides
    );

    const compiledSubResource: IProcessResource = await config.processor.processStages(
        forkedResource,
        config,
        stagesToProcess
    );

    return config.scopes.mergeToParent(
        compiledSubResource,
        mergeBackExcludes
    );
}

async function forkSubResourceProcessStages(
    parentResource: IProcessResource,
    config: SsgConfig,
    stagesToProcess: string[] | undefined,
    processRunnerId?: string, //appended to resource id to track changes, not required
    overrideProps?: Record<string, any>
): Promise<IProcessResource> {

    if (!processRunnerId) {
        processRunnerId = 'child';
    }

    if (!overrideProps) {
        overrideProps = {};
    }
    Object.assign(
        overrideProps,
        {
            id: parentResource.id + '->' + processRunnerId
        }
    );

    /*const childProps: any = {
        id: parentResource.id + '->' + processRunnerId
    };*/
    const childForkedResource: IProcessResource = config.scopes.forkFromResource(
        parentResource,
        overrideProps,
        undefined,
        true
        /*[
            'parent',
            'pendingFragments',
            'exclude',
            'content',
            'id'
            //'importScope'
        ]*/
    );

    return processStagesOnResource(childForkedResource, config, stagesToProcess);
}

//Example: Use process stage to read resource to memory
async function processStagesOnInputPath(documentPath: string, config: SsgConfig, stagesToProcess?: string[]): Promise<IProcessResource> {

    const toReadResource = {
        id: documentPath,
        src: documentPath
    };

    return processStagesOnResource(toReadResource, config, stagesToProcess);
};

async function processStagesFromToPath(
    inputPath: string,
    outputPath: string | null,
    config: SsgConfig,
    stagesToProcess?: string[],
): Promise<IProcessResource> {

    const toProcessResource: IProcessResource = {
        id: inputPath,
        content: null,
        document: {
            src: inputPath,
            target: outputPath
        } as any
    };

    return processStagesOnResource(toProcessResource, config, stagesToProcess);
}

//const processStagesFromToPath = (inputPath: string, outputPath: string | null, config: SsgConfig) => processStagesFromToPath(inputPath, outputPath, config, undefined);

//Render the resource content with predefined 'extractor' and 'compiler' stages
//Mainly for rendering generated sub content/body from within components (return render control to bssg)
async function renderComponentBodyContent(
    resource: IProcessResource,
    config: SsgConfig,
    processRunId?: string,
    overrideProps?: Record<string, any>,
    stages?: string[]
): Promise<IProcessResource> {

    if (!overrideProps) {
        overrideProps = {};
    }

    overrideProps = Object.assign(
        {
            srcFormat: 'html',
            targetFormat: 'html'
        },
        overrideProps
    );

    if (!stages) {
        stages = [
            'extractor',
            'compiler'
        ];
    }

    //forkedResource.id = forkedResource.id + processRunId;
    //const stagesRunId: string = processRunId;
    return forkSubResourceProcessStages(
        resource,
        config,
        stages,
        processRunId,
        overrideProps
    );
};

export interface ProcessingHelper {
    renderFork: (
        parentResource: IProcessResource,
        config: SsgConfig,
        processRunId?: string,
        overrideProps?: Record<string, any>,
        stages?: string[]
    ) => Promise<IProcessResource>;

    processFork: (
        parentResource: IProcessResource,
        config: SsgConfig,
        stagesToProcess?: string[],
        processRunId?: string,
        overrideProps?: Record<string, any>,
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

    process: (
        resource: IProcessResource,
        config: SsgConfig,
        stagesToProcess?: string[]
    ) => Promise<IProcessResource>;

    forkProcessMergeBack: (
        resource: IProcessResource,
        config: SsgConfig,
        stagesToProcess?: string[],
        propOverrides?: Record<string, any>,
        mergeBackExcludes?: string[],
    ) => Promise<IProcessResource>;
}

export const defaultProcessingHelper: ProcessingHelper = {
    renderFork: renderComponentBodyContent,
    processFork: forkSubResourceProcessStages,
    processDocument: processStagesOnInputPath,
    processDocumentTo: processStagesFromToPath,
    processStages: processStagesOnResource,
    process: processStagesOnResource,
    forkProcessMergeBack: forkProcessMergeBack
};

/*export async function processRegisterDocument(
    resource: IProcessResource,
    config: SsgConfig,
    processFn: ProcessFunction,
    ...stagesToProcess: string[]
): Promise<IProcessResource> {
    const processedResource: IProcessResource = await processFn(resource, config, ...stagesToProcess);
    registerProcessedDocument(processedResource, config);
    return processedResource;
}

async function processStagesOnResourceRegisterDoc(
    resource: IProcessResource,
    config: SsgConfig,
    stagesToProcess?: string[]
): Promise<IProcessResource> {

    const processedResource: IProcessResource = await processStagesOnResource(resource, config, stagesToProcess);
    registerProcessedDocument(processedResource, config);
    return processedResource;
}*/

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
