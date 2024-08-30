import type { SsgConfig } from "../../config/ssg-config";
import type { IImportInstance } from "../../components/resolve-imports";
import { isComponentResource, type IProcessResource } from '../../processors/shared/i-processor-resource';
import { isDataComponent, type IInternalComponent } from '../../components/base/i-component';

export const id: string = 'component.extractor';

export async function process(
    resource: IProcessResource,
    config: SsgConfig,
): Promise<IProcessResource> {
    //console.log(`LOG: Extracting '${this.id}': ${resource.src}`);

    if (!isComponentResource(resource)) {
        return resource;
    }

    const component: IImportInstance = resource.componentInstance;

    if (!isDataComponent(component)) {
        return resource;
    }

    return component.data(resource, config);
}