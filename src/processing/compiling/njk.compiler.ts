import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId, IResourceProcessor } from "../i-resource-processor";
import { HtmlCompiler } from './html.compiler';
import type { Environment } from 'nunjucks';

async function compileMarkdownResource(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    const markdownRendererInstance: markdownit = await getLibInstance('markdown', config, {
        html: true,
        linkify: true,
        typographer: true
    });

    const compiledOutput: DataParsedDocument = {
        content: markdownRendererInstance.render(resource.content),

        //If any from outside accessible data properties or functions get defined within the component evaluated from 
        //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
        data: resource.data
    };
    return compiledOutput;
}


const njkSyntaxRegexes = [
    new RegExp(/{{\s*[a-zA-Z0-9\-\_]+\s*}}/g),
    new RegExp(/{%\s*[a-zA-Z0-9\-\_]+\s*%}/g)
];

export class NunjucksCompiler implements IResourceProcessor {
    id: string = 'njk';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        const htmlCompiler = new HtmlCompiler();

        const njkSyntaxMatches = njkSyntaxRegexes.map((regex) => regex.test(resourceContent));
        njkSyntaxMatches.push(await htmlCompiler.canHandle(resource, config));

        if (njkSyntaxMatches.some(Boolean)) {
            return true;
        }

        return false;
    }

    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }

        resource.content = resourceContent;


        const nunjucks: Environment = await getLibInstance('nunjucks', config);
        const compiledString: string = nunjucks.renderString(resource.content, resource?.data || {});
        const dataResource: DataParsedDocument = {
            content: compiledString,
            data: resource.data
        };

        return addHandlerId(dataResource, 'compiler', this);
    }
}