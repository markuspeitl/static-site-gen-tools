import type { SsgConfig } from "../config";
import type { IProcessResource } from "../pipeline/i-processor";
import type { IInternalComponent } from "./base-component";
import type { FalsyAble } from "./helpers/generic-types";
import { removeArrayItem } from "./helpers/array-util";
import { calcHash } from "../fragement-cache";
import { processTreeStages } from "../processing-tree-wrapper";


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

export function hashObjGetHtmlId(obj: Object): string {
    const objHash: string = calcHash(obj);
    //Filter for simple characters (special chars are not allowed in html id)
    const uniqueHtmlId: string = objHash.replace(/[^a-zA-Z0-9]/g, "");
    return uniqueHtmlId;
}

export function getDeferCompileArgs(componentName: string, componentBody: FalsyAble<string>, attrs: FalsyAble<any>): DeferCompileArgs {
    //const componentName: string = tag;
    const content: FalsyAble<string> = componentBody;

    const deferCompileArgs: DeferCompileArgs = {
        name: componentName,
        placeholder: '',
        content: content || '',
        attrs: attrs
    };
    const componentArgsId = hashObjGetHtmlId(deferCompileArgs);
    deferCompileArgs.id = componentArgsId;
    //resource.data.compileAfter.push(deferCompileArgs);

    const placeholderName: string = `${componentName}-placeholder`;
    const placeholderFull = `<${placeholderName} id="${deferCompileArgs.id}"/>`;
    deferCompileArgs.placeholder = placeholderFull;
    return deferCompileArgs;
}


export function registerCompileArgsResource(resource: IProcessResource, componentName: string, componentBody: FalsyAble<string>, attrs: FalsyAble<any>): DeferCompileArgs {
    if (!resource.data) {
        resource.data = {};
    }
    if (!resource.data.compileAfter) {
        resource.data.compileAfter = [];
    }

    const deferCompileArgs: DeferCompileArgs = getDeferCompileArgs(componentName, componentBody, attrs);
    resource.data.compileAfter.push(deferCompileArgs);
    return deferCompileArgs;
}


export async function compileDeferredComponent(args: DeferCompileArgs, data: any, config: SsgConfig): Promise<DeferCompileArgs> {

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
    const dataExtractedResource: IProcessResource = await processTreeStages([ 'extractor' ], subDocToCompile, config);


    //Resolve any html tags that link other components in the result
    //const subsRenderedDoc: FalsyAble<IProcessResource> = await config.masterCompileRunner?.compileWith('html', dataParseDoc, config);
    const subsRenderedDoc: IProcessResource = await processTreeStages([ 'compiler' ], dataExtractedResource, config);

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

    const parentData: any = resource.data;
    if (!parentData.importCache || !deferredCompileArgs) {
        return null;
    }



    const deferredCompilePromises: Promise<DeferCompileArgs>[] = deferredCompileArgs.map((args) => {
        const deferCompiledArgs: DeferCompileArgs = args;

        if (resource.data) {
            resource.data.compileAfter = removeArrayItem(resource?.data?.compileAfter, deferCompiledArgs);
        }

        return failSafeCompileDeferredComponent(args, parentData, config);
    });

    return Promise.all(deferredCompilePromises);
}


export async function compileDeferredInsertToPlaceholder(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    const compiledSubComponents: DeferCompileArgs[] | null = await compileDeferred(resource?.data?.compileAfter, resource, config);
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
}