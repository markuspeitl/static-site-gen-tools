import path from "path";
import { FalsyAble } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { FileRunner } from "./file.runner";
import { DataParsedDocument } from "./runners";
import { resolvePrimitiveLeaves } from "../utils/walk-recurse";
import { arrayify, isEmpty, removeArrayItem } from "../components/helpers/array-util";
import { getResourceImports } from "../components/components";
import { IInternalComponent } from "../components/base-component";
import { loadHtml, orSelector, replaceSelectedAsync, unparseHtml } from "../utils/cheerio-util";
import { calcHash } from "../fragement-cache";
import * as cheerio from 'cheerio';

/*export abstract class ResolveDataImportsRunner extends FileRunner {
    abstract extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
    abstract compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}*/

export type IDocumentDataParser = (resource: DataParsedDocument, config: SsgConfig) => Promise<FalsyAble<DataParsedDocument>>;

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

export function normalizeToDataParsedDoc(renderOutPut: string | DataParsedDocument, inputResource?: DataParsedDocument): DataParsedDocument {

    if (typeof renderOutPut === 'string') {
        return {
            content: renderOutPut,
            data: inputResource?.data
        };
    }
    return renderOutPut;
}


export function isDirPath(value: any): boolean {
    return isPath(value) && value.endsWith('/');
}

export function isPath(value: any): boolean {
    if (typeof value === 'string') {
        const hasSeperator = value.includes(path.sep);
        if (!hasSeperator) {
            return false;
        }
        return true;
    }
    return false;
}

export function isRelativePath(value: any): boolean {

    if (isPath(value) && (value.startsWith('./') || value.startsWith('../'))) {
        return true;
    }
    return false;
}

export function detectResolveRelativePath(relPath: string, rootPath: string): string | undefined {

    if (isRelativePath(relPath)) {
        const joinedPath = path.join(rootPath, relPath);
        return path.resolve(joinedPath);
    }
    return undefined;

}

export function resolveRelativePaths(dict: any, rootPath: string): any {
    return resolvePrimitiveLeaves(dict, (value) => detectResolveRelativePath(value, rootPath));
}

export function resolveImportPropToPath(importObj: any): string {
    /*if (typeof importObj === 'string') {
        return importObj;
    }*/
    if (typeof importObj === 'object') {
        return importObj.path;
    }
    return importObj;
}

export async function resolveResourceImports(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {

    if (!resource.data) {
        resource.data = {};
    }

    //assignAttribsToSelf(dataExtractedDoc.data, 'import');
    if (!resource.data.import) {
        resource.data.import = [];
    }
    if (!Array.isArray(resource.data.import)) {
        resource.data.import = arrayify(resource.data.import);
    }
    resource.data.import = resource.data.import.map(resolveImportPropToPath);

    const currentDocumentDir: string = path.parse(resource.data.src).dir;
    resource.data = resolveRelativePaths(resource.data, currentDocumentDir);

    if (!resource.data) {
        return resource;
    }

    resource.data.importCache = await getResourceImports(resource, config);

    return resource;
}

function updateMergeResource(resource: DataParsedDocument, updatedResource: DataParsedDocument): DataParsedDocument {

    if (!resource.data) {
        resource.data = {};
    }
    if (!updatedResource.data) {
        updatedResource.data = {};
    }

    return {
        content: updatedResource.content,
        data: Object.assign(resource.data, updatedResource.data)
    };
}



export function getResourceImportsCache(resource: DataParsedDocument, config: SsgConfig): Record<string, IInternalComponent> {
    let selectedDependencies: Record<string, IInternalComponent> = {};
    if (resource.data?.importCache && !isEmpty(resource.data?.importCache)) {
        selectedDependencies = resource.data?.importCache;
    }
    else {
        selectedDependencies = config.defaultComponentsCache || {};
    }
    return selectedDependencies;
}

export async function extractMergePrepareData(
    resource: DataParsedDocument,
    config: SsgConfig,
    parseDocumentDataFn: IDocumentDataParser,

): Promise<FalsyAble<DataParsedDocument>> {

    const dataExtractedDoc: FalsyAble<DataParsedDocument> = await parseDocumentDataFn(resource, config);
    if (!dataExtractedDoc) {
        return resource;
    }
    const dataMergedDoc: DataParsedDocument = updateMergeResource(resource, dataExtractedDoc);
    return resolveResourceImports(dataMergedDoc, config);
}

export type CheerioNodeFn<ReturnType> = ($: cheerio.Root, element: cheerio.Cheerio) => FalsyAble<ReturnType>;

export function cheerioDfsWalk<ReturnType>($: cheerio.Root, currentCursor: cheerio.Cheerio, handleFork: CheerioNodeFn<ReturnType>, handleLeaf: CheerioNodeFn<ReturnType>): ReturnType[] {

    const currentElement = $(currentCursor);
    let currentChildren: cheerio.Cheerio = currentElement.children();
    if (currentChildren.length <= 0) {
        const leafProcessingResult: FalsyAble<ReturnType> = handleLeaf($, $(currentCursor));
        if (!leafProcessingResult) {
            return [];
        }

        return [ leafProcessingResult ];
    }
    const forkProcessResult: FalsyAble<ReturnType> = handleFork($, currentCursor);

    //NON standard control flow! --> early exit branch if fork was successfully processed
    if (forkProcessResult) {
        return [ forkProcessResult ];
    }

    currentChildren = $(currentCursor).children();

    const flatDescendantResults: ReturnType[] = [];

    if (currentChildren.length > 0) {
        for (const child of currentChildren) {
            const processingResults: ReturnType[] = cheerioDfsWalk($, $(child), handleFork, handleLeaf);

            flatDescendantResults.push(...processingResults);
        }
    }


    return flatDescendantResults;
}

/*export async function findReplaceTopComponents(
    componentTags: string[],
    $: cheerio.Root,
    currentCursor: cheerio.Element,
    replaceFn: (
        tag: string,
        body: string,
        attrs: {
            [ attr: string ]: string;
        }
    ) => string
): Promise<DeferCompileArgs[]> {

    const currentTag = $(currentCursor).prop('tagName').toLowerCase();
    if (componentTags.includes(currentTag)) {

        const placeholder = replaceFn(currentTag, $(currentCursor).html(), $(currentCursor).attrs());
        $(currentTag).replaceWith(placeholder);
        return [ {
            name: currentTag
        } ];
    }

    const currentChildren = $(currentCursor).children;
    if (currentChildren.length <= 0) {
        return [];
    }

    const collectedComponents: DeferCompileArgs[][] = [];

    for (const child of currentChildren) {
        const foundTopComponents: DeferCompileArgs[] = await findReplaceTopComponents(componentTags, $, child, replaceFn);
        collectedComponents.push(foundTopComponents);
    }
    return collectedComponents.flat();
}*/


export async function findReplaceTopLevelDetectedComponents(
    resource: DataParsedDocument,
    config: SsgConfig
): Promise<DataParsedDocument> {

    const $ = loadHtml(resource.content);
    const currentNode = $.root();

    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    const importScopeSymbols: string[] = Object.keys(selectedDependencies);

    const handleNode: CheerioNodeFn<DeferCompileArgs> = ($: cheerio.Root, currentCursor: cheerio.Cheerio) => {

        const tagSel = $(currentCursor).prop('tagName');

        if (!tagSel) {
            return undefined;
        }

        const currentTag = tagSel.toLowerCase();

        if (currentTag && importScopeSymbols.includes(currentTag)) {

            const body = $(currentCursor).html();
            const attrs = $(currentCursor).attr();

            const deferCompileArgs = registerCompileArgsResource(resource, currentTag, body, attrs);

            if (deferCompileArgs && deferCompileArgs.placeholder) {
                $(currentCursor).replaceWith(deferCompileArgs.placeholder);
                $(currentCursor).remove();
            }
            return deferCompileArgs;
        }
        return undefined;
    };

    const detectedComponentsCompileArgs = cheerioDfsWalk<DeferCompileArgs>($, currentNode, handleNode, handleNode);

    resource.content = unparseHtml($);

    //const deferRequestArgs = await findReplaceTopComponents(importScopeSymbols, $, currentNode, deferArgsToPlaceholder);
    //resource.data.compileAfter = detectedComponentsCompileArgs;

    return resource;
}

/*export async function findTopLevelDetectedComponents(
    resource: DataParsedDocument,
    config: SsgConfig
): Promise<DataParsedDocument> {

    const $ = loadHtml(resource.content);
    const currentNode = $.root();

    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    const importScopeSymbols: string[] = Object.keys(selectedDependencies);
    const deferRequestArgs = await findReplaceTopComponents(importScopeSymbols, $, currentNode, deferArgsToPlaceholder);
    resource.data.compileAfter = deferRequestArgs;

    return resource;
}*/

export async function detectReplaceComponents(
    resource: DataParsedDocument,
    config: SsgConfig,
    replaceFn: (
        tag: string,
        body: string,
        attrs: {
            [ attr: string ]: string;
        }
    ) => string): Promise<DataParsedDocument> {

    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    const importScopeSymbols: string[] = Object.keys(selectedDependencies);

    //const toCompileComponentIds: string[] = Object.keys(componentsToCompile);
    const anyComponentSelector = orSelector(importScopeSymbols);

    const replacerFunction = async (tag: string, element: cheerio.Element, $: cheerio.Root) => {
        const componentHtml = $(element).html() || '';
        const componentData = $(element).data() || {};

        const attrDict: { [ attr: string ]: string; } = $(element).attr();

        const componentReplacedHtml = await replaceFn(tag, componentHtml, attrDict);
        return componentReplacedHtml;
    };

    resource.content = await replaceSelectedAsync(resource.content, anyComponentSelector, replacerFunction);
    return resource;
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

export function registerCompileArgsResource(resource: DataParsedDocument, componentName: string, componentBody: FalsyAble<string>, attrs: FalsyAble<any>): DeferCompileArgs {
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


export async function substituteComponentsPlaceholder(
    resource: DataParsedDocument,
    config: SsgConfig,
): Promise<FalsyAble<DataParsedDocument>> {

    //let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    //const importScopeSymbols: string[] = Object.keys(selectedDependencies);
    //Find component entry points (first/top-level components, nodes that are components in the syntax tree)

    //Note: Must do a BFS search to properly work -> otherwise components under a component might be replaced as well
    //(though that should be the component's responsibility that holds this component)
    //resource = await detectReplaceComponents(resource, config, (tag: string, body: string, attrs: any) => registerCompileArgsResource(resource, tag, body, attrs));

    return findReplaceTopLevelDetectedComponents(resource, config);

    //return resource;
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

    const subDocToCompile: DataParsedDocument = {
        content: args.content,
        data: Object.assign({}, currentScopeData, args.attrs),
    };

    //const dataParseDoc: FalsyAble<DataParsedDocument> = await component.data(subDocToCompile, config);
    const dataParseDoc: FalsyAble<DataParsedDocument> = await config.masterCompileRunner?.extractDataWith('html', subDocToCompile, config);


    //Resolve any html tags that link other components in the result
    const subsRenderedDoc: FalsyAble<DataParsedDocument> = await config.masterCompileRunner?.compileWith('html', dataParseDoc, config);
    //Render component contents
    const compiledComponentDoc: FalsyAble<DataParsedDocument> = await component.render(subsRenderedDoc, config);
    //Problem is the component tags will still be in content (if the component wrap this is not good)
    //--> evaluate html before??


    if (!compiledComponentDoc) {
        return args;
    }

    //const compiledComponentDoc: FalsyAble<DataParsedDocument> = normalizeToDataParsedDoc(renderedDoc);

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

export async function compileDeferred(deferredCompileArgs: DeferCompileArgs[], resource: DataParsedDocument, config: SsgConfig): Promise<DeferCompileArgs[] | null> {

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

    /*const settledCompilePromises: PromiseSettledResult<DeferCompileArgs>[] = await Promise.allSettled(deferredCompilePromises);
    return settledCompilePromises.map((settledCompile: PromiseSettledResult<DeferCompileArgs>) => {
        if (settledCompile.status === 'rejected') {
        }

        return settledCompile.value;
    });*/
}

export async function compileDeferredInsertToPlaceholder(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
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



    /*const $ = loadHtml(resource.content);

    for (const deferCompiled of compiledSubComponents) {
        //const placeHolderTagName = deferCompiled.name;
        const componentPlaceholderId: string | undefined = deferCompiled.id;

        if (!deferCompiled.content) {
            deferCompiled.content = '';
        }

        const compiledBody: string | undefined = deferCompiled.content;
        if (componentPlaceholderId) {
            const placeholderElem = $(`#${componentPlaceholderId}`);

            if (placeholderElem) {
                placeholderElem.replaceWith(compiledBody);
            }
        }
    }

    resource.content = unparseHtml($);*/

    return resource;
}

export abstract class ResolveSubHtmlRunner extends FileRunner {

    abstract parseDocumentData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
    abstract compileRootDocument(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        return extractMergePrepareData(resource, config, this.parseDocumentData);
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        if (!resource) {
            resource = {};
        }
        if (!resource.content) {
            return null;
        }

        //Note compileAfter needs to be associated with the current component compile scope

        resource = await substituteComponentsPlaceholder(resource, config);
        resource = await this.compileRootDocument(resource as DataParsedDocument, config);
        resource = await compileDeferredInsertToPlaceholder(resource as DataParsedDocument, config);

        return resource;
    }
}