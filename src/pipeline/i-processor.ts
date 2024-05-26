import type { IInternalComponent } from "../components/base-component";
import type { DeferCompileArgs } from "../components/deferred-component-compiling";

export interface IProcessResource {
    id?: string,
    control?: {
        parent?: IProcessResource,
        handledProcIds?: string[];
        pendingChildren?: DeferCompileArgs[];
        importCache?: Record<string, IInternalComponent>;
    };
    content?: any,
    data?: any,
}


export type ProcessFunction = (resource: IProcessResource, config: any) => Promise<IProcessResource>;
export type CanHandleFunction = (resource: IProcessResource, config: any) => Promise<boolean>;
export type ProcessStrategy = 'serial' | 'parallel' | 'firstMatch' | 'lastMatch';

export interface IProcessor {
    id: string;
    process: ProcessFunction;
}

export interface IResourceProcessor extends IProcessor {
    id: string;
    canHandle: CanHandleFunction;
}

/*export interface IProcessorConfigProps {
    //matchProperty?: string;
    matchValue?: any;
    processStrategy?: 'serial' | 'parallel' | 'firstMatch' | 'lastMatch' | 'allMatch';
    srcDir?: string;
    matchProcessorIds?: string;
}*/

export interface IPrePostProcessing {
    postProcess?: (resource: IProcessResource, config: any) => Promise<IProcessResource>;
    preProcess?: (resource: IProcessResource, config: any) => Promise<IProcessResource>;
}

export type ChainAbleProcessorId = string | IProcessingNode | IProcessingNodeConfig;

export interface FileChainProcessorConfig {
    matchProp: string,
    strategy?: ProcessStrategy;
    fileIdPostfix: string,
    processors: Record<string, Array<ChainAbleProcessorId>>;
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
    /*{
        [ processorId: string ]: IProcessingNodeConfig | IProcessingNodeConfig;
    } | {
        [ matchGuard: string ]: string[];
    };*/
}

export interface IProcessingNodeConfig extends IPrePostProcessing, SubProcessorsConfig {
    id: string;
    inputGuard?: InputGuardConfig;
    //children?: SubProcessorsConfig;
}

export interface IProcessingNode extends IResourceProcessor, IPrePostProcessing {
    parent?: IProcessingNode;
    processors?: Array<IProcessingNode | IProcessor>;

    //Not really needed after init (necessary for file processor init)
    srcDirs?: string[],

}