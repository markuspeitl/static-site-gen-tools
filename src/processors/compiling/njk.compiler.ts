import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";
import type { Environment } from 'nunjucks';

import { getLibInstance } from "../../dependencies/lib-module-instances";
import { HtmlCompiler } from './html.compiler';
import { setKeyInDict } from "@markus/ts-node-util-mk1";

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
        data: resource
    };
    return compiledOutput;
}


const njkSyntaxRegexes = [
    new RegExp(/{{\s*[a-zA-Z0-9\-\_]+\s*}}/g),
    new RegExp(/{%\s*[a-zA-Z0-9\-\_]+\s*%}/g)
];

export class NunjucksCompiler implements IResourceProcessor {
    id: string = 'njk.compiler';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
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
    }*/

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        resource.content = resource.content?.trim();
        if (!resource.content) {
            return resource;
        }
        //console.log(`LOG: Compiling '${this.id}': ${resource.src}`);

        console.log(`Compiling '${this.id}': <src> ${resource.src} <fragment> ${resource.fragmentId} ${resource.fragmentTag}`);

        const nunjucks: Environment = await getLibInstance('nunjucks', config);
        const compiledString: string = nunjucks.renderString(resource.content, resource);
        /*const dataResource: IProcessResource = {
            content: compiledString,
            data: resource
        };*/

        //resource = setHtmlOutputFormat(resource);
        resource.targetFormat = 'html';

        resource.content = compiledString;

        return resource;
        //return dataResource;
        //return addHandlerId(dataResource, 'compiler', this);
    }
}