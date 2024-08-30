import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { getLibInstance } from "../../dependencies/lib-module-instances";
import { setKeyInDict } from "@markus/ts-node-util-mk1";

async function compileMarkdownResource(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    const markdownRendererInstance: markdownit = await getLibInstance('markdown', config, {
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
    });

    const content = markdownRendererInstance.render(resource.content);

    /*const compiledOutput: IProcessResource = {
        content: markdownRendererInstance.render(resource.content),

        //If any from outside accessible data properties or functions get defined within the component evaluated from 
        //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
    };*/
    resource.content = content;
    return resource;
}

export class MarkdownCompiler implements IResourceProcessor {
    id: string = 'md.compiler';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        return true;

    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        resource.content = resource.content?.trim();
        if (!resource.content) {
            return resource;
        }

        console.log(`Compiling '${this.id}': <src> ${resource.src} <fragment> ${resource.fragmentId} ${resource.fragmentTag}`);
        const mdCompiledResource: IProcessResource = await compileMarkdownResource(resource, config);

        resource.targetFormat = 'html';

        return mdCompiledResource;
        //resource = setHtmlOutputFormat(resource);
        //return addHandlerId(dataResource, 'compiler', this);
    }
}