import { FalsyAble } from "./components/helpers/generic-types";
import { SsgConfig } from "./config";
import { forkDataScope } from "./manage-scopes";
import { CanHandleFunction, IProcessingNode, IProcessor, IProcessResource, IResourceProcessor, ProcessFunction } from "./pipeline/i-processor";
import * as lodash from 'lodash';

export class ProcessingTreeWrapper implements IResourceProcessor {
    id: string = 'tree-wrapper';
    private subjectProcessingNode: IProcessingNode;
    canHandle: CanHandleFunction;
    process: ProcessFunction;
    constructor (subjectProcessingNode: IProcessingNode) {
        this.subjectProcessingNode = subjectProcessingNode;
        this.canHandle = this.subjectProcessingNode.canHandle;
        this.process = this.subjectProcessingNode.process;
    }
}

//Very rudimentary and specific currently, only 1 level beneath top
export async function processSubPath(resource: IProcessResource, config: SsgConfig, stagesToProcess?: string[]): Promise<IProcessResource> {

    const subPathId: string | undefined = stagesToProcess?.join();
    if (!config.subTreePathCache) {
        config.subTreePathCache = {};
    }
    if (subPathId && config.subTreePathCache[ subPathId ]) {
        return config.subTreePathCache[ subPathId ].process(resource, config);
    }
    if (!config.processingTree) {
        return resource;
    }

    if (!subPathId) {
        return config.processingTree.process(resource, config);
    }

    const processTreeCopy: IProcessingNode = lodash.cloneDeep(config.processingTree);

    processTreeCopy.processors = processTreeCopy.processors?.filter((processor) => stagesToProcess?.includes(processor.id));

    config.subTreePathCache[ subPathId ] = processTreeCopy;

    return processSubPath(resource, config, stagesToProcess);
}

export async function processTreeStages(stagesToProcess: string[], resource: IProcessResource, config: SsgConfig, processRunId?: string): Promise<IProcessResource> {
    const forkedResource: IProcessResource = forkDataScope(resource);

    processRunId = "_" + processRunId || '';

    forkedResource.id = forkedResource.id + processRunId;
    forkedResource.control = {
        parent: resource,
        handledProcIds: [],
    };
    return processSubPath(forkedResource, config, stagesToProcess);
}

//Example: Use process stage to read resource to memory
export async function processStagesOnInputPath(stagesToProcess: string[], documentPath: string, config: SsgConfig): Promise<IProcessResource> {

    const toReadResource = {
        id: documentPath,
        data: {
            document: {
                src: documentPath
            }
        }
    };

    return processSubPath(toReadResource, config, stagesToProcess);
}