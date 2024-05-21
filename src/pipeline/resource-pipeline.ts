import lodash from "lodash";
import { DataParsedDocument } from "../compilers/runners";
import { addToDictById, addToDictByProp, dictToArray, ensureKeyAtDict, getKeyFromDict } from "../components/helpers/dict-util";
import { SsgConfig } from "../config";
import { settleValueOrNull } from "../utils/promise-util";
import path from "path";
import { filterFalsy } from '../components/helpers/array-util';
import { anchorAndGlob } from "../utils/globbing";
import { FalseAbleVal } from "../utils/util";
import { FalsyAble } from "../components/helpers/generic-types";
import { loadProcessorArrayFromPaths } from "../load-glob-modules";

export interface IProcessResource {
    id?: string,
    control?: {
        parent: IProcessResource,
        handledProcIds: string[];
    };
    content?: any,
    data?: any,
}

export interface IProcessor {
    id: string;
    process(resource: IProcessResource, config: any): Promise<IProcessResource>;
}

export interface IResourceProcessor extends IProcessor {
    canHandle(resource: IProcessResource, config: any): Promise<boolean>;
}

export interface IProcessorBaseProps {
    id: string;
    matchProperty?: string;
    matchValue?: any;
    processStrategy?: 'serial' | 'parallel' | 'firstMatch' | 'lastMatch' | 'allMatch';
    srcDir?: string;
    matchProcessorIds?: string;
}

export interface IPrePostProcessing {
    postProcess?: (resource: IProcessResource, config: any) => Promise<IProcessResource>;
    preProcess?: (resource: IProcessResource, config: any) => Promise<IProcessResource>;
}

export interface IProcessingNodeConfig extends IProcessorBaseProps, IPrePostProcessing {
    guard?: string;
    processors: {
        [ processorId: string ]: IProcessingNodeConfig | IProcessingNodeConfig;
    } | {
        [ matchGuard: string ]: string[];
    };
}

export interface IProcessingNode extends IResourceProcessor, IProcessorBaseProps, IPrePostProcessing {
    processors: {
        [ processorId: string ]: IProcessingNode;
    } | {
        [ matchGuard: string ]: IResourceProcessor[];
    };
    parent?: IProcessingNode;
}

export function isProcessingNodeInstance(toCheck: any): boolean {
    if ((toCheck as IProcessingNode).process) {
        return true;
    }
    return false;
}


export function collectInParents(parentableObject: { parent?: any; }, key: string): any[] {
    const selfAndParents: any[] = [];
    selfAndParents.push(parentableObject);

    let currentObj = parentableObject;
    while (currentObj.parent) {
        currentObj = currentObj.parent;
        selfAndParents.push(currentObj);
    }

    const results: any[] = [];
    selfAndParents.reverse();

    for (const node of selfAndParents) {
        results.push(node[ key ]);
    }

    return filterFalsy(results);
}

export async function initializeShortHandSerialProcessor(parentProcessor: IProcessingNode | undefined, matchKey: FalsyAble<string>, processingChain: string[] | IResourceProcessor[]): Promise<IProcessingNode> {
    if (!parentProcessor) {
        throw new Error('Error can only initialize shorthand processors when a valid parent was passed.');
    }

    const parentProcId: string = parentProcessor.id;

    const newSerialProcessorInstance: IProcessingNode = new ControlProcessingNode();
    newSerialProcessorInstance.processStrategy = 'serial';
    newSerialProcessorInstance.id = '';
    newSerialProcessorInstance.parent = parentProcessor;

    //Should enter in any case
    //newSerialProcessorInstance.matchProperty = undefined;
    newSerialProcessorInstance.matchProperty = parentProcessor.matchProperty;
    if (matchKey) {
        newSerialProcessorInstance.matchValue = matchKey;
    }

    const ancestorSrcDirs: string[] = collectInParents(parentProcessor, 'srcDir');
    const idProcessorSrcDir = path.resolve(path.join(...ancestorSrcDirs));

    const subProcessorInstances: Record<string, IProcessingNode> = {};
    for (const item of processingChain) {

        if (typeof item === 'string') {
            const fileExtToLoad = item + "." + parentProcId + ".ts";
            const processorMatchGlobs = [
                //fileExtToLoad,
                '*' + fileExtToLoad,
                //'**/' + fileExtToLoad,
                '**/*' + fileExtToLoad
            ];
            const processorInstances: Array<IProcessingNode> = await loadProcessorArrayFromPaths<IProcessingNode>([ idProcessorSrcDir ], processorMatchGlobs, '.' + parentProcId);

            for (const processor of processorInstances) {
                if (processor.id) {
                    subProcessorInstances[ processor.id ] = processor;
                }
            }

            //subProcessorInstances[ processorInstances[ 0 ].id ] = processorInstances[ 0 ];
            //Object.assign(subProcessorInstances, processorInstances);
        }
        const resourceProc: any = item as IResourceProcessor;
        if (resourceProc && resourceProc.process && resourceProc.id) {
            subProcessorInstances[ resourceProc.id ] = item as IProcessingNode;
        }

    }
    newSerialProcessorInstance.processors = subProcessorInstances;

    return newSerialProcessorInstance;
}

export type IProcessNodeConfigFork = IProcessingNodeConfig | IProcessingNode | IResourceProcessor[] | string[];

export async function processNodeInstanceFromConf(nodeConfig: IProcessingNodeConfig, nodeKey: FalsyAble<string>, parentNode: FalsyAble<IProcessingNode>): Promise<IProcessingNode> {
    const controlTreeNode: ControlProcessingNode<any> = new ControlProcessingNode();

    Object.assign(controlTreeNode, nodeConfig);
    controlTreeNode.processors = {};
    (controlTreeNode as IProcessingNodeConfig).guard = undefined;

    if (parentNode) {
        controlTreeNode.parent = parentNode;
    }

    if (nodeConfig.processors) {

        /*const initializePromises: Promise<IProcessingNode>[] = [];
        for (const key in nodeConfig.processors) {
            const currentProcessor: IProcessNodeConfigFork = nodeConfig.processors[ key ];

            initializePromises.push(initializeProcessingNode(currentProcessor, key, controlTreeNode));
            //controlTreeNode.processors[ key ] = await initializeProcessingNode(currentProcessor, key, controlTreeNode);
        }
        const initializedProcessors: Array<IProcessingNode | null> = await settleValueOrNull(initializePromises);
        const validInitializedProcessors: Array<IProcessingNode> = filterFalsy(initializedProcessors);

        addToDictByProp(controlTreeNode.processors, validInitializedProcessors, 'matchValue');*/
        //const nodeProcessors: IProcessNodeConfigFork[] = dictToArray(nodeConfig.processors as any);

        for (const key in nodeConfig.processors) {
            const currentProcessor: IProcessNodeConfigFork = nodeConfig.processors[ key ];
            controlTreeNode.processors[ key ] = await initializeProcessingNode(currentProcessor, key, controlTreeNode);
        }
    }
    return controlTreeNode;
}

export async function initializeProcessingNode(nodeConfig: IProcessNodeConfigFork, nodeKey: FalsyAble<string>, parentNode: IProcessingNode | undefined): Promise<IProcessingNode> {
    if (isProcessingNodeInstance(nodeConfig)) {
        return nodeConfig as IProcessingNode;
    }
    if (Array.isArray(nodeConfig)) {
        return initializeShortHandSerialProcessor(parentNode, nodeKey, nodeConfig);
    }
    if (!nodeConfig.id) {
        nodeConfig.id = nodeKey as any;
    }

    return processNodeInstanceFromConf(nodeConfig as IProcessingNodeConfig, nodeKey, parentNode);
}

export type SubProcessorsDict = { [ processorId: string ]: IProcessingNode; };

export async function callProcessMergeResource(resource: IProcessResource, config: any, processor: IResourceProcessor): Promise<IProcessResource> {

    if (!processor.canHandle(resource, config)) {
        return resource;
    }

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
        resultResource = await callProcessMergeResource(resultResource, config, processor);
    }
    return resultResource;
}

export async function findFirstProcessorCanHandle(resource: IProcessResource, config: any, chainToProcess: IResourceProcessor[]): Promise<IResourceProcessor | null> {

    for (const processor of chainToProcess) {
        if (await processor.canHandle(resource, config)) {
            return processor;
        }
    }
    return null;
}

export class ControlProcessingNode<ConfigType> implements IProcessingNode, IResourceProcessor {

    processors: SubProcessorsDict = {};
    parent?: IProcessingNode;
    id: string = '';
    matchProperty?: string | undefined;
    processStrategy?: "serial" | "parallel" | "firstMatch" | "lastMatch" | "allMatch" | undefined;
    //srcDir?: string | undefined;
    matchProcessorIds?: string | undefined;
    postProcess?: ((resource: IProcessResource, config: ConfigType) => Promise<IProcessResource>) | undefined;
    preProcess?: ((resource: IProcessResource, config: ConfigType) => Promise<IProcessResource>) | undefined;

    //constructor (treeConfig: IProcessingNodeConfig) { }
    public async canHandle(resource: IProcessResource, config: ConfigType): Promise<boolean> {

        console.log(`Check can handle resource with ${this.id}: ${resource.id}`);

        const previousHandlers: string[] | undefined = resource.control?.handledProcIds;
        if (previousHandlers && previousHandlers.includes(this.id)) {
            return false;
        }

        if (!this.matchProperty) {
            return true;
        }

        if (this.matchProperty.startsWith('.')) {
            this.matchProperty = this.matchProperty.slice(1);
        }

        const unpackedResourceVal = getKeyFromDict(resource, this.matchProperty);
        if (unpackedResourceVal) {
            return true;
        }

        return false;
    }

    protected async processInternal(resource: IProcessResource, config: ConfigType): Promise<IProcessResource> {
        if (!this.processors) {
            return resource;
        }

        const subProcessorsDict: SubProcessorsDict = this.processors;

        const subProcessorIds: string[] = Object.keys(subProcessorsDict);

        if (subProcessorIds.length <= 0) {
            return resource;
        }

        const subProcessors: IProcessingNode[] = subProcessorIds.map((id) => subProcessorsDict[ id ]);

        if (this.processStrategy === 'serial') {
            return passThroughProcessChain(resource, config, subProcessors);
        }
        else if (this.processStrategy === 'parallel') {
            const promises = subProcessors.map((processor) => callProcessMergeResource(resource, config, processor));
            const resultResources: Array<IProcessResource | null> = await settleValueOrNull(promises);
            return lodash.merge({}, ...resultResources);
        }
        else if (this.processStrategy === 'firstMatch') {
            const firstCanHandleProcessor = await findFirstProcessorCanHandle(resource, config, subProcessors);
            if (!firstCanHandleProcessor) {
                return resource;
            }
            return callProcessMergeResource(resource, config, firstCanHandleProcessor);
        }
        else if (this.processStrategy === 'lastMatch') {
            const firstCanHandleProcessor = await findFirstProcessorCanHandle(resource, config, subProcessors.reverse());
            if (!firstCanHandleProcessor) {
                return resource;
            }
            return callProcessMergeResource(resource, config, firstCanHandleProcessor);
        }
        return resource;
    }

    public async process(resource: IProcessResource, config: ConfigType): Promise<IProcessResource> {

        console.log(`Processing resource with '${this.id}': ${resource.id}`);

        if (this.preProcess) {
            resource = await this.preProcess(resource, config);
        }

        resource = await this.processInternal(resource, config);

        ensureKeyAtDict(resource, 'control.handledProcIds', []);
        resource.control?.handledProcIds.push(this.id);

        if (this.postProcess) {
            resource = await this.postProcess(resource, config);
        }

        return resource;
    }
}

