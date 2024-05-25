/*if (loadedModule.default && typeof loadedModule.default === 'function') {
        componentInstance = new PassthroughComponent();
        componentInstance.render = loadedModule.default;
    }
    if (loadedModule.data || loadedModule.render) {
        componentInstance = new PassthroughComponent();
        componentInstance.data = loadedModule.data;
        componentInstance.render = loadedModule.render;
    }

    componentInstance = getFirstInstanceTargetClass(loadedModule, '.+Component.*', [ 'render' ]);
    //const testCompare = new EHtmlComponent();
    let instance: EHtmlComponent = new EHtmlComponent();
    instance.checkThis();
    instance.checkRunnerThis();
    return instance;*/
//}



/*export async function getComponentFromPath(documentPath: string, config?: SsgConfig): Promise<FalsyAble<IInternalComponent>> {
    //Also load other file formats (.md, .njk, .html, based on available readers & extractor/compilers)
    //If no reader exists or if no compiler exists, then the component would not be compileable -> do not load as component

    return new FileComponent(documentPath);

    const internalDocumentComponent: PassthroughComponent = new PassthroughComponent();
    //let dataExtractedContent: string | null = null;
    let dataExtractedResource: DataParsedDocument | null = null;
    internalDocumentComponent.data = async (resource: DataParsedDocument, config: SsgConfig) => {

        const readResource: FalsyAble<DataParsedDocument> = await getFileResource(documentPath, config);
        if (!readResource) {
            return resource;
        }
        resetDocumentSetInputFormat(resource, readResource.data?.document?.inputFormat);
        resource.content = readResource.content;

        dataExtractedResource = await processConfStage('extractor', resource, config);
        //dataExtractedContent = dataExtractedResource.content;

        return dataExtractedResource;
    };
    internalDocumentComponent.render = async (resource: DataParsedDocument, config: SsgConfig) => {
        //resource.data.document.src = componentPath;
        //resource.content = readResource.content;
        const readResource: FalsyAble<DataParsedDocument> = await getFileResource(documentPath, config);
        if (!readResource) {
            return resource;
        }
        //resource.content = dataExtractedContent || readResource.content || resource.content;
        return processConfStage('compiler', resource || dataExtractedResource || readResource, config);

        //return processConfStage('compiler', resource, config);
    };

    return internalDocumentComponent;
}*/