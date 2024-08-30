import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../shared/i-processor-resource';
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
        if (!resource) {
            return resource;
        }

        if (!resource.pendingFragments || resource.pendingFragments.length === 0) {
            return resource;
        }

        resource.content = resource.content?.trim();
        if (!resource.content) {
            return resource;
        }
        //console.log(`LOG: Compiling '${this.id}': ${resource.src}`);

        //Fork the resource from which it is originating (but no merging back of the sub scopes)
        const fragmentsCompiledResource: IProcessResource = await compilePendingFragmentsOf(resource, config);
        return fragmentsCompiledResource;
    }
}