import type { IInternalComponent } from '../../components/base-component';
import type { SsgConfig } from "../../config";
import type { IProcessingNode, IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { HtmlCompiler } from './html.compiler';
import { compilePendingChildren } from '../../components/deferred-component-compiling';

export class ComponentCompiler implements IResourceProcessor {
    id: string = 'component.compiler';

    protected htmlCompilerSubject: IProcessingNode = new HtmlCompiler();
    public canHandle = this.htmlCompilerSubject.canHandle;
    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return this.htmlCompilerSubject.canHandle(resource, config);
    }*/

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        resource.content = resourceContent;
        if (!resource.data) {
            return resource;
        }
        //console.log(`LOG: Compiling '${this.id}': ${resource.data?.document?.src}`);
        return compilePendingChildren(resource, config);
    }
}