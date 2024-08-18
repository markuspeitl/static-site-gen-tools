import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";
import { BaseComponent, IInternalComponent } from "../base/i-component";

export class PassthroughComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        if (typeof resource === 'string') {
            return {
                content: resource
            };
        }

        if (!resource.content) {
            resource.content = '';
        }
        return resource;

        /*return {
            content: resource?.content || '',
            data: resource?.data,
        };*/
    }
}