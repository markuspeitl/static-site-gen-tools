import { arrayifyFilter, filterFalsy, isEmpty, settleValueOrNull, settleValueOrNullFilter, walkYieldFiles, type FalsyAble } from "@markus/ts-node-util-mk1";
import type { IProcessingNode, ProcessFunction, CanProcessEvaluator, IGenericResource, IChildProcessor } from "./i-processor";
import type { IProcessingNodeConfig, ChainAbleProcessorId, InputGuardConfig, INodeChildrenConfig, INodeChildrenFilesConfig, FileProcessorsDef } from "./i-processor-config";
import { loadProcessorArrayFromPaths, loadProcessorFromPath } from "./load-file-processors";
import { getResourceInputGuardFn, processNode } from "./processing-strategy-fns";
import { FileSearchOptions } from "./discover-processors";
import { initProcessingTreeFromConf, isProcessingNodeInstance } from "./init-processing-node";


export const dirFilesCache = {};

export async function findProcessorPathIn(
    processorId: string,
    dirPaths?: string[],
    postFix: string = ''
): Promise<string> {

    if (!dirPaths) {
        //return null;
        throw new Error(`Failed finding processor with id: ${processorId} with postFix: ${postFix} in paths: ${dirPaths}`);
    }
    const reversedDirsOrder: string[] = [ ...dirPaths ];
    reversedDirsOrder.reverse();

    for (const dirPath of reversedDirsOrder) {

        let dirFilePaths: string[] = dirFilesCache[ dirPath ];
        if (!dirFilePaths) {

            dirFilePaths = [];
            for await (const filePath of walkYieldFiles(dirPath)) {
                dirFilePaths.push(filePath);
            }
            dirFilesCache[ dirPath ] = dirFilePaths;
        }

        for (const filePath of dirFilePaths) {
            const fileNameWithPostfix: string = processorId + postFix + ".ts";
            if (filePath.endsWith(fileNameWithPostfix)) {
                return filePath;
            }
        }
    }

    throw new Error(`Failed finding processor with id: ${processorId} with postFix: ${postFix} in paths: ${dirPaths}`);
    //return null;
}

export const diskModulesCache: any = {};

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

    const processorPath: string = await findProcessorPathIn(fileId, fileSearchConfig.dirs, fileSearchConfig.postfix);

    const fileLoadedProcessingNode: IProcessingNode = await loadProcessorFromPath(
        processorPath,
        diskModulesCache,
        ''
    );

    return fileLoadedProcessingNode;


    /*const searchDirPaths: string[] = fileSearchConfig.dirs;
    const searchFilePostfix: string = fileSearchConfig.postfix;

    const fileNameToLoad = fileId + searchFilePostfix + ".ts";
    const processorMatchGlobs = [
        fileNameToLoad,
        '/' + fileNameToLoad,
    ];
    const processorInstances: Array<IProcessingNode> = await loadProcessorArrayFromPaths<IProcessingNode>(searchDirPaths, processorMatchGlobs, '');

    if (processorInstances.length > 1) {
        throw new Error(
            `Found more than one processor: '${processorInstances.length}' with processor id ${fileId} in search paths\
            Needs to be unique within the current nodes search paths`);
    }

    const lastFoundFileProcessor: IProcessingNode | undefined = processorInstances?.at(-1);

    if (!lastFoundFileProcessor) {
        throw new Error(`Failed loading file/fs resource processor with id '${fileId}' in search paths: ${searchDirPaths} \ 
        using the globs ${processorMatchGlobs}`);
    }

    return lastFoundFileProcessor;*/
}


export async function fileProcessorIdentityToInstance(
    processorIdentity: IProcessingNode | string | IProcessingNodeConfig,
    fileSearchConfig: FileSearchOptions
): Promise<IProcessingNode> {

    if (isProcessingNodeInstance(processorIdentity)) {
        return processorIdentity as IProcessingNode;
    }
    if (typeof processorIdentity === 'string') {
        const chainProcessorInstance: IProcessingNode = await loadFileProcessor(
            processorIdentity,
            fileSearchConfig
        );

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


    const fileToInstancePromises: Promise<any>[] = [];
    for (const processorChainIdentity of chainProcessorsIdentities) {
        const initializeFileProcessorPromise: Promise<any> = fileProcessorIdentityToInstance(
            processorChainIdentity,
            fileSearchConfig,
        );
        fileToInstancePromises.push(initializeFileProcessorPromise);
    }

    return Promise.all(fileToInstancePromises);
    //const currentChainProcessors: IProcessingNode[] = [];
    //const chainProcessorsIdentities: Array<string | IProcessingNode> = targetProcessorChainsConfigs[ key ];

    /*for (const processorOfChainIdentity of chainProcessorsIdentities) {
        currentChainProcessors.push(await );
    }
    return currentChainProcessors;*/
}

export async function initProcessorsFileChainNode(
    inputValueKey: string,
    fileChainConfig: ChainAbleProcessorId[],
    parentNodeConfig: INodeChildrenFilesConfig,
): Promise<IProcessingNode> {

    //const chainParentProcessor: IProcessingNode = {};
    //const parentNodeIdPrefix: string = /*parent_node_config?.id +*/ "_";
    const parentNodeIdPrefix: string = parentNodeConfig.idPath || '';
    const chainParentProcessorConfig: IProcessingNodeConfig = {
        id: parentNodeIdPrefix + '.' + inputValueKey + "_chain",
        inputMatchProp: parentNodeConfig.inputMatchProp,
        inputMatchCondition: inputValueKey,
        strategy: parentNodeConfig.fileChainStrategy,
        processors: []
    };

    const fileProcessorsChain: ChainAbleProcessorId[] = arrayifyFilter(fileChainConfig);

    const fileSearchConfig: FileSearchOptions = {
        postfix: parentNodeConfig.filePostfix,
        dirs: parentNodeConfig.currentSearchPaths
    };

    const chainProcessorInstance: IProcessingNode = await initProcessingTreeFromConf(
        chainParentProcessorConfig,
        parentNodeConfig
        //currentNode
    );

    chainProcessorInstance.processors = await initProcessorsFileChain(
        fileProcessorsChain,
        fileSearchConfig
    );

    return chainProcessorInstance;
}

export async function initFileChildProcessors(
    nodeChildrenConfig: INodeChildrenFilesConfig,
    parentConfig: FalsyAble<IProcessingNodeConfig>,
    /*fileProcessorsConfigDict: FileProcessorsDef,
    nodeChildrenConfig: INodeChildrenFilesConfig,
    parentNodeConfig: INodeChildrenFilesConfig,
    collectedNodeState: any = {}*/
    //currentNode: IProcessingNode
): Promise<IProcessingNode[] | undefined> {

    if (nodeChildrenConfig.type !== 'file') {
        throw new Error(`Invalid 'nodeChildrenConfig' type for initializing file processors -> expected type to be 'file', but was ${nodeChildrenConfig.type}`);
    }

    const fileProcessorsConfigDict: FileProcessorsDef = nodeChildrenConfig.processors as FileProcessorsDef;

    if (!fileProcessorsConfigDict || isEmpty(fileProcessorsConfigDict)) {
        return undefined;
    }

    const initNodeSubProcessorPromises: Promise<IProcessingNode>[] = [];
    for (const key in fileProcessorsConfigDict) {

        const initNodeSubProcessorPromise: Promise<IProcessingNode> = initProcessorsFileChainNode(
            key,
            fileProcessorsConfigDict[ key ],
            nodeChildrenConfig
        );

        initNodeSubProcessorPromises.push(initNodeSubProcessorPromise);
    }

    //return settleValueOrNullFilter(initNodeSubProcessorPromises);
    return Promise.all(initNodeSubProcessorPromises);
}