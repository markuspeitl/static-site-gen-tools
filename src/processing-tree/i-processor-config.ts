import type { IProcessingNode, ProcessStrategy, INodeOperations } from "./i-processor";

//Init time Configuration
/*export interface InputGuardConfig {
    matchProp: string;
    matchCondition: any | ((resourceProp: any) => boolean);
}

export interface MergeConfig {
    matchProp: string;
    matchCondition: any | ((resourceProp: any) => boolean);
}

export interface FileChainProcessorConfig extends InputGuardConfig {
    //matchProp: string,
    strategy?: ProcessStrategy;
    fileIdPostfix: string,
    processors: Record<string, ChainAbleProcessorId[]>;
}
export interface SubProcessorsConfig {
    srcDirs?: string[];
    strategy?: ProcessStrategy;
    processors?: Array<IProcessingNodeConfig | IProcessingNode>;
    fileProcessorChains?: FileChainProcessorConfig;
}
export interface IProcessingNodeConfig extends IPrePostProcessing, SubProcessorsConfig, Partial<IProcessor> {
    id: string;
    inputGuard?: InputGuardConfig;
}
*/

export type ConfigNodeType = IProcessingNode | IProcessingNodeConfig;
export type ChainAbleProcessorId = string | ConfigNodeType;

export interface InputGuardConfig {
    inputMatchProp?: string;
    inputMatchCondition?: any | ((resourceProp: any) => boolean);
}


export interface IBaseChildrenConfig {
    processors?: Array<ConfigNodeType> | FileProcessorsDef | MatchingProcessorsDef;
    idPath?: string;
}
export interface INodeChildrenProcessorsConfig extends InputGuardConfig, INodeOperations, IBaseChildrenConfig {
    type?: string;
    strategy?: ProcessStrategy;
}

export interface INodeChildrenFilesConfig extends INodeChildrenProcessorsConfig, IBaseChildrenConfig {
    filePostfix?: string;
    fileChainStrategy?: ProcessStrategy;
    fileSrcDirs?: string[];
    currentSearchPaths?: string[];
}

export interface FileProcessorsDef {
    [ matchingValue: string ]: ChainAbleProcessorId[];
}

export interface MatchingProcessorsDef {
    [ matchingValue: string ]: ConfigNodeType;
}

export type INodeChildrenConfig = INodeChildrenProcessorsConfig | INodeChildrenFilesConfig;
export interface IProcessingNodeConfig extends INodeChildrenProcessorsConfig {
    //id: string;
    children?: INodeChildrenConfig;

    //parent?: IProcessingNode;
    //cfgParent?: IProcessingNodeConfig;
    //computedState?: any;
    state?: any;
}