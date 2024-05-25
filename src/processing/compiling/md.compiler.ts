import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId } from "../i-resource-processor";
import { setHtmlOutputFormat } from './output-format';

async function compileMarkdownResource(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    const markdownRendererInstance: markdownit = await getLibInstance('markdown', config, {
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
    });

    const compiledOutput: IProcessResource = {
        content: markdownRendererInstance.render(resource.content),

        //If any from outside accessible data properties or functions get defined within the component evaluated from 
        //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
        data: resource.data
    };
    return compiledOutput;
}

export class MarkdownCompiler implements IResourceProcessor {
    id: string = 'md.compiler';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        return true;

    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Compiling ${this.id}: ${resource.data?.document?.src}`);

        resource.content = resourceContent;
        const dataResource: IProcessResource = await compileMarkdownResource(resource, config);

        resource = setHtmlOutputFormat(resource);
        return addHandlerId(dataResource, 'compiler', this);
    }
}