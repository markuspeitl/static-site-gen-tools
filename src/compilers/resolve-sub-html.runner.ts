import path from "path";
import { FalsyAble } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { FileRunner } from "./file.runner";
import { DataParsedDocument } from "./runners";
import { resolvePrimitiveLeaves } from "../utils/walk-recurse";
import { arrayify, isEmpty } from "../components/helpers/array-util";
import { getResourceImports } from "../components/components";
import { IInternalComponent } from "../components/base-component";
import { loadHtml, orSelector, replaceSelectedAsync, unparseHtml } from "../utils/cheerio-util";
import { calcHash } from "../fragement-cache";

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



export function isRelativePath(value: any): boolean {
    if (typeof value === 'string') {
        const hasSeperator = value.includes(path.sep);
        if (!hasSeperator) {
            return false;
        }

        if (!value.startsWith('./') && !value.startsWith('../')) {
            return false;
        }

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

export async function substituteComponentsPlaceholder(
    resource: DataParsedDocument,
    config: SsgConfig,
): Promise<FalsyAble<DataParsedDocument>> {

    //let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    //const importScopeSymbols: string[] = Object.keys(selectedDependencies);

    if (!resource.data) {
        resource.data = {};
    }

    resource.data.compileAfter = [];

    //Find component entry points (first/top-level components, nodes that are components in the syntax tree)

    //Note: Must do a BFS search to properly work -> otherwise components under a component might be replaced as well 
    //(though that should be the component's responsibility that holds this component)
    resource = await detectReplaceComponents(resource, config, (tag: string, body: string, attrs: any) => {
        if (!resource.data) {
            resource.data = {};
        }

        const componentName: string = tag;
        const placeholder: string = `${componentName}-placeholder`;
        const content: string = body;

        const deferCompileArgs: DeferCompileArgs = {
            name: componentName,
            placeholder: placeholder,
            content: content,
            attrs: attrs
        };

        const uniqueComponentCallHash: string = calcHash(deferCompileArgs);

        //Filter for simple characters (special chars are not allowed in html id)
        const uniqueComponentId: string = uniqueComponentCallHash.replace(/[^a-zA-Z0-9]/g, "");

        deferCompileArgs.id = uniqueComponentId;

        resource.data.compileAfter.push(deferCompileArgs);

        return `<${deferCompileArgs.placeholder} id="${deferCompileArgs.id}"/>`;
    });

    return resource;
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

    const dataParseDoc: FalsyAble<DataParsedDocument> = await component.data(subDocToCompile, config);
    const compiledComponentDoc: FalsyAble<DataParsedDocument> = normalizeToDataParsedDoc(await component.render(dataParseDoc, config));

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

    const deferredCompilePromises: Promise<DeferCompileArgs>[] = deferredCompileArgs.map((args) => failSafeCompileDeferredComponent(args, parentData, config));

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

    const $ = loadHtml(resource.content);

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

    resource.content = unparseHtml($);

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

        resource = await substituteComponentsPlaceholder(resource, config);
        resource = await this.compileRootDocument(resource as DataParsedDocument, config);
        resource = await compileDeferredInsertToPlaceholder(resource as DataParsedDocument, config);

        return resource;
    }
}