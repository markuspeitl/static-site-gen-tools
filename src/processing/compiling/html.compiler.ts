import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId, IResourceProcessor } from "../i-resource-processor";
import { setHtmlOutputFormat } from './output-format';

export class HtmlCompiler implements IResourceProcessor {
    id: string = 'html';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        const matchesCnt = (resourceContent.match(/<\s*[a-zA-Z0-9\-\_]+\s*>|<\s*\/\s*[a-zA-Z0-9\-\_]+\s*>/g) || []).length;

        //Has any openend and closed html tags in document
        if (matchesCnt >= 2) {
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
        const dataResource: DataParsedDocument = resource;

        resource = setHtmlOutputFormat(resource);
        return addHandlerId(dataResource, 'compiler', this);
    }
}