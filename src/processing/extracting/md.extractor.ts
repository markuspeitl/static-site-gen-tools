import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../processing-tree/i-processor';
import { getLibInstance } from "../../dependencies/lib-module-instances";
//import type markdownit from "markdown-it/lib";
import type * as matter from "gray-matter";
//type MatterType = typeof matter;
//import matter from "gray-matter";

export async function parseMarkdownData(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    const matterInstance: any = await getLibInstance('matter', config);
    //const matter = getOverrideOrLocal('matter', config);

    const dataParsedMdFile: matter.GrayMatterFile<string> = matterInstance.default(resource.content);
    //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
    //mdItInstance.render(fileContent);

    //return dataParsedMdFile.data;

    resource.content = dataParsedMdFile.content;
    Object.assign(resource, dataParsedMdFile.data);
    return resource;
}



export class MarkdownExtractor implements IResourceProcessor {
    id: string = 'md.extractor';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
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

    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        //console.log(`LOG: Extracting '${this.id}': ${resource.document?.src}`);

        const dataResource: IProcessResource = await parseMarkdownData(resource, config);
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!
        return dataResource;
        //return addHandlerId(dataResource, 'extractor', this);
    }
}