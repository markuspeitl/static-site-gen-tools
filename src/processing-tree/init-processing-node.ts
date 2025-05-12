import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { IProcessingNode, ProcessFunction, CanProcessEvaluator, IGenericResource, IChildProcessor } from "./i-processor";
import type { IProcessingNodeConfig, ChainAbleProcessorId, InputGuardConfig, INodeChildrenConfig, ConfigNodeType, MatchingProcessorsDef, FileProcessorsDef, INodeChildrenProcessorsConfig } from "./i-processor-config";
import { loadProcessorArrayFromPaths } from "./load-file-processors";
import { getResourceInputGuardFn, processNode } from "./processing-strategy-fns";
import { initFileChildProcessors } from "./init-file-processing-nodes";
import path from "path";

export const assingCollectProps: string[] = [
    'type',
    'fileSrcDirs',
    'filePostfix',
    'fileChainStrategy',
    'strategy',
    'inputMatchProp',
    'inputMatchCondition',
];

export function inheritJoinSearchPaths(
    parentSearchPaths: FalsyAble<string[]>,
    childSearchPaths: FalsyAble<string[]>
): string[] {

    let currentSearchPaths: string[] = [];

    if (!childSearchPaths) {
        return parentSearchPaths || [];
    }
    if (!parentSearchPaths) {
        return childSearchPaths || [];
    }
    for (const parentSearchPath of parentSearchPaths) {
        for (const subSearchPath of childSearchPaths) {
            const joinedSubSearchPath = path.join(parentSearchPath, subSearchPath);
            currentSearchPaths.push(joinedSubSearchPath);
        }
    }
    return currentSearchPaths;
}

export function collectNodeState(
    toExtractStateFrom: any,
    ancestorNodeState?: any
): any {
    const newCollectedProps: any = {};

    if (ancestorNodeState) {
        assignDefinedProps(
            newCollectedProps,
            ancestorNodeState,
            undefined,
            assingCollectProps
        );
    }

    /*assignDefinedProps(
        newCollectedProps,
        nodeConfig.computedState,
        undefined,
        assingCollectProps
    );*/
    if (toExtractStateFrom) {
        assignDefinedProps(
            newCollectedProps,
            toExtractStateFrom,
            undefined,
            assingCollectProps
        );
    }

    newCollectedProps.currentSearchPaths = inheritJoinSearchPaths(
        ancestorNodeState?.currentSearchPaths,
        toExtractStateFrom?.fileSrcDirs
    );

    return newCollectedProps;
}

export function mergeInitChildrenState(
    nodeConfig: IProcessingNodeConfig,
    parentConfig: FalsyAble<IProcessingNodeConfig>
) {
    if (!nodeConfig) {
        return;
    }

    const currentState: any = collectNodeState(
        nodeConfig.children,
        parentConfig?.children,
    );
    if (!nodeConfig.children) {
        nodeConfig.children = {};
    }

    nodeConfig.children.idPath = (parentConfig?.children?.idPath || '') + "." + (nodeConfig.id || '');

    Object.assign(nodeConfig.children, currentState);


    /*if (!nodeConfig.children.state) {
        nodeConfig.children.state = collectNodeState(
            nodeConfig.children,
            parentConfig?.children,
        );
    }*/
}

export function isProcessingNodeInstance(toCheck: any): toCheck is IProcessingNode {
    if ((toCheck as IProcessingNode).process) {
        return true;
    }
    return false;
}

export async function passResource(resource: IGenericResource, ...args: any[]): Promise<IGenericResource> {
    return resource;
}

export function getInputGuardFn(node: IProcessingNode, nodeConfig: IProcessingNodeConfig): any {

    if (node.canProcess) {
        return node.canProcess;
    }
    if (nodeConfig.canProcess) {
        return nodeConfig.canProcess;
    }

    const inputGuardProps: InputGuardConfig = {
        inputMatchProp: nodeConfig.inputMatchProp,
        inputMatchCondition: nodeConfig.inputMatchCondition
    };

    return getResourceInputGuardFn(inputGuardProps);
}

//Initialize only the current node --> not the full subtree
export function initShallowConfigNode(
    nodeConfig: IProcessingNodeConfig,
    //parentNode: FalsyAble<IProcessingNode>
): IProcessingNode {

    //const parentNodeIdPrefix: string = parentNode?.id + "." || '';
    const processingNodeInstance: Partial<IProcessingNode> = {
        id: nodeConfig.id,
        //parent: parentNode as IProcessingNode | undefined, // || nodeConfig.parent,
        preProcess: nodeConfig.preProcess,
        process: nodeConfig.process,
        postProcess: nodeConfig.postProcess,
        merge: nodeConfig.merge,
        processors: [],
        config: nodeConfig,
        //srcDirs: nodeConfig.srcDirs,
        strategy: nodeConfig.strategy,
    };
    processingNodeInstance.canProcess = getInputGuardFn(processingNodeInstance as IProcessingNode, nodeConfig);

    /*processingNodeInstance.process = nodeConfig.process;

    if (nodeConfig.process) {
        processingNodeInstance.process = nodeConfig.process;
    }
    else {
        const processNodeFn: ProcessFunction = (
            resource: IGenericResource,
            config: any,
        ) => processNode(
            processingNodeInstance as IProcessingNode,
            resource,
            config,
            nodeConfig.strategy
        );
        processingNodeInstance.process = processNodeFn;
    }*/
    //Object.assign(processingNodeInstance, nodeConfig.inputGuard);

    /*const controlTreeNode: ControlProcessingNode<any> = new ControlProcessingNode();
    controlTreeNode.id = nodeConfig.id;
    Object.assign(controlTreeNode, nodeConfig.inputGuard);
    controlTreeNode.processStrategy = nodeConfig.strategy;
    controlTreeNode.preProcess = nodeConfig.preProcess;
    controlTreeNode.postProcess = nodeConfig.postProcess;
    controlTreeNode.processors = [];*/

    return processingNodeInstance as IProcessingNode;
}

export async function initConfChildProcessor(
    childProcessorConfig: ConfigNodeType,
    parentConfig: FalsyAble<IProcessingNodeConfig>,
): Promise<IProcessingNode> {

    if (isProcessingNodeInstance(childProcessorConfig)) {
        return childProcessorConfig;
    }
    //const baseChildMergedConfig: IProcessingNodeConfig = Object.assign({}, baseConfig, configProcessingNode);

    const processingNodeInstance: IProcessingNode = await initProcessingTreeFromConf(
        childProcessorConfig,
        parentConfig
    );

    return processingNodeInstance;
}

export async function initConfChildProcessors(
    childrenConfig: INodeChildrenProcessorsConfig,
    parentConfig: FalsyAble<IProcessingNodeConfig>,
    //configChildNodes: FalsyAble<ConfigNodeType[]>,
    //parentConfig: FalsyAble<IProcessingNodeConfig>,
): Promise<IProcessingNode[] | undefined> {


    const childProcessorConfigs: FalsyAble<ConfigNodeType[]> = childrenConfig.processors as ConfigNodeType[];

    if (!childProcessorConfigs) {
        return undefined;
    }

    const initConfChildPromises: Promise<IProcessingNode>[] = [];

    for (const childProcessorConfig of childProcessorConfigs) {

        initConfChildPromises.push(
            initConfChildProcessor(
                childProcessorConfig,
                parentConfig
            )
        );
    }
    return Promise.all(initConfChildPromises);
}

export function setProcessorsParent(
    processors: any[],
    node: IProcessingNode
): void {
    if (!processors) {
        return;
    }

    for (const processor of processors) {
        processor.parent = node;
    }
}

export const defaultNodeChildrenConfig: INodeChildrenConfig = {
    type: 'processor',
    strategy: 'serial',
    inputMatchProp: undefined,
    inputMatchCondition: undefined
};

export function processorsConfigDictToArray(
    dict: MatchingProcessorsDef
): ConfigNodeType[] | undefined {
    if (!dict) {
        return undefined;
    }

    const configNodes: ConfigNodeType[] = [];
    for (const key in dict) {
        const currentProcConf: ConfigNodeType = dict[ key ];
        currentProcConf.id = key;
        configNodes.push(currentProcConf);
    }
    return configNodes;
}

export function assignDefinedProps(
    target: any,
    src: any,
    excludedKeys?: string[],
    includedKeys?: string[],
): any {
    if (!src) {
        return;
    }

    if (!excludedKeys) {
        excludedKeys = [];
    }
    let includeAll: boolean = false;
    if (!includedKeys) {
        includeAll = true;
        includedKeys = [];
    }

    for (const key in src) {
        const srcValue = src[ key ];


        if (!excludedKeys.includes(key)) {
            if (includeAll || includedKeys.includes(key)) {
                if (srcValue !== undefined) {
                    target[ key ] = srcValue;
                }
            }
        }
    }
    return target;
}



export async function initChildProcessors(
    nodeConfig: IProcessingNodeConfig,
    parentConfig: FalsyAble<IProcessingNodeConfig>,
): Promise<FalsyAble<IChildProcessor[]>> {
    mergeInitChildrenState(
        nodeConfig,
        parentConfig
    );

    if (!nodeConfig.children) {
        nodeConfig.children = defaultNodeChildrenConfig;
    }

    const nodeChildrenConfig: INodeChildrenConfig | undefined = nodeConfig.children;

    if (!nodeChildrenConfig.processors) {
        return undefined;
    }

    if (nodeChildrenConfig.type === 'file') {
        return initFileChildProcessors(
            nodeConfig.children,
            nodeConfig
            //nodeConfig.processors as FileProcessorsDef,
            //nodeConfig.children
            /*nodeConfig.id,
            nodeConfig,
            nodeChildrenConfig,
            nodeInstance*/
        );
    }

    /*setProcessorsParent(
        nodeConfig.processors as ConfigNodeType[],
        nodeInstance
    );*/

    if (!Array.isArray(nodeConfig.processors) && typeof nodeConfig.processors === 'object') {
        nodeConfig.children.processors = processorsConfigDictToArray(nodeConfig.processors as MatchingProcessorsDef);
    }

    return initConfChildProcessors(
        nodeConfig.children,
        nodeConfig
        //nodeConfig.processors as ConfigNodeType[],
    );

    /*if (nodeChildrenConfig.)

    if (nodeConfig.processors && nodeConfig.fileProcessorChains) {
        throw new Error(`Both 'processors' children and 'fileProcessorChains' children are defined in '${nodeConfig.id}' which is not allowed`);
    }

    if (!nodeConfig.processors && !nodeConfig.fileProcessorChains) {
        return [];
    }

    if (nodeConfig.processors) {
        return initConfChildProcessors(nodeConfig.processors, targetInitNode);
    }

    if (nodeConfig.fileProcessorChains) {
        return initFileChildProcessors(nodeConfig, targetInitNode);
    }
    return targetInitNode.processors;*/
}


export async function initProcessingTreeFromConf(
    nodeConfig: IProcessingNodeConfig,
    parentConfig: FalsyAble<IProcessingNodeConfig>,
): Promise<IProcessingNode> {

    if (isProcessingNodeInstance(nodeConfig)) {
        return nodeConfig as IProcessingNode;
    }

    mergeInitChildrenState(
        nodeConfig,
        parentConfig
    );

    console.time(nodeConfig.id + "_shallow_self_time");

    const shallowNodeInstance: IProcessingNode = initShallowConfigNode(
        nodeConfig
    );

    console.timeEnd(nodeConfig.id + "_shallow_self_time");


    console.time(nodeConfig.id + "_children_time");

    const childProcessors: FalsyAble<IChildProcessor[]> = await initChildProcessors(
        nodeConfig,
        parentConfig
    );

    shallowNodeInstance.processors = childProcessors || undefined;

    console.timeEnd(nodeConfig.id + "_children_time");

    /*if (childProcessors) {
        shallowNodeInstance.processors = childProcessors;
        setProcessorsParent(
            shallowNodeInstance.processors,
            shallowNodeInstance
        );
    }*/

    return shallowNodeInstance;
}