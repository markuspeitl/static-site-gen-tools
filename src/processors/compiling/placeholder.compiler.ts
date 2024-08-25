import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IProcessingNode, IResourceProcessor } from "../../processing-tree/i-processor";
import type { IInternalComponent } from '../../components/base/i-component';

import { HtmlCompiler } from './html.compiler';
import { replaceHtmlFragments } from '../../components/replace-fragments';

export class PlaceholderCompiler implements IResourceProcessor {
    id: string = 'placeholder.compiler';

    //protected htmlCompilerSubject: IProcessingNode = new HtmlCompiler();
    //public canHandle = this.htmlCompilerSubject.canHandle;
    /*/*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return this.htmlCompilerSubject.canHandle(resource, config);
    }*/

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        resource.content = resourceContent;
        const subComponentsReplacedResource: IProcessResource = await replaceHtmlFragments(resource, config);
        return subComponentsReplacedResource;
    }
}