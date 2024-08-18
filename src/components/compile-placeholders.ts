
import type { IProcessResource } from "../processors/shared/i-processor-resource";
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { SsgConfig } from "../config/ssg-config";
import type { ProcessFunction, IProcessor } from "../processing-tree/i-processor";
import type { IInternalComponent } from "./base/i-component";
import { calcHash } from "../data-merge/fragement-cache";
import { replaceIdElemsWithHtmls, passThroughFnChain } from "@markus/ts-node-util-mk1";
import { settleValueOrNull } from "@markus/ts-node-util-mk1";
import { removeBaseBlockIndent } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";
import { resolveDataFromParentResource } from "./resolve-component-path-refs";
import { getImportInstance, IImportInstance } from "./resolve-imports";
export interface DeferCompileArgs {
    name?: string,
    placeholder?: string,
    id?: string,
    content?: string,
    attrs?: {
        [ attr: string ]: string;
    };
    compiled?: string;
}

export function hashObjGetHtmlId(obj: Object, nChars?: number): string {
    const objHash: string = calcHash(obj);
    //Filter for simple characters (special chars are not allowed in html id)
    const uniqueHtmlId: string = objHash.replace(/[^a-zA-Z0-9]/g, "");

    if (nChars) {
        return uniqueHtmlId.slice(nChars);
    }

    return uniqueHtmlId;
}

const placeHolderTagPostfix = 'placeholder';
export function getDeferCompileArgs(
    componentName: string,
    componentBody: FalsyAble<string>,
    attrs: FalsyAble<any>,
    config: FalsyAble<SsgConfig>
): DeferCompileArgs {

    //const componentName: string = tag;
    const content: FalsyAble<string> = componentBody;

    const deferCompileArgs: DeferCompileArgs = {
        name: componentName,
        placeholder: '',
        content: content || '',
        attrs: attrs
    };
    const componentArgsId = hashObjGetHtmlId(
        deferCompileArgs,
        config?.placeholderChars
    );
    deferCompileArgs.id = componentArgsId;

    const placeholderTagName: string = `${componentName}-${placeHolderTagPostfix}`;
    const placeholderFullTagHtml = `<${placeholderTagName} id="${deferCompileArgs.id}"/>`;
    deferCompileArgs.placeholder = placeholderFullTagHtml;
    return deferCompileArgs;
}


export function registerCompileArgsInResource(
    deferCompileArgs: DeferCompileArgs,
    resource: IProcessResource,
): void {

    if (!deferCompileArgs) {
        return;
    }

    if (!resource) {
        resource = {};
    }
    if (!resource.control) {
        resource.control = {};
    }
    if (!resource.control?.pendingChildren) {
        resource.control.pendingChildren = [];
    }

    resource.control.pendingChildren.push(deferCompileArgs);
}

export function convertDeferCompileArgsToResource(
    parentResource: IProcessResource,
    pendingArgs: DeferCompileArgs,
    config: SsgConfig
): IProcessResource {

    if (!config.scopeManager) {
        return {};
    }

    let parentForkedResource: IProcessResource = config.scopeManager.forkChildResource(parentResource);
    if (!parentForkedResource.data) {
        parentForkedResource.data = {};
    }
    //As this is a child resource it should not inherit getting written to disk (unless specified through its own properties)
    setKeyInDict(parentForkedResource, 'document.outputFormat', undefined);
    setKeyInDict(parentForkedResource, 'document.target', undefined);

    const placeHolderInfo: any = {
        placeholder: pendingArgs.placeholder,
        componentTag: pendingArgs.name,
        componentId: pendingArgs.id,
    };

    const deferInfoResource: IProcessResource = Object.assign({}, placeHolderInfo);

    Object.assign(deferInfoResource, pendingArgs.attrs);
    parentForkedResource = config.scopeManager.combineResources(parentForkedResource, deferInfoResource);
    Object.assign(parentForkedResource.data, pendingArgs.attrs);

    return resolveDataFromParentResource(parentResource, parentForkedResource, config);

    //return parentForkedResource;

    //componentToCompileResource = resolveDataFromParentResource(resource, componentToCompileResource, config);
    //componentToCompileResource.data.compileAfter = [];

    //componentToCompileResource.data.importCache = resource.importCache;
    /*componentToCompileresource.document = {
        inputFormat: 'html'
    };*/
}

export async function processWithResourceTargetComponent(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    //const componentResource: IProcessResource = await processResource(resource, config, false);
    //const compiledComponentResource: IProcessResource = await processResource(componentResource, config, false);

    if (!resource.componentTag) {
        return resource;
    }
    const componentRefSymbol: string = resource.componentTag;

    const selectedImportedInstance: FalsyAble<IImportInstance> = await getImportInstance(componentRefSymbol, resource, config);
    if (!selectedImportedInstance) {
        return resource;
    }

    resource.content = removeBaseBlockIndent(resource.content);

    const toProcessResourceFunctions: ProcessFunction[] = [];

    if ((selectedImportedInstance as IInternalComponent).data) {
        toProcessResourceFunctions.push((selectedImportedInstance as IInternalComponent).data);
    }
    if ((selectedImportedInstance as IInternalComponent).render) {
        toProcessResourceFunctions.push((selectedImportedInstance as IInternalComponent).render);
    }
    if ((selectedImportedInstance as IProcessor).process) {
        toProcessResourceFunctions.push((selectedImportedInstance as IProcessor).process);
    }

    return passThroughFnChain(
        toProcessResourceFunctions,
        resource,
        selectedImportedInstance,
        config
    );


    //const selectedSubComponent: IInternalComponent = availableComponentsCache[ resource.componentTag ];
    /*const selectedSubComponent: IInternalComponent = availableComponentsCache[ resource.componentTag ];


    if (!selectedSubComponent) {
        return resource;
    }

    //TODO merge data from component
    //selectedSubComponent.data();

    //component should call 'processResource' if necessary
    //its mainly necessary if wanting to render a different syntax -> render njk brackets, render md encoded text to html, detect and render sub components
    //

    let dataExtractedDocument: IProcessResource = await selectedSubComponent.data(resource, config);
    if (!dataExtractedDocument) {
        dataExtractedDocument = {};
    }
    const mergedDataResource: IProcessResource = lodash.merge({}, resource, dataExtractedDocument);

    //const compiledComponentResource: IProcessResource = await selectedSubComponent.render(mergedDataResource, config);

    const renderedResource: IProcessResource = await selectedSubComponent.render(mergedDataResource, config);

    return lodash.merge({}, mergedDataResource, renderedResource);*/
}

export function replacePlaceholdersWithCompiledResources(
    targetResource: IProcessResource,
    componentResources: IProcessResource[],
    config: SsgConfig
): IProcessResource {

    if (!componentResources) {
        return targetResource;
    }

    const placeholderIdReplaceMap: Record<string, string> = {};
    for (let compiledComponentResource of componentResources) {
        if (compiledComponentResource && compiledComponentResource.componentId) {
            placeholderIdReplaceMap[ compiledComponentResource.componentId ] = compiledComponentResource.content;
        }
    }

    const componentReplacedContent: string = replaceIdElemsWithHtmls(targetResource.content, placeholderIdReplaceMap);
    targetResource.content = componentReplacedContent;

    return targetResource;
}

export async function compilePendingChildren(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    //let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);

    if (!resource.control?.pendingChildren || !config.scopeManager) {
        return resource;
    }
    const toProcessSubComponentResources = resource.control.pendingChildren.map(
        (pendingArgs: DeferCompileArgs) => convertDeferCompileArgsToResource(resource, pendingArgs, config)
    );
    const processSubResourcePromises: Promise<IProcessResource>[] = toProcessSubComponentResources.map(
        (componentResource: IProcessResource) => processWithResourceTargetComponent(componentResource, config)
    );
    const compiledComponentResources: Array<any | null> = await settleValueOrNull(processSubResourcePromises);
    return replacePlaceholdersWithCompiledResources(resource, compiledComponentResources, config);
}



/*export async function compileDeferredComponent(args: DeferCompileArgs, data: any, config: SsgConfig): Promise<DeferCompileArgs> {

    //Shallow copy --> note currently there is no seperation between "parent data scope and child data scope"
    //Modifications to data might bleed to siblings or parent document
    const currentScopeData = Object.assign({}, data);
    const dependencies: Record<string, IInternalComponent> = data.importCache;

    if (!args.name) {
        return {};
    }

    const component: IInternalComponent = dependencies[ args.name ];
    if (!component) {
        args.content = '';
        return args;
    }

    const subDocToCompile: IProcessResource = {
        content: args.content,
        data: Object.assign({}, currentScopeData, args.attrs),
    };

    //const dataParseDoc: FalsyAble<IProcessResource> = await component.data(subDocToCompile, config);
    //const dataParseDoc: FalsyAble<IProcessResource> = await config.masterCompileRunner?.extractDataWith('html', subDocToCompile, config);
    const dataExtractedResource: IProcessResource = await config.processor.processFork([ 'extractor' ], subDocToCompile, config);


    //Resolve any html tags that link other components in the result
    //const subsRenderedDoc: FalsyAble<IProcessResource> = await config.masterCompileRunner?.compileWith('html', dataParseDoc, config);
    const subsRenderedDoc: IProcessResource = await config.processor.processFork([ 'compiler' ], dataExtractedResource, config);

    if (!subsRenderedDoc) {
        return args;
    }
    //Render component contents
    const compiledComponentDoc: FalsyAble<IProcessResource> = await component.render(subsRenderedDoc, config);
    //Problem is the component tags will still be in content (if the component wrap this is not good)
    //--> evaluate html before??


    if (!compiledComponentDoc) {
        return args;
    }

    //const compiledComponentDoc: FalsyAble<IProcessResource> = normalizeToDataParsedDoc(renderedDoc);

    args.content = compiledComponentDoc.content;
    return args;
}

export async function failSafeCompileDeferredComponent(args: DeferCompileArgs, data: any, config: SsgConfig): Promise<DeferCompileArgs> {

    try {
        const deferredCompileResult: DeferCompileArgs = await compileDeferredComponent(args, data, config);
        return deferredCompileResult;
    }
    catch (error) {
        console.error(`Error occured which compiling sub component:`);
        console.error(`${args}`);
        console.error(`${error}`);

        return args;
    }

    //args.content = compiledComponentDoc.content;
    //return args;
}

export async function compileDeferred(deferredCompileArgs: DeferCompileArgs[], resource: IProcessResource, config: SsgConfig): Promise<DeferCompileArgs[] | null> {

    if (!deferredCompileArgs) {
        return null;
    }
    if (!resource.control?.importedComponents) {
        return null;
    }

    const parentData: any = resource;

    const deferredCompilePromises: Promise<DeferCompileArgs>[] = deferredCompileArgs.map((args) => {
        const deferCompiledArgs: DeferCompileArgs = args;

        if (resource) {
            removeArrayItem(resource.control?.pendingChildren, deferCompiledArgs);
        }

        return failSafeCompileDeferredComponent(args, parentData, config);
    });

    return Promise.all(deferredCompilePromises);
}


export async function compileDeferredInsertToPlaceholder(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

    if (!resource.control?.pendingChildren) {
        return resource;
    }

    const compiledSubComponents: DeferCompileArgs[] | null = await compileDeferred(resource.control.pendingChildren, resource, config);
    if (!compiledSubComponents) {
        return resource;
    }

    if (!resource.content) {
        resource.content = '';
    }


    for (const deferCompiled of compiledSubComponents) {
        if (!deferCompiled.content) {
            deferCompiled.content = '';
        }

        if (deferCompiled.placeholder) {
            const compiledBody: string | undefined = deferCompiled.content;
            resource.content = resource.content.replace(deferCompiled.placeholder, deferCompiled.compiled);
        }
    }

    return resource;
}*/