import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IProcessingNode, IResourceProcessor } from "../../processing-tree/i-processor";

import { HtmlCompiler } from './html.compiler';
import { compilePendingFragmentsOf } from '../../components/compile-fragments';

export class ComponentCompiler implements IResourceProcessor {
    id: string = 'component.compiler';

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
        if (!resource) {
            return resource;
        }
        //console.log(`LOG: Compiling '${this.id}': ${resource.src}`);

        //Fork the resource from which it is originating (but no merging back of the sub scopes)
        return compilePendingFragmentsOf(resource, config);
    }
}