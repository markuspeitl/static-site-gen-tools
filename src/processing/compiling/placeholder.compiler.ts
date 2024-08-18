import type { SsgConfig } from "../../config";
import type { IProcessingNode, IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import { HtmlCompiler } from './html.compiler';
import { detectReplaceComponentsToPlaceholders } from '../../components/components-to-placeholders';

export class PlaceholderCompiler implements IResourceProcessor {
    id: string = 'placeholder.compiler';

    protected htmlCompilerSubject: IProcessingNode = new HtmlCompiler();
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
        return detectReplaceComponentsToPlaceholders(resource, config);
    }
}