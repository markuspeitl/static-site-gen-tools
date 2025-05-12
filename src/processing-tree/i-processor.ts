import { FalsyAble } from '@markus/ts-node-util-mk1';
import { IProcessingNodeConfig } from './i-processor-config';
export interface IGenericControl {
    parent?: IGenericResource,
    //handledProcIds?: string[];
}
export interface IGenericResource extends DataProps, IGenericControl {
    //control?: IGenericControl;
}
export interface DataProps {
    [ key: string ]: any;
}

export type ProcessFunction = (
    resource: IGenericResource,
    config: any,
    ...args: any[]
) => Promise<FalsyAble<IGenericResource>>;

export type CanProcessFn = (
    resource: IGenericResource,
    config: any,
    ...args: any[]
) => Promise<boolean> | boolean;

export type CanProcessEvaluator = CanProcessFn | boolean;

export type ProcessStrategy = string; // = 'serial' | 'parallel' | 'firstMatch' | 'lastMatch'

export interface IProcessor {
    id?: string;
    process?: ProcessFunction;
    canProcess?: CanProcessEvaluator;
}

export function isProcessor(processor): processor is IProcessor {
    if (processor.process) {
        return true;
    }
    return false;
}

export interface IResourceProcessor extends IProcessor {
    id: string;
    //canHandle: CanHandleFunction;
}

/*export interface IPrePostProcessing {
    postProcess?: (resource: IGenericResource, config: any) => Promise<IGenericResource>;
    preProcess?: (resource: IGenericResource, config: any) => Promise<IGenericResource>;
}*/

export type IResourceTransactionFn = (resource: IGenericResource, config: any) => Promise<IGenericResource> | IGenericResource;
export type IResourceMergeFn = (originalResource: IGenericResource, processedResource: IGenericResource, config: any) => Promise<IGenericResource> | IGenericResource;


export interface INodeOperations extends IProcessor {
    postProcess?: IResourceTransactionFn;
    preProcess?: IResourceTransactionFn;
    merge?: IResourceMergeFn;
}


export type IChildProcessor = IProcessingNode | IProcessor;

export interface IProcessingNode extends IProcessor, INodeOperations {
    parent?: IProcessingNode;
    processors?: Array<IChildProcessor>;
    config?: IProcessingNodeConfig;
    strategy?: string;
    //strategy?: string,
    //Not really needed after init (necessary for file processor init)
    //srcDirs?: string[],
}


/*export interface IProcessorConfigProps {
    //matchProperty?: string;
    matchValue?: any;
    processStrategy?: 'serial' | 'parallel' | 'firstMatch' | 'lastMatch' | 'allMatch';
    srcDir?: string;
    matchProcessorIds?: string;
}*/
