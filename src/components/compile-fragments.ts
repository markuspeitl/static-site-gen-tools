
import type { IProcessResource } from "../processors/shared/i-processor-resource";
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { SsgConfig } from "../config/ssg-config";
import type { ProcessFunction, IProcessor } from "../processing-tree/i-processor";
import type { IInternalComponent } from "./base/i-component";
import { replaceIdElemsWithHtmls, passThroughFnChain, getSimpleCharsHashId } from "@markus/ts-node-util-mk1";
import { settleValueOrNull } from "@markus/ts-node-util-mk1";
import { removeBaseBlockIndent } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";
import { getImportTargetInstance, IImportInstance } from "./resolve-imports";
import { resolveDocPathsFromParent } from "./resolve-resource-paths";
import { defaultForkMergeExcludedKeys } from "../data-merge/scope-manager";

export interface IFragmentCompile {
    name?: string,
    placeholder?: string,
    id?: string,
    content?: string,
    attrs?: {
        [ attr: string ]: string;
    };
    compiled?: string;
}

export function getFragmentResource(
    pendingArgs: IFragmentCompile,
    config: SsgConfig
): IProcessResource {

    let resource: any = {};

    /*if (!config.scopeManager) {
        return {};
    }*/

    //As this is a child resource it should not inherit getting written to disk (unless specified through its own properties)
    setKeyInDict(resource, 'document.outputFormat', undefined);
    setKeyInDict(resource, 'document.target', undefined);

    const placeHolderInfo: IProcessResource = {
        placeholder: pendingArgs.placeholder,
        fragmentTag: pendingArgs.name,
        fragmentId: pendingArgs.id,
        content: pendingArgs.content
    };

    //const deferInfoResource: IProcessResource = Object.assign({}, placeHolderInfo);

    return Object.assign(resource, placeHolderInfo, resource, pendingArgs.attrs);
    //resource = config.scopeManager.combineResources(resource, deferInfoResource);
    //Object.assign(resource, deferInfoResource);

    //return resource;
}

export function getFragmentResourceWith(
    pendingArgs: IFragmentCompile,
    parentResource: IProcessResource,
    config: SsgConfig
): IProcessResource {

    /*if (!config.scopes) {
        return {};
    }*/

    const fragmentResource: IProcessResource = getFragmentResource(pendingArgs, config);
    fragmentResource.id = pendingArgs.id + '__' + pendingArgs.name;

    let parentForkedResource: IProcessResource | null = null;
    if (config.scopes) {
        parentForkedResource = config.scopes.forkFromResource(
            parentResource,
            fragmentResource,
            defaultForkMergeExcludedKeys.concat([ 'control.handledProcIds' ])
        );
    }
    else {
        parentForkedResource = Object.assign({}, parentForkedResource, fragmentResource);
    }

    return resolveDocPathsFromParent(
        parentResource,
        parentForkedResource,
        config
    );
}

export async function compileFragment(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    //const componentResource: IProcessResource = await processResource(resource, config, false);
    //const compiledComponentResource: IProcessResource = await processResource(componentResource, config, false);

    if (!resource.fragmentTag) {
        return resource;
    }
    const componentRefSymbol: string = resource.fragmentTag;

    const selectedImportedInstance: FalsyAble<IImportInstance> = await getImportTargetInstance(componentRefSymbol, resource, config);
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


    //const selectedSubComponent: IInternalComponent = availableComponentsCache[ resource.fragmentTag ];
    /*const selectedSubComponent: IInternalComponent = availableComponentsCache[ resource.fragmentTag ];


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

export function pasteCompiledPlaceholderResources(
    targetResource: IProcessResource,
    compiledPlaceholders: IProcessResource[],
    config: SsgConfig
): IProcessResource {

    if (!compiledPlaceholders) {
        return targetResource;
    }

    const placeholderIdReplaceMap: Record<string, string> = {};
    for (let compiledComponentResource of compiledPlaceholders) {
        if (compiledComponentResource && compiledComponentResource.fragmentId) {
            placeholderIdReplaceMap[ compiledComponentResource.fragmentId ] = compiledComponentResource.content;
        }
    }

    const inflatedTargetContent: string = replaceIdElemsWithHtmls(targetResource.content, placeholderIdReplaceMap);
    targetResource.content = inflatedTargetContent;

    return targetResource;
}

export async function compileFromFragmentArgs(
    parentResource: IProcessResource,
    targetCompileArgs: IFragmentCompile,
    config: SsgConfig
): Promise<IProcessResource> {

    const resourceToCompile: IProcessResource = getFragmentResourceWith(
        targetCompileArgs,
        parentResource,
        config
    );
    return compileFragment(resourceToCompile, config);
}

export async function compilePendingFragmentsOf(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    //let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);

    if (!resource.control?.pendingFragments) {
        return resource;
    }

    const childrenCompilePromises: Promise<IProcessResource>[] = [];
    for (const pendingCompileArgs of resource.control.pendingFragments) {
        const compilePromise = compileFromFragmentArgs(
            resource,
            pendingCompileArgs,
            config
        );
        childrenCompilePromises.push(compilePromise);
    }

    const compiledComponentResources: Array<any | null> = await settleValueOrNull(childrenCompilePromises);

    const inflatedResource: IProcessResource = pasteCompiledPlaceholderResources(
        resource,
        compiledComponentResources,
        config
    );

    return inflatedResource;
}