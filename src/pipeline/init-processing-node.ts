import { collectInSelfAndParents } from "@markus/ts-node-util-mk1";
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { IProcessingNode, IProcessingNodeConfig, FileChainProcessorConfig, IProcessResource, ProcessFunction, CanHandleFunction, SubProcessorsConfig, ChainAbleProcessorId } from "./i-processor";
import path from "path";
import { loadProcessorArrayFromPaths } from "../load-glob-modules";
import { compileSingleRunCanHandleFn, processWithStrategyFn } from "./processing-strategy-fns";

export function isProcessingNodeInstance(toCheck: any): boolean {
    if ((toCheck as IProcessingNode).process) {
        return true;
    }
    return false;
}

export function convertCurrentShallowConfigToNode(nodeConfig: IProcessingNodeConfig, parentNode: FalsyAble<IProcessingNode>): IProcessingNode {

    let processingFn: ProcessFunction | undefined = processWithStrategyFn(nodeConfig.strategy);
    if (!processingFn) {
        processingFn = async (resource: IProcessResource) => resource;
    }
    let canHandleFn: CanHandleFunction | undefined = compileSingleRunCanHandleFn(nodeConfig.inputGuard);
    if (!canHandleFn) {
        canHandleFn = async (resource: IProcessResource) => true;
    }

    //const parentNodeIdPrefix: string = parentNode?.id + "." || '';
    const processingNodeInstance: IProcessingNode = {
        id: nodeConfig.id,
        parent: parentNode as IProcessingNode | undefined,
        canHandle: canHandleFn,
        process: processingFn,
        preProcess: nodeConfig.preProcess,
        postProcess: nodeConfig.postProcess,
        processors: [],
        srcDirs: nodeConfig.srcDirs,
    };
    //Object.assign(processingNodeInstance, nodeConfig.inputGuard);

    /*const controlTreeNode: ControlProcessingNode<any> = new ControlProcessingNode();
    controlTreeNode.id = nodeConfig.id;
    Object.assign(controlTreeNode, nodeConfig.inputGuard);
    controlTreeNode.processStrategy = nodeConfig.strategy;
    controlTreeNode.preProcess = nodeConfig.preProcess;
    controlTreeNode.postProcess = nodeConfig.postProcess;
    controlTreeNode.processors = [];*/

    return processingNodeInstance;
}

export async function initConfChildProcessors(childProcessingNodeConfigs: FalsyAble<Array<IProcessingNodeConfig | IProcessingNode>>, parentNode?: FalsyAble<IProcessingNode>): Promise<IProcessingNode[]> {
    if (!childProcessingNodeConfigs) {
        return [];
    }
    const initializedChildProcessors: IProcessingNode[] = [];
    for (const childProcessingNodeConfig of childProcessingNodeConfigs) {
        const childProcessingNode: IProcessingNode = await initProcessorInstanceFromConf(childProcessingNodeConfig, parentNode);
        initializedChildProcessors.push(childProcessingNode);
    }
    return initializedChildProcessors;
}

export async function loadFileProcessor(fileId: string, fileSearchConfig: FileSearchOptions): Promise<IProcessingNode> {
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


export async function fileProcessorIdentityToInstance(processorIdentity: IProcessingNode | string | IProcessingNodeConfig, fileSearchConfig: FileSearchOptions): Promise<IProcessingNode> {
    if (isProcessingNodeInstance(processorIdentity)) {
        return processorIdentity as IProcessingNode;
    }
    if (typeof processorIdentity === 'string') {
        const chainProcessorInstance: IProcessingNode = await loadFileProcessor(processorIdentity, fileSearchConfig);
        return chainProcessorInstance;
    }
    if (typeof processorIdentity === 'object') {
        return initProcessorInstanceFromConf(processorIdentity, undefined);
    }
    throw new Error(`Unknown file processor identity type: ${typeof processorIdentity}`);
}

export interface FileSearchOptions {
    dirs?: string[],
    postfix?: string;
}

export async function initProcessorsFileChain(chainProcessorsIdentities: Array<ChainAbleProcessorId>, fileSearchConfig: FileSearchOptions): Promise<IProcessingNode[]> {
    const fileToInstancePromises: Promise<any>[] = chainProcessorsIdentities.map((processorOfChainIdentity: any) => fileProcessorIdentityToInstance(processorOfChainIdentity, fileSearchConfig));
    return Promise.all(fileToInstancePromises);

    //const currentChainProcessors: IProcessingNode[] = [];
    //const chainProcessorsIdentities: Array<string | IProcessingNode> = targetProcessorChainsConfigs[ key ];

    /*for (const processorOfChainIdentity of chainProcessorsIdentities) {
        currentChainProcessors.push(await );
    }
    return currentChainProcessors;*/
}

//Each array item in the input array represents the values of a nesting level
//Similar to creating any binary permutation of values 0000 - 1111  => 2^4 = 16 possible result vectors: 0000, 0001, 0010, 0011, 0100, 0101, 0110, 0111, 1000 ....
//,but extended to the general case and working with item entities rather than incrementable numbers
//this example could be represented by: [[0,1],[0,1],[0,1],[0,1]] in the following algorithm
//And should result in such array: [[0,0,0,0], [0,0,0,1], [0,0,1,0] ...]
export function getLeveledPermutations<ItemType>(nestLeveledArray: ItemType[][]): ItemType[][] {

    const cursorLevelArray = nestLeveledArray.at(0);
    if (!cursorLevelArray) {
        return [];
    }

    const followingLevels: ItemType[][] = nestLeveledArray.slice(1);
    const followingPermutations: ItemType[][] = getLeveledPermutations(followingLevels);

    const resultPermutationVectors: ItemType[][] = [];

    for (const item of cursorLevelArray) {

        if (!followingPermutations || followingPermutations.length <= 0) {
            resultPermutationVectors.push([ item ]);
        }
        else {
            for (const followingPermutation of followingPermutations) {
                const currentPermutationVector: ItemType[] = [ item ].concat(followingPermutation);
                resultPermutationVectors.push(currentPermutationVector);
            }
        }
    }
    return resultPermutationVectors;
}

export function collectParentPermutations<PropItemType>(parentAble: { parent?: any; }, key: string): PropItemType[][] {

    const collectedLeveledItemVectors: PropItemType[][] = collectInSelfAndParents<PropItemType[]>(parentAble, key);
    const permutedVectors: PropItemType[][] = getLeveledPermutations(collectedLeveledItemVectors);
    return permutedVectors;
}
export function collectNestedPathPermutations(parentAble: { parent?: any; }, pathArrayKey: string): string[] {
    const dirPermutationArrays: string[][] = collectParentPermutations(parentAble, pathArrayKey);
    const permutedJoinedPathOptions: string[] = dirPermutationArrays.map((pathParts: string[]) => path.resolve(path.join(...pathParts)));
    return permutedJoinedPathOptions;
}

export function calculateProcessorFileSearchOpts(fileProcessorChainsConfig: FileChainProcessorConfig, currentNode: IProcessingNode): FileSearchOptions {
    const fileSearchConfig: FileSearchOptions = {
        postfix: fileProcessorChainsConfig.fileIdPostfix
    };

    //TODO: filter absolute paths and add to search options
    /*if (currentNode?.srcDirs) {
        for (const dir of currentNode?.srcDirs) {
        }
    }*/

    //Wrong place to recompute this each time, if many deeply nested paths are to be expected
    const selectedTargetDirs: string[] = collectNestedPathPermutations(currentNode, 'srcDirs');
    fileSearchConfig.dirs = selectedTargetDirs;

    return fileSearchConfig;
}

export async function initFileChildProcessors(subProcessorsConfig: SubProcessorsConfig, currentNode: IProcessingNode): Promise<IProcessingNode[]> {
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
        chainParentProcessorConfig.processors = await initProcessorsFileChain(chainProcessorsIdentities, fileSearchConfig);

        const chainProcessorInstance: IProcessingNode = await initProcessorInstanceFromConf(chainParentProcessorConfig, currentNode);
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

export async function initChildProcessors(targetInitNode: IProcessingNode, nodeConfig: IProcessingNodeConfig): Promise<IProcessingNode> {
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


export async function initProcessorInstanceFromConf(nodeConfig: IProcessingNodeConfig, parentNode: FalsyAble<IProcessingNode>): Promise<IProcessingNode> {
    if (isProcessingNodeInstance(nodeConfig)) {
        return nodeConfig as IProcessingNode;
    }

    let initializedProcessingNode: IProcessingNode = convertCurrentShallowConfigToNode(nodeConfig, parentNode);

    if (parentNode) {
        initializedProcessingNode.parent = parentNode;
    }

    initializedProcessingNode = await initChildProcessors(initializedProcessingNode, nodeConfig);
    setChildProcessorsParent(initializedProcessingNode);

    return initializedProcessingNode;
}