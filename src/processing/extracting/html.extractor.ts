import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { getLibInstance } from "../../dependencies/lib-module-instances";
import { ContentExtraction, extractElement } from "@markus/ts-node-util-mk1";

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
async function parseHtmlData(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
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

    resource.content = contentExtraction;
    Object.assign(resource, parsedDataInner);
    return resource;
}


export class HtmlExtractor implements IResourceProcessor {
    id: string = 'html.extractor';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }


        if (!resourceContent.startsWith('<data')) {
            return false;
        }


        const mdTokenCount = (resourceContent.match(/<\s*data\s*>|<\s*\/\s*data\s*>/g) || []).length;

        if (resourceContent.startsWith('<data>') && mdTokenCount >= 2) {
            return true;
        }

        return false;

    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        //console.log(`LOG: Extracting '${this.id}': ${resource.document?.src}`);

        const dataResource: IProcessResource = await parseHtmlData(resource, config);
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        return dataResource;
        //return addHandlerId(dataResource, 'extractor', this);
    }
}