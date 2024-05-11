//https://github.com/fb55/htmlparser2 benchmarks + readme
import * as htmlparser2 from 'htmlparser2';
import { ContentExtraction, extractElement, loadHtml, orSelector, replaceSelected, replaceSelectedAsync, unparseHtml } from "../utils/cheerio-util";
import type { ParserOptions, parseStringPromise } from "xml2js";
import type xml2js from "xml2js";
import { getLibInstance } from "../dependencies/module-instances";
import { SsgConfig } from '../config';
import { CompileRunner, DataParsedDocument, DocumentData } from './runners';
import { FileRunner } from './file.runner';
import { FalsyAble } from '../components/helpers/generic-types';
import { BaseComponent, IInternalComponent } from '../components/base-component';
import { unescape } from 'lodash';
import { arrayify, isEmpty } from '../utils/util';
import { resolvePrimitiveLeaves } from '../utils/walk-recurse';
import path from 'path';
import { calcHash } from '../fragement-cache';
import { getResourceImports } from '../components/components';



//function parsedXmlToDict(parsedXml: any): 

//function xml2JsToJsDict(parsedXml: any): any {}

export function getHtmlTagRegex(tagName: string): string {
    //const validRegexPartial = `<\\s*${tagName}\\s*>|<\\s*${tagName}\\s*/\\s*>`;
    const validRegexPartial = `<\\s*/\\s*${tagName}\\s*>`;
    return validRegexPartial;
}

export function isComponentTagInHtml(html: string, tag: string): boolean {
    const regexPattern: string = getHtmlTagRegex(tag);
    const regExp: RegExp = new RegExp(regexPattern, 'gi');
    const isMatch: boolean = regExp.test(html);
    return isMatch;
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

export async function compileSubComponents(html: string, componentsToCompile: Record<string, IInternalComponent>, dataCtx: any, config: SsgConfig): Promise<string> {

    const toCompileComponentIds: string[] = Object.keys(componentsToCompile);
    const anyComponentSelector = orSelector(toCompileComponentIds);

    const replacerFunction = async (tag: string, element: cheerio.Element, $: cheerio.Root) => {
        const componentHtml = $(element).html() || '';
        const componentData = $(element).data() || {};

        const selectedComponentInstance: IInternalComponent = componentsToCompile[ tag ];

        const attrDict: { [ attr: string ]: string; } = $(element).attr();

        const subDocToCompile: DataParsedDocument = {
            content: unescape(componentHtml),
            data: Object.assign({}, componentData, dataCtx, attrDict),
        };

        const dataParseDoc: FalsyAble<DataParsedDocument> = await selectedComponentInstance.data(subDocToCompile, config);
        const subCompiledDoc: FalsyAble<DataParsedDocument> = normalizeToDataParsedDoc(await selectedComponentInstance.render(dataParseDoc, config));

        //const subCompiledDoc: FalsyAble<DataParsedDocument> = await config.masterCompileRunner?.compileWith('ts', subDocToCompile, config);

        /*const subComponentDoc: FalsyAble<DataParsedDocument> = await compileComponent(
            {
                content: componentHtml,
                data: Object.assign({}, componentData, dataCtx)
            },
            selectedComponentInstance,
            config
        );*/

        if (!subCompiledDoc) {
            return componentHtml;
        }
        return subCompiledDoc?.content;
    };

    return replaceSelectedAsync(html, anyComponentSelector, replacerFunction);
}

export function selectSubset(obj: Record<string, any>, selectedKeys: string[]): Record<string, any> {

    const objKeys: string[] = Object.keys(obj);
    return objKeys.reduce(
        (targetObj, key) => {
            if (selectedKeys.includes(key)) {
                targetObj[ key ] = obj[ key ];
            }
            return targetObj;
        },
        {}
    );
}

export function findUsedComponents(html: string, importCache: Record<string, IInternalComponent>): Record<string, IInternalComponent> {

    //Assume html is valid and not malformed (every opening/closing tag represents a valid full html item)

    const validSubComponentIds: string[] = Object.keys(importCache);
    const foundComponentIds: string[] = validSubComponentIds.filter((id: string) => isComponentTagInHtml(html, id));
    return selectSubset(importCache, foundComponentIds);

    //return foundComponentIds;

    /*const regexPatterns: string[] = validSubComponentIds.map((componentId: string) => getHtmlTagRegex(componentId));
    const regExps: RegExp = regexPatterns.map((pattern: string) => new RegExp(pattern, 'gi'));*/

    //const combinedRegexPattern: string = regexPatterns.join('|');
    //const anyComponentMatchExp
}

export async function findCompileSubComponents(html: string, importedComponents: Record<string, IInternalComponent>, dataCtx: any, config: SsgConfig): Promise<string> {

    const usedComponents: Record<string, IInternalComponent> = findUsedComponents(html, importedComponents);
    return compileSubComponents(html, usedComponents, dataCtx, config);
}

function assignAttribsToSelf(dict: any, key: string): any {

    //Pull xml2js parsed attributes to node
    Object.assign(dict[ key ], dict[ key ][ '$' ]);
    delete dict[ key ][ '$' ];
    return dict;
}
function assignXml2JsAttribsToSelf(dict: any): any {
    //Pull xml2js parsed attributes to node

    if (typeof dict === 'object' && dict[ '$' ]) {
        Object.assign(dict, dict[ '$' ]);
        delete dict[ '$' ];
    }
    return dict;
}
function assignAllAttribsToSelf(dict: any) {
    assignXml2JsAttribsToSelf(dict);

    if (Array.isArray(dict)) {
        for (const currentValue of dict) {
            assignAllAttribsToSelf(currentValue);
        }
    }
    if (typeof dict === 'object') {
        for (const key in dict) {
            const currentValue = dict[ key ];

            assignAllAttribsToSelf(currentValue);
        }
    }
    return dict;
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

async function parseHtmlData(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    //const opts: ParserOptions = {}
    //const $: cheerio.Root = loadHtml(resource.content);

    /*const xmlBuilder = new Builder();
    const xmlString = xmlBuilder.buildObject({
        root: {
            title: "Resume Markus Peitl",
            layout: "./frame.ehtml",
            tags: [
                'cv',
                'resume',
                'skills'
            ]
        }
    });*/
    const { parseStringPromise, Builder } = await getLibInstance('xml2js', config);

    const contentExtraction: ContentExtraction = extractElement(resource.content, dataHtmlTag);

    //No data prop to extract
    if (!contentExtraction || !contentExtraction.selected) {
        return resource;
    }

    const parsedDataOuter: any = await parseStringPromise(
        contentExtraction.selected,
        {
            trim: true,
            explicitArray: false
        }
    );
    const parsedDataInner: any = assignAllAttribsToSelf(parsedDataOuter.data);

    return {
        content: contentExtraction.content,
        data: parsedDataInner
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

export async function compileResourceSubComponents(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<DataParsedDocument> {

    if (!resource) {
        return {
            content: '',
            data: {}
        };
    }

    const htmlContent: string = resource.content;
    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    const compiledContent: string = await findCompileSubComponents(htmlContent, selectedDependencies, resource.data, config);
    return normalizeToDataParsedDoc(compiledContent, resource);
}

export type IDocumentDataParser = (resource: DataParsedDocument, config: SsgConfig) => Promise<DataParsedDocument>;

export async function extractMergePrepareData(
    resource: DataParsedDocument,
    config: SsgConfig,
    parseDocumentDataFn: IDocumentDataParser,

): Promise<FalsyAble<DataParsedDocument>> {

    const dataExtractedDoc: DataParsedDocument = await parseDocumentDataFn(resource, config);
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

export async function compileHtmlResource(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
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

export async function compileDeferred(deferredCompileArgs: DeferCompileArgs[], resource: DataParsedDocument, config: SsgConfig): Promise<DeferCompileArgs[] | null> {

    const parentData: any = resource.data;
    if (!parentData.importCache || !deferredCompileArgs) {
        return null;
    }

    const deferredCompilePromises: Promise<DeferCompileArgs>[] = deferredCompileArgs.map((args) => compileDeferredComponent(args, parentData, config));

    const settledCompilePromises: PromiseSettledResult<DeferCompileArgs>[] = await Promise.allSettled(deferredCompilePromises);

    return settledCompilePromises.map((settledCompile: PromiseSettledResult<DeferCompileArgs>) => {
        if (settledCompile.status === 'rejected') {
            return {};
        }

        return settledCompile.value;
    });
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


const dataHtmlTag: string = 'data';

export class HtmlRunner extends FileRunner {

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        return extractMergePrepareData(resource, config, parseHtmlData);
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        if (!resource) {
            resource = {};
        }

        resource = await substituteComponentsPlaceholder(resource, config);
        resource = await compileHtmlResource(resource as DataParsedDocument, config);
        resource = await compileDeferredInsertToPlaceholder(resource as DataParsedDocument, config);

        return resource;
    }
}

export function getInstance(): CompileRunner {
    return new HtmlRunner();
}