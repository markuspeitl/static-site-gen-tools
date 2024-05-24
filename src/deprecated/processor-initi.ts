
export async function initializeShortHandSerialProcessor(parentProcessor: IProcessingNode | undefined, matchKey: FalsyAble<string>, processingChain: string[] | IResourceProcessor[]): Promise<IProcessingNode> {
    if (!parentProcessor) {
        throw new Error('Error can only initialize shorthand processors when a valid parent was passed.');
    }

    const parentProcId: string = parentProcessor.id;

    const newSerialProcessorInstance: IProcessingNode = new ControlProcessingNode();
    newSerialProcessorInstance.processStrategy = 'serial';
    //newSerialProcessorInstance.id = `${parentProcessor.id}-child-serial`;

    newSerialProcessorInstance.parent = parentProcessor;

    //Should enter in any case
    //newSerialProcessorInstance.matchProperty = undefined;
    newSerialProcessorInstance.matchProperty = parentProcessor.matchProperty;
    if (matchKey) {
        newSerialProcessorInstance.matchValue = matchKey;
    }
    newSerialProcessorInstance.id = `${newSerialProcessorInstance.matchValue}-chain`;

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

export async function initializeFileChildProcessingNodes(filesConfig: FileChainProcessorConfig): Promise<IProcessingNode[]> {

    const procChainsDict: Record<string, Array<string | IProcessingNode>> = filesConfig.processors;
    const intializedProcNodes: IProcessingNode[] = [];
    for (const key in procChainsDict) {
        const selectedProcNodeConf: string[] | IProcessingNode = procChainsDict[ key ];

        if (!isProcessingNodeInstance(selectedProcNodeConf)) {

            const matchCurrentKeyRegex: RegExp = new RegExp(key);

            const processorInstances: Array<IProcessingNode> = await loadProcessorArrayFromPaths<IProcessingNode>([ idProcessorSrcDir ], processorMatchGlobs, '.' + parentProcId);

            const config: IProcessingNodeConfig = {
                'id': key,
                inputGuard: {
                    matchProp: filesConfig.matchProp,
                    matchCondition: key,
                    /*matchCondition: (propValue: string) => {
                        matchCurrentKeyRegex.test(propValue)
                    }*/
                },
                children: {
                    strategy: filesConfig.strategy,
                    processors: [

                    ]
                }
            };
        }

        const currentProcChain: string[] = 
    }

}


export class ControlProcessingNode<ConfigType> implements IProcessingNode, IResourceProcessor {

    id: string = '';
    processors: Array<IProcessingNode> = [];
    parent?: IProcessingNode = undefined;
    matchProp?: string;
    matchCondition?: any | ((resourceProp: any) => boolean);
    processStrategy?: "serial" | "parallel" | "firstMatch" | "lastMatch" | "allMatch" | undefined;
    postProcess?: ((resource: IProcessResource, config: ConfigType) => Promise<IProcessResource>) | undefined;
    preProcess?: ((resource: IProcessResource, config: ConfigType) => Promise<IProcessResource>) | undefined;

    //constructor (treeConfig: IProcessingNodeConfig) { }

    //Right now evals all of this at runtime (can be eventually moved to initialization, to make it better optimizable (JIT))
    public async canHandle(resource: IProcessResource, config: ConfigType): Promise<boolean> {

        console.log(`Check can handle resource with '${this.id}': ${resource.id}`);

        const previousHandlers: string[] | undefined = resource.control?.handledProcIds;
        if (previousHandlers && previousHandlers.includes(this.id)) {
            return false;
        }

        if (!this.matchProp) {
            return true;
        }

        if (this.matchProp.startsWith('.')) {
            this.matchProp = this.matchProp.slice(1);
        }

        const unpackedResourceVal = getKeyFromDict(resource, this.matchProp);

        if (unpackedResourceVal && !this.matchCondition) {
            return true;
        }
        if (this.matchCondition === unpackedResourceVal) {
            return true;
        }
        if (typeof this.matchCondition === 'string') {
            const matchRegex = new RegExp(this.matchCondition);
            return matchRegex.test(this.matchProp);
        }
        if (typeof this.matchCondition === 'function') {
            return this.matchCondition(this.matchProp);
        }

        return false;
    }

    protected async processInternal(resource: IProcessResource, config: ConfigType): Promise<IProcessResource> {
        if (!this.processors) {
            return resource;
        }

        /*const subProcessorsDict: SubProcessorsDict = this.processors;

        const subProcessorIds: string[] = Object.keys(subProcessorsDict);

        if (subProcessorIds.length <= 0) {
            return resource;
        }

        const subProcessors: IProcessingNode[] = subProcessorIds.map((id) => subProcessorsDict[ id ]);*/

        const subProcessors: IProcessingNode[] = this.processors;

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


export async function initProcessorInstanceFromConf(nodeConfig: IProcessingNodeConfig, nodeKey: FalsyAble<string>, parentNode: FalsyAble<IProcessingNode>): Promise<IProcessingNode> {
    if (isProcessingNodeInstance(nodeConfig)) {
        return nodeConfig as IProcessingNode;
    }

    const controlTreeNode: IProcessingNode = convertCurrentShallowConfigToNode(nodeConfig, parentNode);

    if (parentNode) {
        controlTreeNode.parent = parentNode;
    }

    return initChildProcessors(controlTreeNode, nodeConfig);


    //controlTreeNode.matchCondition = nodeConfig.inputGuard?.matchCondition;
    //(controlTreeNode as IProcessingNodeConfig).guard = undefined;
    //const currentProcessor: IProcessNodeConfigFork = nodeConfig.processors[ key ];
    //controlTreeNode.processors[ key ] = await initializeProcessingNode(processorConfig, key, controlTreeNode);

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

    /*for (const key in nodeConfig.processors) {
        const currentProcessor: IProcessNodeConfigFork = nodeConfig.processors[ key ];
        controlTreeNode.processors[ key ] = await initializeProcessingNode(currentProcessor, key, controlTreeNode);
    }

    if (!controlTreeNode.id) {
        controlTreeNode.id = nodeKey as any;
    }*/

    //return controlTreeNode;
}

/*export async function initializeProcessingNode(nodeConfig: IProcessNodeConfigFork, nodeKey: FalsyAble<string>, parentNode: IProcessingNode | undefined): Promise<IProcessingNode> {
    if (isProcessingNodeInstance(nodeConfig)) {
        return nodeConfig as IProcessingNode;
    }
    if (Array.isArray(nodeConfig)) {
        return initializeShortHandSerialProcessor(parentNode, nodeKey, nodeConfig);
    }

    return processNodeInstanceFromConf(nodeConfig as IProcessingNodeConfig, nodeKey, parentNode);
}*/