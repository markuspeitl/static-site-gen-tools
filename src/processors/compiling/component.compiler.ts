import type { SsgConfig } from "../../config/ssg-config";
import type { IImportInstance } from "../../components/resolve-imports";
import { isComponentResource, type IProcessResource } from '../../processors/shared/i-processor-resource';
import { isProcessor } from "../../processing-tree/i-processor";
import { isRenderComponent } from "../../components/base/i-component";
import { FalsyAble } from "@markus/ts-node-util-mk1";

export const id: string = 'component.compiler';

export async function process(
    resource: IProcessResource,
    config: SsgConfig,
): Promise<IProcessResource> {
    //console.log(`LOG: Extracting '${this.id}': ${resource.src}`);

    if (!isComponentResource(resource)) {
        return resource;
    }

    const component: IImportInstance = resource.componentInstance;

    if (isProcessor(component) && component.process) {
        const processedResource: FalsyAble<IProcessResource> = await component.process(resource, config);
        if (!processedResource) {
            return resource;
        }
    }
    else if (isRenderComponent(component) && component.render) {
        return component.render(resource, config);
    }

    return resource;
}