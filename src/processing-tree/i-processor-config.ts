import type { IProcessingNode, ProcessStrategy, IPrePostProcessing, IProcessor } from "./i-processor";

export type ChainAbleProcessorId = string | IProcessingNode | IProcessingNodeConfig;

//Init time Configuration
export interface FileChainProcessorConfig {
    matchProp: string,
    strategy?: ProcessStrategy;
    fileIdPostfix: string,
    processors: Record<string, ChainAbleProcessorId[]>;
}
export interface InputGuardConfig {
    matchProp: string;
    matchCondition: any | ((resourceProp: any) => boolean);
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