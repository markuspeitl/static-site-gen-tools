import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId } from "../i-resource-processor";
import { setHtmlOutputFormat } from './output-format';

export class HtmlCompiler implements IResourceProcessor {
    id: string = 'html.compiler';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        const matchesCnt = (resourceContent.match(/<\s*[a-zA-Z0-9\-\_]+\s*>|<\s*\/\s*[a-zA-Z0-9\-\_]+\s*>/g) || []).length;

        //Has any openend and closed html tags in document
        if (matchesCnt >= 1) {
            return true;
        }

        return false;

    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }

        resource.content = resourceContent;
        const dataResource: IProcessResource = resource;

        resource = setHtmlOutputFormat(resource);
        return addHandlerId(dataResource, 'compiler', this);
    }
}