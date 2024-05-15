import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId, IResourceProcessor } from "../i-resource-processor";
import { setHtmlOutputFormat } from './output-format';

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

export class MarkdownCompiler implements IResourceProcessor {
    id: string = 'md';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        return true;

    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Compiling ${this.id}: ${resource.data?.document?.src}`);

        resource.content = resourceContent;
        const dataResource: DataParsedDocument = await compileMarkdownResource(resource, config);

        resource = setHtmlOutputFormat(resource);
        return addHandlerId(dataResource, 'compiler', this);
    }
}