import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId } from "../i-resource-processor";
import { ContentExtraction, extractElement } from '../../utils/cheerio-util';
import { IResourceProcessor } from '../../pipeline/i-processor';

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


export class HtmlExtractor implements IResourceProcessor {
    id: string = 'html';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        const mdTokenCount = (resourceContent.match(/<\s*data\s*>|<\s*\/\s*data\s*>/g) || []).length;

        if (resourceContent.startsWith('<data>') && mdTokenCount >= 2) {
            return true;
        }

        return false;

    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Extracting ${this.id}: ${resource.data?.document?.src}`);

        const dataResource: DataParsedDocument = await parseHtmlData(resource, config);
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        return addHandlerId(dataResource, 'extractor', this);
    }
}