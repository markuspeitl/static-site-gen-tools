import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId } from "../i-resource-processor";
//import type markdownit from "markdown-it/lib";
import type * as matter from "gray-matter";
//type MatterType = typeof matter;
//import matter from "gray-matter";
import { IResourceProcessor } from '../../pipeline/resource-pipeline';

export async function parseMarkdownData(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    const matterInstance: any = await getLibInstance('matter', config);
    //const matter = getOverrideOrLocal('matter', config);

    const dataParsedMdFile: matter.GrayMatterFile<string> = matterInstance.default(resource.content);
    //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
    //mdItInstance.render(fileContent);

    //return dataParsedMdFile.data;

    return {
        content: dataParsedMdFile.content,
        data: dataParsedMdFile.data,
    };
}



export class MarkdownExtractor implements IResourceProcessor {
    id: string = 'md';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        const mdTokenCount = (resourceContent.match(/---/g) || []).length;

        if (resourceContent.startsWith('---') && mdTokenCount >= 2) {
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

        const dataResource: DataParsedDocument = await parseMarkdownData(resource, config);
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        return addHandlerId(dataResource, 'extractor', this);
    }
}