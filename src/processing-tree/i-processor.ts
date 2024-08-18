export interface IGenericControl {
    parent?: IGenericResource,
    handledProcIds?: string[];
}
export interface IGenericResource extends DataProps {
    control?: IGenericControl;
}
export interface DataProps {
    [ key: string ]: any;
}

export type ProcessFunction = (
    resource: IGenericResource,
    config: any,
    ...args: any[]
) => Promise<IGenericResource>;

export type CanProcessFn = (
    resource: IGenericResource,
    config: any,
    ...args: any[]
) => Promise<boolean> | boolean;

export type CanProcessEvaluator = CanProcessFn | boolean;

export type ProcessStrategy = string; // = 'serial' | 'parallel' | 'firstMatch' | 'lastMatch'

export interface IProcessor {
    id: string;
    process: ProcessFunction;
    canProcess?: CanProcessEvaluator;
}

export interface IResourceProcessor extends IProcessor {
    id: string;
    //canHandle: CanHandleFunction;
}

export interface IPrePostProcessing {
    postProcess?: (resource: IGenericResource, config: any) => Promise<IGenericResource>;
    preProcess?: (resource: IGenericResource, config: any) => Promise<IGenericResource>;
}


export interface IProcessingNode extends IProcessor, IPrePostProcessing {
    parent?: IProcessingNode;
    processors?: Array<IProcessingNode | IProcessor>;

    //Not really needed after init (necessary for file processor init)
    srcDirs?: string[],
}


/*export interface IProcessorConfigProps {
    //matchProperty?: string;
    matchValue?: any;
    processStrategy?: 'serial' | 'parallel' | 'firstMatch' | 'lastMatch' | 'allMatch';
    srcDir?: string;
    matchProcessorIds?: string;
}*/
