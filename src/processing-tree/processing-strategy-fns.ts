import type { IProcessingNode, IResourceProcessor, IGenericResource, IProcessor, IGenericControl, ProcessFunction, CanProcessFn } from "./i-processor";
import type { InputGuardConfig } from "./i-processor-config";
import { ensureKeyAtDict, filterFalsy, getKeyFromDict, FalsyAble, processChainReturnLastDefined } from '@markus/ts-node-util-mk1';
import { settleValueOrNull } from "@markus/ts-node-util-mk1";
//export type SubProcessorsDict = { [ processorId: string ]: IProcessingNode; };

export interface IRuntimeConfig {
    parrallelMergeFn?: any;
}

export type ProcessProcessorChainFn = (
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
) => Promise<IGenericResource>;


export function isGuardOpen(
    guardPropValue: any,
    defaultValue: boolean = true,
    ...args: any[]
): Promise<boolean> | boolean {
    if (typeof guardPropValue == 'boolean') {
        return guardPropValue;
    }

    if (typeof guardPropValue == 'function') {
        return guardPropValue(...args);
    }
    return defaultValue;
}

export function isNodeGuardOpen(
    node: IProcessingNode,
    //defaultValue: boolean = true,
    ...args: any[]
): Promise<boolean> | boolean {

    return isGuardOpen(
        node.canProcess,
        true,
        //defaultValue,
        ...args
    );
}

export async function processSerial(
    chainToProcess: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig,
    ...args: any[]
): Promise<IGenericResource> {

    let resultResource: IGenericResource = resource;
    for (const processor of chainToProcess) {
        resultResource = await processNode(processor, resource, config);
    }
    return resultResource;
}

export async function processParallel(
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
): Promise<IGenericResource> {

    const promises: Promise<IGenericResource>[] = [];
    for (const processor of processors) {
        promises.push(processNode(processor, resource, config));

    }
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

        const processedResource: IGenericResource = await processNode(processor, resource, config);

        if (processedResource !== resource) {
            return processedResource;
        }
    }
    return resource;
}
export async function processLastCanHandleMatch(
    processors: IProcessor[],
    resource: IGenericResource,
    config: IRuntimeConfig
): Promise<IGenericResource> {

    const processorsShallowCopy: IProcessor[] = [ ...processors ];

    return processFirstCanHandleMatch(
        processorsShallowCopy.reverse(),
        resource,
        config
    );
}

export const processStrategyFns: Record<string, ProcessProcessorChainFn> = {
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

export async function processNodeChildren(
    node: IProcessingNode,
    resource: IGenericResource,
    config: IRuntimeConfig,
    childrenSelectStrategy?: string
): Promise<IGenericResource> {

    if ((node as any).strategy) {
        childrenSelectStrategy = (node as any).strategy;
    }
    if (!childrenSelectStrategy) {
        childrenSelectStrategy = 'default';
    }

    const subProcessors: FalsyAble<IProcessor[]> = node.processors;

    if (!subProcessors || subProcessors.length <= 0) {
        return resource;
    }

    console.log(`Processing Children of '${node.id}': <res-id> '${resource.id}' <src> ${resource.src} <fragment> ${resource.fragmentId} ${resource.fragmentTag}`);

    const childrenStrategyProcessFn = processStrategyFns[ childrenSelectStrategy ];

    let childrenProcessedResource: IGenericResource = await childrenStrategyProcessFn(
        subProcessors,
        resource,
        config
    );
    if (childrenProcessedResource !== resource && !childrenProcessedResource.parent) {
        childrenProcessedResource.parent = resource;
    }
    if (!childrenProcessedResource) {
        return resource;
    }

    return childrenProcessedResource;
}

export async function processNode(
    node: IProcessingNode,
    resource: IGenericResource,
    config: IRuntimeConfig,
    //childrenSelectStrategy?: string
): Promise<IGenericResource> {

    const canProcess: boolean = await isNodeGuardOpen(
        node,
        resource,
        config
    );
    if (!canProcess) {
        return resource;
    }

    console.log(`Processing '${node.id}': <res-id> '${resource.id}' <src> ${resource.src} <fragment> ${resource.fragmentId} ${resource.fragmentTag}`);

    const processingChain: ProcessFunction[] = filterFalsy([
        node.preProcess,
        node.process,
        (resource: IGenericResource, config: IRuntimeConfig) => processNodeChildren(node, resource, config),
        node.postProcess
    ]);

    const processedResource: IGenericResource = await processChainReturnLastDefined(
        processingChain,
        node,
        resource,
        config
    );

    if (!node.merge) {
        return processedResource;
    }

    node.merge(
        resource,
        processedResource,
        config
    );

    return resource;

    /*let inputResource: IGenericResource = resource;
    if (node.preProcess) {
        inputResource = await node.preProcess(resource, config);
    }
    if (!inputResource) {
        return resource;
    }

    let selfProcessedResource: IGenericResource = resource;
    if (node.process) {
        selfProcessedResource = node.process(selfProcessedResource, config);
    }

    let childrenProcessedResource: IGenericResource = await processNodeChildren(
        node,
        resource,
        config
    );
    //registerNodeInResource(node, resource);

    if (node.postProcess) {
        childrenProcessedResource = await node.postProcess(childrenProcessedResource, config);
    }

    return childrenProcessedResource;`*/
}


export const selfReferenceKey: string = '.';

export function checkInputGuardMatch(
    inputGuard: FalsyAble<InputGuardConfig>,
    resource: IGenericResource,
    config: IRuntimeConfig
): boolean {
    if (!inputGuard) {
        return true;
    }
    if (!inputGuard.inputMatchProp) {
        return true;
    }
    if (!inputGuard.inputMatchCondition) {
        return true;
    }

    let toMatchPropValue: any = null;
    if (inputGuard.inputMatchProp === selfReferenceKey) {
        toMatchPropValue = resource;
    } else {
        toMatchPropValue = getKeyFromDict(resource, inputGuard.inputMatchProp);
    }

    if (inputGuard.inputMatchCondition === toMatchPropValue) {
        return true;
    }
    if (typeof inputGuard.inputMatchCondition === 'boolean' && inputGuard.inputMatchCondition === Boolean(toMatchPropValue)) {
        return true;
    }
    else if (typeof inputGuard.inputMatchCondition === 'string') {
        const matchRegex = new RegExp(inputGuard.inputMatchCondition);
        return matchRegex.test(toMatchPropValue);
    }
    else if (typeof inputGuard.inputMatchCondition === 'function') {
        return inputGuard.inputMatchCondition(toMatchPropValue);
    }

    return false;
}


export function getResourceInputGuardFn(
    inputGuard: FalsyAble<InputGuardConfig>
): CanProcessFn {

    return (
        resource: IGenericResource,
        config: any,
    ) => checkInputGuardMatch(
        inputGuard,
        resource,
        config
    );
}

/*export function canNodeProcess(
    node: IProcessingNode,
    resource: IGenericResource,
    config: IRuntimeConfig,
    inputGuard?: InputGuardConfig
): boolean {
    //Oneshot check
    if (isNodeRegisteredInResource(node, resource)) {
        return false;
    }

    if (node.canProcess !== undefined) {
        return evaluateNodeCanProcess(
            node,
            resource,
            config
        );
    }

    //console.log(`Check can handle resource with '${this.id}': ${resource.id}`);
    const isProcessingTarget: boolean = checkInputGuardMatch(resource, inputGuard);

    return isProcessingTarget;
}*/

//Could be optimized (does a few unnecessary operations at runtime, like type checking of 'inputMatchCondition')
/*export function compileDefaultCanProcessGuardFn(inputGuardConfig?: InputGuardConfig): CanHandleFunction {
    return async function (resource: IGenericResource, config: IRuntimeConfig): Promise<boolean> {
        return defaultCanProcess(resource, config, inputGuardConfig);
    };
}*/

export function registerNodeInResource(node: IProcessingNode, resource: IGenericResource): void {
    //ensureKeyAtDict(resource, 'handledProcIds', []);
    //((resource as IGenericControl).handledProcIds as string[]).push(node.id);
}

export function isNodeRegisteredInResource(node: IProcessingNode, resource: IGenericResource): boolean {
    //Oneshot check
    /*const previousHandlers: string[] | undefined = resource.handledProcIds;
    if (previousHandlers && previousHandlers.includes(node.id)) {
        return true;
    }
    return false;*/
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