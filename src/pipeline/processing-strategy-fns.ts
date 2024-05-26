import lodash from "lodash";
import { ensureKeyAtDict, getKeyFromDict } from "../components/helpers/dict-util";
import { settleValueOrNull } from "../utils/promise-util";
import type { FalsyAble } from "../components/helpers/generic-types";
import type { IProcessingNode, IResourceProcessor, IProcessResource, ProcessFunction, ProcessStrategy, CanHandleFunction, InputGuardConfig } from "./i-processor";

export type SubProcessorsDict = { [ processorId: string ]: IProcessingNode; };

export async function getProcessorIfCanHandle(resource: IProcessResource, config: any, processor: IResourceProcessor): Promise<IResourceProcessor | null> {
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
}

export async function callProcessFnMergeResource(resource: IProcessResource, config: any, processFn: ProcessFunction, thisObj?: any): Promise<IProcessResource> {
    const transformedResource: IProcessResource = await processFn.call(thisObj, resource, config);

    const mergedResource: IProcessResource = lodash.merge({}, resource, transformedResource);
    return mergedResource;
}

export async function callProcessorMergeResource(resource: IProcessResource, config: any, processor: IResourceProcessor): Promise<IProcessResource> {
    return callProcessFnMergeResource(resource, config, (resource, config) => checkAndProcessWith(resource, config, processor));
}

export async function checkAndProcessWith(resource: IProcessResource, config: any, processor: IResourceProcessor): Promise<IProcessResource> {
    const canHandleProcessor: IResourceProcessor | null = await getProcessorIfCanHandle(resource, config, processor);
    if (!canHandleProcessor) {
        return resource;
    }
    //Process does only return the data that it produces
    //The processor is not themselves resposible for data merging
    const transformedResource: IProcessResource = await processor.process(resource, config);
    return transformedResource;
}

export async function passThroughProcessChain(resource: IProcessResource, config: any, chainToProcess: IResourceProcessor[]): Promise<IProcessResource> {
    let resultResource: IProcessResource = resource;
    for (const processor of chainToProcess) {
        resultResource = await callProcessorMergeResource(resultResource, config, processor);
    }
    return resultResource;
}

export async function passThroughFnChain(resource: IProcessResource, config: any, processFunctions: ProcessFunction[], thisObj: any): Promise<IProcessResource> {
    let resultResource: IProcessResource = resource;
    for (const processFn of processFunctions) {
        resultResource = await callProcessFnMergeResource(resultResource, config, processFn, thisObj);
    }
    return resultResource;
}

export async function findFirstProcessorCanHandle(resource: IProcessResource, config: any, chainToProcess: IResourceProcessor[]): Promise<IResourceProcessor | null> {

    for (const processor of chainToProcess) {
        const canHandleProcessor: IResourceProcessor | null = await getProcessorIfCanHandle(resource, config, processor);
        if (canHandleProcessor) {
            return canHandleProcessor;
        }
    }
    return null;
}

export const processStrategyConfigMapper: Record<ProcessStrategy, ProcessFunction> = {
    'serial': async function (resource: IProcessResource, config: any) {
        const subProcessors: IProcessingNode[] = this.processors;
        return passThroughProcessChain(resource, config, subProcessors);
    },
    'parallel': async function (resource: IProcessResource, config: any) {
        const subProcessors: IProcessingNode[] = this.processors;
        const promises = subProcessors.map((processor) => callProcessorMergeResource(resource, config, processor));
        const resultResources: Array<IProcessResource | null> = await settleValueOrNull(promises);
        return lodash.merge({}, ...resultResources);
    },
    'firstMatch': async function (resource: IProcessResource, config: any) {
        const subProcessors: IProcessingNode[] = this.processors;
        const firstCanHandleProcessor = await findFirstProcessorCanHandle(resource, config, subProcessors);
        if (!firstCanHandleProcessor) {
            return resource;
        }
        return callProcessorMergeResource(resource, config, firstCanHandleProcessor);
    },
    'lastMatch': async function (resource: IProcessResource, config: any) {
        const subProcessors: IProcessingNode[] = this.processors;
        const firstCanHandleProcessor = await findFirstProcessorCanHandle(resource, config, subProcessors.reverse());
        if (!firstCanHandleProcessor) {
            return resource;
        }
        return callProcessorMergeResource(resource, config, firstCanHandleProcessor);
    },
};

export function processWithStrategyFn(strategy: FalsyAble<ProcessStrategy>): ProcessFunction | undefined {
    if (!strategy) {
        return undefined;
    }

    const processStrategyFunction: ProcessFunction = processStrategyConfigMapper[ strategy ];

    if (!processStrategyFunction) {
        return undefined;
    }

    return async function (resource: IProcessResource, config: any): Promise<IProcessResource> {

        console.log(`Processing resource with '${this.id}': ${resource.id}`);

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
}

export const selfReferenceKey: string = '.';

//Could be optimized (does a few unnecessary operations at runtime, like type checking of 'matchCondition')
export function compileSingleRunCanHandleFn(inputGuardConfig?: InputGuardConfig): CanHandleFunction {

    return async function (resource: IProcessResource, config: any): Promise<boolean> {

        console.log(`Check can handle resource with '${this.id}': ${resource.id}`);

        //Oneshot check
        if (isProcessorRegisteredInResource(resource, this)) {
            return false;
        }

        const previousHandlers: string[] | undefined = resource.control?.handledProcIds;
        if (previousHandlers && previousHandlers.includes(this.id)) {
            return false;
        }

        if (!inputGuardConfig) {
            return true;
        }
        if (!inputGuardConfig.matchProp) {
            return true;
        }
        if (!inputGuardConfig.matchCondition) {
            return true;
        }

        let toMatchPropValue: any = null;
        if (inputGuardConfig.matchProp === selfReferenceKey) {
            toMatchPropValue = resource;
        } else {
            toMatchPropValue = getKeyFromDict(resource, inputGuardConfig.matchProp);
        }

        if (inputGuardConfig.matchCondition === toMatchPropValue) {
            return true;
        }
        if (typeof inputGuardConfig.matchCondition === 'boolean' && inputGuardConfig.matchCondition === Boolean(toMatchPropValue)) {
            return true;
        }
        else if (typeof inputGuardConfig.matchCondition === 'string') {
            const matchRegex = new RegExp(inputGuardConfig.matchCondition);
            return matchRegex.test(toMatchPropValue);
        }
        else if (typeof inputGuardConfig.matchCondition === 'function') {
            return inputGuardConfig.matchCondition(toMatchPropValue);
        }

        return false;
    };
}

export function registerProcessorInResource(resource: IProcessResource, processor: IProcessingNode): void {
    ensureKeyAtDict(resource, 'control.handledProcIds', []);
    resource.control?.handledProcIds?.push(processor.id);
}

export function isProcessorRegisteredInResource(resource: IProcessResource, processor: IProcessingNode): boolean {
    //Oneshot check
    const previousHandlers: string[] | undefined = resource.control?.handledProcIds;
    if (previousHandlers && previousHandlers.includes(processor.id)) {
        return true;
    }
    return false;
}