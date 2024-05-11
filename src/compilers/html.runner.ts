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
import { selectSubset } from '../components/helpers/dict-util';
import { ResolveSubHtmlRunner } from './resolve-sub-html.runner';

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

const dataHtmlTag: string = 'data';

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

export async function compileHtmlResource(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    return resource;
}

export class HtmlRunner extends ResolveSubHtmlRunner {
    public parseDocumentData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        return parseHtmlData(resource, config);
    }
    public compileRootDocument(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        return compileHtmlResource(resource, config);
    }
}

export function getInstance(): CompileRunner {
    return new HtmlRunner();
}