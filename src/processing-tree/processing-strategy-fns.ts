import type { IProcessingNode, IResourceProcessor, IGenericResource, IProcessor, IGenericControl } from "./i-processor";
import type { InputGuardConfig } from "./i-processor-config";
import { ensureKeyAtDict, getKeyFromDict } from "@markus/ts-node-util-mk1";
import { settleValueOrNull } from "@markus/ts-node-util-mk1";
//export type SubProcessorsDict = { [ processorId: string ]: IProcessingNode; };

export interface IRuntimeConfig {
    parrallelMergeFn?: any;
}

export function evaluateNodeCanProcess(
    node: IProcessingNode,
    resource: IGenericResource,
    config: IRuntimeConfig
): Promise<boolean> | boolean {
    if (typeof node.canProcess == 'boolean') {
        return node.canProcess;
    }

    if (typeof node.canProcess == 'function') {
        return node.canProcess(resource, config);
    }
    //return false;
    return true;
}

export async function processSerial(
    chainToProcess: IResourceProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig,
    ...args: any[]
): Promise<IGenericResource> {

    let resultResource: IGenericResource = resource;
    for (const processor of chainToProcess) {
        resultResource = await processor.process(resource, config, ...args);
    }
    return resultResource;
}

export async function processParallel(
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
): Promise<IGenericResource> {

    const promises = processors.map((processor) => processor.process(resource, config));
    const resultResources: Array<IGenericResource | null> = await settleValueOrNull(promises);

    if (config.parrallelMergeFn) {
        return config.parrallelMergeFn({}, ...resultResources);
    }

    return Object.assign({}, ...resultResources);
}

export async function processFirstCanHandleMatch(
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
): Promise<IGenericResource> {

    for (const processor of processors) {

        const canProcess: boolean = await evaluateNodeCanProcess(
            processor,
            resource,
            config
        );
        if (canProcess) {
            return processor.process(resource, config);
        }
    }
    return resource;
}
export async function processLastCanHandleMatch(
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
): Promise<IGenericResource> {

    return processFirstCanHandleMatch(
        processors.reverse(),
        resource,
        config
    );
}

export type ProcessWithProcessorsFn = (
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
) => Promise<IGenericResource>;

export const processStrategyFns: Record<string, ProcessWithProcessorsFn> = {
    'serial': processSerial,
    'parallel': processParallel,
    'firstMatch': processFirstCanHandleMatch,
    'lastMatch': processLastCanHandleMatch,
};
processStrategyFns.default = processStrategyFns.serial;

export function getNodeProcessors(processingNode: IProcessingNode): IProcessor[] {
    if (!processingNode.processors) {
        processingNode.processors = [];
    }
    const subProcessors: IProcessor[] = processingNode.processors;
    return subProcessors;
}

export async function processNode(
    node: IProcessingNode,
    resource: IGenericResource,
    config: IRuntimeConfig,
    selectStrategy?: string
): Promise<IGenericResource> {

    const subProcessors: IProcessor[] = getNodeProcessors(node);
    if ((node as any).strategy) {
        selectStrategy = (node as any).strategy;
    }
    if (!selectStrategy) {
        selectStrategy = 'default';
    }

    if (node.preProcess) {
        resource = await node.preProcess(resource, config);
    }

    resource = await processStrategyFns[ selectStrategy ](
        subProcessors,
        resource,
        config
    );
    registerNodeInResource(node, resource);

    if (node.postProcess) {
        resource = await node.postProcess(resource, config);
    }

    return resource;
}


export const selfReferenceKey: string = '.';

export function checkInputGuardMatch(
    resource: IGenericResource,
    inputGuard?: InputGuardConfig
): boolean {
    if (!inputGuard) {
        return true;
    }
    if (!inputGuard.matchProp) {
        return true;
    }
    if (!inputGuard.matchCondition) {
        return true;
    }

    let toMatchPropValue: any = null;
    if (inputGuard.matchProp === selfReferenceKey) {
        toMatchPropValue = resource;
    } else {
        toMatchPropValue = getKeyFromDict(resource, inputGuard.matchProp);
    }

    if (inputGuard.matchCondition === toMatchPropValue) {
        return true;
    }
    if (typeof inputGuard.matchCondition === 'boolean' && inputGuard.matchCondition === Boolean(toMatchPropValue)) {
        return true;
    }
    else if (typeof inputGuard.matchCondition === 'string') {
        const matchRegex = new RegExp(inputGuard.matchCondition);
        return matchRegex.test(toMatchPropValue);
    }
    else if (typeof inputGuard.matchCondition === 'function') {
        return inputGuard.matchCondition(toMatchPropValue);
    }

    return false;
}

export function canNodeProcess(
    node: IProcessingNode,
    resource: IGenericResource,
    config: IRuntimeConfig,
    inputGuard?: InputGuardConfig
): boolean {
    //Oneshot check
    if (isNodeRegisteredInResource(node, resource)) {
        return false;
    }

    /*if (node.canProcess !== undefined) {
        return evaluateNodeCanProcess(
            node,
            resource,
            config
        );
    }*/

    //console.log(`Check can handle resource with '${this.id}': ${resource.id}`);
    const isProcessingTarget: boolean = checkInputGuardMatch(resource, inputGuard);

    return isProcessingTarget;
}

//Could be optimized (does a few unnecessary operations at runtime, like type checking of 'matchCondition')
/*export function compileDefaultCanProcessGuardFn(inputGuardConfig?: InputGuardConfig): CanHandleFunction {
    return async function (resource: IGenericResource, config: IRuntimeConfig): Promise<boolean> {
        return defaultCanProcess(resource, config, inputGuardConfig);
    };
}*/

export function registerNodeInResource(node: IProcessingNode, resource: IGenericResource): void {
    ensureKeyAtDict(resource, 'control.handledProcIds', []);
    ((resource.control as IGenericControl).handledProcIds as string[]).push(node.id);
}

export function isNodeRegisteredInResource(node: IProcessingNode, resource: IGenericResource): boolean {
    //Oneshot check
    const previousHandlers: string[] | undefined = resource.control?.handledProcIds;
    if (previousHandlers && previousHandlers.includes(node.id)) {
        return true;
    }
    return false;
}




/*export async function processNodeWithStrategyFn(
    resource: IGenericResource,
    config: IRuntimeConfig,
    processStrategyFunction: ProcessFunction
): Promise<IGenericResource> {

    //console.log(`LOG: Processing resource with '${this.id}': ${resource.id}`);

    if (this.preProcess) {
        resource = await this.preProcess(resource, config);
    }

    //resource = await this.processInternal(resource, config);
    resource = await processStrategyFunction.call(this, resource, config);
    registerProcessorInResource(resource, this);

    if (this.postProcess) {
        resource = await this.postProcess(resource, config);
    }

    return resource;
};

export function compileProcessWithStrategyFn(processingNode: IProcessingNode, strategy: FalsyAble<ProcessStrategy>): ProcessFunction | undefined {
    if (!strategy) {
        return undefined;
    }

    const processStrategyFunction: ProcessFunction = processStrategyFns[ strategy ];

    if (!processStrategyFunction) {
        return undefined;
    }

    return async function (resource: IGenericResource, config: IRuntimeConfig) {
        return processNodeWithStrategyFn(resource, config, processStrategyFunction);
    };
}*/

/*export function applyStrategyTargetProcessors(
    selectedStrategy: string,
    resource: IGenericResource,
    config: IRuntimeConfig
): ProcessFunction | undefined {
    if (!processStrategyConfigMapper) {
        return undefined;
    }

    let subProcessors: IProcessingNode[] = []
    if (!selectedStrategy) {
        subProcessors = processStrategyConfigMapper.default(resource, config);
    }
}*/

/*export async function findFirstProcessorCanHandle(resource: IGenericResource, config: IRuntimeConfig, chainToProcess: IResourceProcessor[]): Promise<IResourceProcessor | null> {

    for (const processor of chainToProcess) {
        const canHandleProcessor: IResourceProcessor | null = await getProcessorIfCanHandle(resource, config, processor);
        if (canHandleProcessor) {
            return canHandleProcessor;
        }
    }
    return null;
}*/


/*export async function getProcessorIfCanHandle(resource: IGenericResource, config: IRuntimeConfig, processor: IResourceProcessor): Promise<IResourceProcessor | null> {
    if (!processor) {
        return null;
    }
    if (!resource) {
        return null;
    }

    const processorCanHandleResource: boolean = await processor.canHandle(resource, config);
    if (!processorCanHandleResource) {
        return null;
    }
    return processor;
}*/

/*export async function callProcessFnMergeResource(resource: IGenericResource, config: IRuntimeConfig, processFn: ProcessFunction, thisObj?: any): Promise<IGenericResource> {
    const transformedResource: IGenericResource = await processFn.call(thisObj, resource, config);

    const mergedResource: IGenericResource = lodash.merge({}, resource, transformedResource);
    return mergedResource;
}

export async function callProcessorMergeResource(resource: IGenericResource, config: IRuntimeConfig, processor: IResourceProcessor): Promise<IGenericResource> {
    return callProcessFnMergeResource(resource, config, (resource, config) => checkAndProcessWith(resource, config, processor));
}*/

/*export async function checkAndProcessWith(resource: IGenericResource, config: IRuntimeConfig, processor: IResourceProcessor): Promise<IGenericResource> {
    const canHandleProcessor: IResourceProcessor | null = await getProcessorIfCanHandle(resource, config, processor);
    if (!canHandleProcessor) {
        return resource;
    }
    //Process does only return the data that it produces
    //The processor is not themselves resposible for data merging
    const transformedResource: IGenericResource = await processor.process(resource, config);
    return transformedResource;
}*/