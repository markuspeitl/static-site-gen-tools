import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { IProcessingNode, ProcessFunction, CanProcessEvaluator, IGenericResource } from "./i-processor";
import type { IProcessingNodeConfig, ChainAbleProcessorId, SubProcessorsConfig, FileChainProcessorConfig } from "./i-processor-config";
import { loadProcessorArrayFromPaths } from "./load-file-processors";
import { canNodeProcess, processNode } from "./processing-strategy-fns";
import { calculateProcessorFileSearchOpts, FileSearchOptions } from "./discover-processors";

export function isProcessingNodeInstance(toCheck: any): boolean {
    if ((toCheck as IProcessingNode).process) {
        return true;
    }
    return false;
}

export async function passResource(resource: IGenericResource, ...args: any[]): Promise<IGenericResource> {
    return resource;
}

//Initialize only the current node --> not the full subtree
export function initShallowConfigNode(
    nodeConfig: IProcessingNodeConfig,
    parentNode: FalsyAble<IProcessingNode>
): IProcessingNode {

    //const parentNodeIdPrefix: string = parentNode?.id + "." || '';
    const processingNodeInstance: Partial<IProcessingNode> = {
        id: nodeConfig.id,
        parent: parentNode as IProcessingNode | undefined,
        preProcess: nodeConfig.preProcess,
        postProcess: nodeConfig.postProcess,
        processors: [],
        srcDirs: nodeConfig.srcDirs,
    };

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
    }

    if (nodeConfig.canProcess) {
        processingNodeInstance.canProcess = nodeConfig.canProcess;
    }
    else {
        const canNodeProcessFn: CanProcessEvaluator = (
            resource: IGenericResource,
            config: any,
        ) => canNodeProcess(
            processingNodeInstance as IProcessingNode,
            resource,
            config,
            nodeConfig.inputGuard
        );

        processingNodeInstance.canProcess = canNodeProcessFn;
    }

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

export async function initConfChildProcessors(
    childProcessingNodeConfigs: FalsyAble<Array<IProcessingNodeConfig | IProcessingNode>>,
    parentNode?: FalsyAble<IProcessingNode>
): Promise<IProcessingNode[]> {

    if (!childProcessingNodeConfigs) {
        return [];
    }
    const initializedChildProcessors: IProcessingNode[] = [];
    for (const childProcessingNodeConfig of childProcessingNodeConfigs) {
        const childProcessingNode: IProcessingNode = await initProcessingTreeFromConf(childProcessingNodeConfig, parentNode);
        initializedChildProcessors.push(childProcessingNode);
    }
    return initializedChildProcessors;
}

export async function loadFileProcessor(
    fileId: string,
    fileSearchConfig: FileSearchOptions
): Promise<IProcessingNode> {

    if (!fileSearchConfig.dirs) {
        throw new Error('No directories to search in, for processors to be loaded from by their file names/ids');
    }
    if (!fileSearchConfig.postfix) {
        fileSearchConfig.postfix = '';
    }

    const searchDirPaths: string[] = fileSearchConfig.dirs;
    const searchFilePostfix: string = fileSearchConfig.postfix;

    const fileNameToLoad = fileId + searchFilePostfix + ".ts";
    const processorMatchGlobs = [
        fileNameToLoad,
        '**/' + fileNameToLoad,
        //fileExtToLoad,
        //'*' + fileExtToLoad,
        //'**/' + fileExtToLoad,
        //'**/*' + fileExtToLoad
    ];
    const processorInstances: Array<IProcessingNode> = await loadProcessorArrayFromPaths<IProcessingNode>(searchDirPaths, processorMatchGlobs, '');

    /*if (processorInstances.length > 1) {
        throw new Error(
            `Found more than one processor: '${processorInstances.length}' with processor id ${fileId} in search paths\
            Needs to be unique within the current nodes search paths`);
    }*/

    const lastFoundFileProcessor: IProcessingNode | undefined = processorInstances?.at(-1);

    if (!lastFoundFileProcessor) {
        throw new Error(`Failed loading file/fs resource processor with id '${fileId}' in search paths: ${searchDirPaths} \ 
        using the globs ${processorMatchGlobs}`);
    }

    return lastFoundFileProcessor;
}


export async function fileProcessorIdentityToInstance(
    processorIdentity: IProcessingNode | string | IProcessingNodeConfig,
    fileSearchConfig: FileSearchOptions
): Promise<IProcessingNode> {

    if (isProcessingNodeInstance(processorIdentity)) {
        return processorIdentity as IProcessingNode;
    }
    if (typeof processorIdentity === 'string') {
        const chainProcessorInstance: IProcessingNode = await loadFileProcessor(processorIdentity, fileSearchConfig);
        return chainProcessorInstance;
    }
    if (typeof processorIdentity === 'object') {
        return initProcessingTreeFromConf(processorIdentity, undefined);
    }
    throw new Error(`Unknown file processor identity type: ${typeof processorIdentity}`);
}

export async function initProcessorsFileChain(
    chainProcessorsIdentities: Array<ChainAbleProcessorId>,
    fileSearchConfig: FileSearchOptions
): Promise<IProcessingNode[]> {

    const fileToInstancePromises: Promise<any>[] = chainProcessorsIdentities.map((processorOfChainIdentity: any) => fileProcessorIdentityToInstance(processorOfChainIdentity, fileSearchConfig));
    return Promise.all(fileToInstancePromises);

    //const currentChainProcessors: IProcessingNode[] = [];
    //const chainProcessorsIdentities: Array<string | IProcessingNode> = targetProcessorChainsConfigs[ key ];

    /*for (const processorOfChainIdentity of chainProcessorsIdentities) {
        currentChainProcessors.push(await );
    }
    return currentChainProcessors;*/
}

export async function initFileChildProcessors(
    subProcessorsConfig: SubProcessorsConfig,
    currentNode: IProcessingNode
): Promise<IProcessingNode[]> {

    if (!subProcessorsConfig.fileProcessorChains) {
        return [];
    }

    const subProcessors: IProcessingNode[] = [];
    const fileProcessorChainsConfig: FileChainProcessorConfig = subProcessorsConfig.fileProcessorChains;
    const targetProcessorChainsConfigs: Record<string, ChainAbleProcessorId[]> = fileProcessorChainsConfig.processors;

    const fileSearchConfig: FileSearchOptions = calculateProcessorFileSearchOpts(fileProcessorChainsConfig, currentNode);

    for (const key in targetProcessorChainsConfigs) {

        //const chainParentProcessor: IProcessingNode = {};
        const parentNodeIdPrefix: string = currentNode?.id + "_" || '';
        const chainParentProcessorConfig: IProcessingNodeConfig = {
            id: parentNodeIdPrefix + "chain_" + key,
            inputGuard: {
                matchProp: fileProcessorChainsConfig.matchProp,
                matchCondition: key,
                /*matchCondition: (propValue: string) => {
                    matchCurrentKeyRegex.test(propValue)
                }*/
            },
            strategy: fileProcessorChainsConfig.strategy,
            processors: []
        };

        const chainProcessorsIdentities: ChainAbleProcessorId[] = targetProcessorChainsConfigs[ key ];
        chainParentProcessorConfig.processors = await initProcessorsFileChain(
            chainProcessorsIdentities,
            fileSearchConfig
        );

        const chainProcessorInstance: IProcessingNode = await initProcessingTreeFromConf(chainParentProcessorConfig, currentNode);
        setChildProcessorsParent(chainProcessorInstance);

        subProcessors.push(chainProcessorInstance);
    }
    return subProcessors;
}

export function setChildProcessorsParent(node: IProcessingNode): void {
    if (!node.processors) {
        return;
    }

    for (const child of node.processors) {
        (child as IProcessingNode).parent = node;
    }
}

export async function initChildProcessors(
    targetInitNode: IProcessingNode,
    nodeConfig: IProcessingNodeConfig
): Promise<IProcessingNode> {

    if (nodeConfig.processors && nodeConfig.fileProcessorChains) {
        throw new Error(`Both 'processors' children and 'fileProcessorChains' children are defined in '${nodeConfig.id}' which is not allowed`);
    }

    if (!nodeConfig.processors && !nodeConfig.fileProcessorChains) {
        targetInitNode.processors = [];
        return targetInitNode;
    }

    if (nodeConfig.processors) {
        targetInitNode.processors = await initConfChildProcessors(nodeConfig.processors, targetInitNode);
    }

    if (nodeConfig.fileProcessorChains) {
        targetInitNode.processors = await initFileChildProcessors(nodeConfig, targetInitNode);
    }
    return targetInitNode;
}


export async function initProcessingTreeFromConf(
    nodeConfig: IProcessingNodeConfig,
    parentNode: FalsyAble<IProcessingNode>
): Promise<IProcessingNode> {

    if (isProcessingNodeInstance(nodeConfig)) {
        return nodeConfig as IProcessingNode;
    }

    let initializedProcessingNode: IProcessingNode = initShallowConfigNode(
        nodeConfig,
        parentNode
    );

    if (parentNode) {
        initializedProcessingNode.parent = parentNode;
    }

    initializedProcessingNode = await initChildProcessors(initializedProcessingNode, nodeConfig);
    setChildProcessorsParent(initializedProcessingNode);

    return initializedProcessingNode;
}