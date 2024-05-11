//https://github.com/fb55/htmlparser2 benchmarks + readme
import * as htmlparser2 from 'htmlparser2';
import { ContentExtraction, extractElement, loadHtml, orSelector, replaceSelected, replaceSelectedAsync } from "../utils/cheerio-util";
import type { ParserOptions, parseStringPromise } from "xml2js";
import type xml2js from "xml2js";
import { getLibInstance } from "../dependencies/module-instances";
import { SsgConfig } from '../config';
import { CompileRunner, DataParsedDocument, DocumentData } from './runners';
import { FileRunner } from './file.runner';
import { FalsyAble } from '../components/helpers/generic-types';
import { loadComponentImports } from './lib/component-cache';
import { BaseComponent, IInternalComponent } from '../components/base-component';
import { getResourceImports } from '../components/components';
import { unescape } from 'lodash';
import { arrayify, isEmpty } from '../utils/util';
import { resolvePrimitiveLeaves } from '../utils/walk-recurse';
import path from 'path';



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


export class HtmlRunner extends FileRunner {

    protected matcherExpression: string | null = null;
    protected defaultMatcherExpression: string = ".+\.html|.+\.ehtml";

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        const { parseStringPromise, Builder } = await getLibInstance('xml2js', config);

        //const $: cheerio.Root = loadHtml(resource.content);

        const contentExtraction: ContentExtraction = extractElement(resource.content, 'data');

        if (!contentExtraction || !contentExtraction.selected) {
            return resource;
            /*return {
                content: contentExtraction.content || fileContent
            };*/
        }

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

        //const opts: ParserOptions = {}
        const parsedDataOuter: any = await parseStringPromise(contentExtraction.selected, { trim: true, explicitArray: false });
        const parsedDataInner: any = assignAllAttribsToSelf(parsedDataOuter.data);


        const dataExtractedDoc: FalsyAble<DataParsedDocument> = {
            content: contentExtraction.content,
            data: parsedDataInner,
        };

        Object.assign(dataExtractedDoc.data || {}, resource.data);

        if (dataExtractedDoc.data) {

            //assignAttribsToSelf(dataExtractedDoc.data, 'import');

            if (!Array.isArray(dataExtractedDoc.data.import)) {
                dataExtractedDoc.data.import = arrayify(dataExtractedDoc.data.import);
            }

            dataExtractedDoc.data.import = dataExtractedDoc.data.import.map((importXmlData) => importXmlData.path);

            const currentDocumentDir: string = path.parse(dataExtractedDoc.data.src).dir;
            dataExtractedDoc.data = resolveRelativePaths(dataExtractedDoc.data, currentDocumentDir);
        }

        parsedDataInner.importCache = await getResourceImports(dataExtractedDoc, config);

        return dataExtractedDoc;
    }



    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource) {
            return null;
        }

        const htmlContent: string = resource.content;
        //const $ = loadHtml(htmlContent);

        //const compiledContent: string = await findCompileSubComponents(htmlContent, resource.data?.importCache, resource.data, config);

        let selectedDependencies: Record<string, IInternalComponent> = {};
        if (resource.data?.importCache && !isEmpty(resource.data?.importCache)) {
            selectedDependencies = resource.data?.importCache;
        }
        else {
            selectedDependencies = config.defaultComponentsCache || {};
        }

        const compiledContent: string = await findCompileSubComponents(htmlContent, selectedDependencies, resource.data, config);

        return {
            content: compiledContent,
            data: resource.data
        };


        /*const compiledOutput: DataParsedDocument = {
            content: resource,
            data: data
        };

        const componentImportLocations: string[] = data?.import;*/

        //const importedComponents: BaseComponent[] = loadComponentImports(data?.src, componentImportLocations);

        //TODO: detect and load custom components
        //TODO: linking or loading in custom component definitions for usage in the document

        //return resource;
    }

    public getMatcher(): string | RegExp {
        if (this.matcherExpression) {
            return this.matcherExpression;
        }
        return this.defaultMatcherExpression;
    }
}

export function getInstance(): CompileRunner {
    return new HtmlRunner();
}

/*export function getCompiler(): DocumentCompiler {
    const defaultHtmlDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: SsgConfig) => {

            if (!fileContent) {
                return null;
            }

            const compiledOutput: DataParsedDocument = {
                content: fileContent,
                data: dataCtx
            };

            return compiledOutput;
        }
    };

    return defaultHtmlDocumentCompiler;
}

export function extractHtmlBetweenTags(fileContent: string, tag: string): string {

    return new Promise<string>((resolve: (result: any) => void, reject: (reason?: any) => void) => {
        console.log();
        //return resolve();
        //return reject();

        const parser = new htmlparser2.Parser({
            onopentag(name, attributes) {

                if (name === "script" && attributes.type === "text/javascript") {
                    console.log("JS! Hooray!");
                }
            },
            ontext(text) {
                console.log("-->", text);
            },
            onclosetag(tagname) {
                if (tagname === "data") {
                    console.log("That's it?!");
                }
            },
        });

        parser.write(fileContent);

    });
}

export function extractHtmlDataContents(fileContent: string): string {

    const parsedDom = htmlparser2.parseDocument(fileContent);
}


export async function getExtractor(): Promise<DataExtractor> {

    const { parseStringPromise } = await import("xml2js");

    const defaultHtmlDataExtractor: DataExtractor = {
        extractData: async (fileContent: string, config?: SsgConfig) => {

            const $: cheerio.Root = loadHtml(fileContent);

            const contentExtraction: ContentExtraction = extractElement(fileContent, 'data');

            if (!contentExtraction || !contentExtraction.selected) {
                return {
                    content: contentExtraction.content || fileContent
                };
            }

            //const opts: ParserOptions = {}
            const parsedData: any = await parseStringPromise(contentExtraction.selected);

            const parsedDoc: DataParsedDocument = {
                content: contentExtraction.content,
                data: parsedData
            };

            return parsedDoc;
        }
    };

    return defaultHtmlDataExtractor;
}*/