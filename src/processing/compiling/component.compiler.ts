import lodash from 'lodash';
import type { IInternalComponent } from '../../components/base-component';
import type { SsgConfig } from "../../config";
import { forkResourceScope } from '../../manage-scopes';
import { cheerioReplaceElem } from '../../utils/cheerio-util';
import { removeBaseBlockIndent } from '../../utils/string-util';
import { HtmlCompiler } from './html.compiler';
import { settleValueOrNull } from '../../utils/promise-util';
import type { IProcessingNode, IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { resolveDataFromParentResource } from '../../components/resolve-component-path-refs';
import { getResourceImportsCache } from '../../components/component-imports';
import { DeferCompileArgs } from '../../components/deferred-component-compiling';
import { setKeyInDict } from '../../components/helpers/dict-util';


export function convertDeferCompileArgsToResource(parentResource: IProcessResource, pendingArgs: DeferCompileArgs, config: SsgConfig): IProcessResource {

    if (!config.scopeManager) {
        return {};
    }

    let parentForkedResource: IProcessResource = config.scopeManager.forkChildResource(parentResource);
    if (!parentForkedResource.data) {
        parentForkedResource.data = {};
    }
    //As this is a child resource it should not inherit getting written to disk (unless specified through its own properties)
    setKeyInDict(parentForkedResource, 'data.document.outputFormat', undefined);
    setKeyInDict(parentForkedResource, 'data.document.target', undefined);

    const deferInfoResource: IProcessResource = {
        id: pendingArgs.name + "_" + pendingArgs.id,
        content: pendingArgs.content,
        data: {
            placeholder: pendingArgs.placeholder,
            componentTag: pendingArgs.name,
            componentId: pendingArgs.id,
        }
    };
    Object.assign(deferInfoResource, pendingArgs.attrs);
    parentForkedResource = config.scopeManager.combineResources(parentForkedResource, deferInfoResource);
    Object.assign(parentForkedResource.data, pendingArgs.attrs);

    return resolveDataFromParentResource(parentResource, parentForkedResource, config);

    //return parentForkedResource;

    //componentToCompileResource = resolveDataFromParentResource(resource, componentToCompileResource, config);
    //componentToCompileResource.data.compileAfter = [];

    //componentToCompileResource.data.importCache = resource.data.importCache;
    /*componentToCompileResource.data.document = {
        inputFormat: 'html'
    };*/
}

export async function processWithResourceTargetComponent(resource: IProcessResource, config: SsgConfig, availableComponentsCache: Record<string, IInternalComponent>): Promise<IProcessResource> {
    //const componentResource: IProcessResource = await processResource(resource, config, false);
    //const compiledComponentResource: IProcessResource = await processResource(componentResource, config, false);

    const selectedSubComponent: IInternalComponent = availableComponentsCache[ resource.data?.componentTag ];

    if (!selectedSubComponent) {
        return resource;
    }

    //TODO merge data from component
    //selectedSubComponent.data();

    //component should call 'processResource' if necessary
    //its mainly necessary if wanting to render a different syntax -> render njk brackets, render md encoded text to html, detect and render sub components
    //

    resource.content = removeBaseBlockIndent(resource.content);


    let dataExtractedDocument: IProcessResource = await selectedSubComponent.data(resource, config);
    if (!dataExtractedDocument) {
        dataExtractedDocument = {};
    }
    const mergedDataResource: IProcessResource = lodash.merge({}, resource, dataExtractedDocument);

    //const compiledComponentResource: IProcessResource = await selectedSubComponent.render(mergedDataResource, config);

    const renderedResource: IProcessResource = await selectedSubComponent.render(mergedDataResource, config);

    return lodash.merge({}, mergedDataResource, renderedResource);
}

export function replacePlaceholdersWithCompiledResources(targetResource: IProcessResource, componentResources: IProcessResource[], config: SsgConfig): IProcessResource {

    if (!componentResources) {
        return targetResource;
    }

    for (let compiledComponentResource of componentResources) {
        if (compiledComponentResource) {

            const pendingCompileComponentId: string = compiledComponentResource.data?.componentId;
            //const componentReplacedContent: string = resource.content.replace(compiledComponentResource.data?.placeholder, compiledComponentResource.content);
            const componentReplacedContent: string = cheerioReplaceElem(targetResource.content, pendingCompileComponentId, compiledComponentResource.content);
            targetResource.content = componentReplacedContent;
        }

        //console.log(resource.content);

        //pendingArgs.compiled = `I would be the replaced placeholder: ${pendingArgs.name}`;
        //resource.content = resource.content.replace(pendingArgs.placeholder, pendingArgs.compiled);
        //resource.content = resource.content.replace(pendingArgs.placeholder, componentResource.content);
    }

    return targetResource;
}

export async function compilePendingChildren(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);

    if (!resource.control?.pendingChildren || !config.scopeManager) {
        return resource;
    }
    const toProcessSubComponentResources = resource.control.pendingChildren.map(
        (pendingArgs: DeferCompileArgs) => convertDeferCompileArgsToResource(resource, pendingArgs, config)
    );
    const processSubResourcePromises: Promise<IProcessResource>[] = toProcessSubComponentResources.map(
        (componentResource: IProcessResource) => processWithResourceTargetComponent(componentResource, config, selectedDependencies)
    );
    const compiledComponentResources: Array<any | null> = await settleValueOrNull(processSubResourcePromises);
    return replacePlaceholdersWithCompiledResources(resource, compiledComponentResources, config);
}


export class ComponentCompiler implements IResourceProcessor {
    id: string = 'component.compiler';

    protected htmlCompilerSubject: IProcessingNode = new HtmlCompiler();
    public canHandle = this.htmlCompilerSubject.canHandle;
    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return this.htmlCompilerSubject.canHandle(resource, config);
    }*/

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        resource.content = resourceContent;
        if (!resource.data) {
            return resource;
        }
        console.log(`Compiling ${this.id}: ${resource.data?.document?.src}`);
        return compilePendingChildren(resource, config);

        /*resource = await resolveResourceImports(resource, config);
        let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
        const importScopeSymbols: string[] = Object.keys(selectedDependencies);*/
        //1. Load dependencies/imports and components
        //2. Check if any components are in content
        //const dataResource: IProcessResource = resource;
        //return resource;
        /*resource = await substituteComponentsPlaceholder(resource, config);
        resource = await this.compileRootDocument(resource as IProcessResource, config);
        resource = await compileDeferredInsertToPlaceholder(resource as IProcessResource, config);*/
        //resource = setHtmlOutputFormat(resource);
        //return addHandlerId(resource, 'compiler', this);
    }
}