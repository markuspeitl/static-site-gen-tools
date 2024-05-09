//https://github.com/fb55/htmlparser2 benchmarks + readme
import * as htmlparser2 from 'htmlparser2';
import { ContentExtraction, extractElement, loadHtml } from "../utils/cheerio-util";
import type { ParserOptions, parseStringPromise } from "xml2js";
import type xml2js from "xml2js";
import { getLibInstance } from "../dependencies/module-instances";
import { SsgConfig } from "../config";
import { CompileRunner, DataParsedDocument, DocumentData } from './runners';
import { FileRunner } from './file.runner';
import { FalsyAble } from '../components/helpers/generic-types';
import { loadComponentImports } from './lib/component-cache';
import { BaseComponent } from '../components/base-component';



//function parsedXmlToDict(parsedXml: any): 

//function xml2JsToJsDict(parsedXml: any): any {}

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
        const parsedData: any = await parseStringPromise(contentExtraction.selected, { trim: true, explicitArray: false });

        const dataExtractedDoc: FalsyAble<DataParsedDocument> = {
            content: contentExtraction.content,
            data: parsedData.data,
        };

        Object.assign(dataExtractedDoc.data || {}, resource.data);

        return dataExtractedDoc;
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource) {
            return null;
        }

        /*const compiledOutput: DataParsedDocument = {
            content: resource,
            data: data
        };

        const componentImportLocations: string[] = data?.import;*/

        //const importedComponents: BaseComponent[] = loadComponentImports(data?.src, componentImportLocations);


        //TODO: detect and load custom components
        //TODO: linking or loading in custom component definitions for usage in the document

        return resource;
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