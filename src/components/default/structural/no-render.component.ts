import type { SsgConfig } from "../../../config/ssg-config";
import type { IProcessResource } from "../../../processors/shared/i-processor-resource";
import { BaseComponent, IInternalComponent } from "../../base/i-component";

export abstract class NoRenderComponent implements BaseComponent, IInternalComponent {
    public canCompile(resource: IProcessResource, config: SsgConfig): boolean {
        return true;
    }

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }

    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        if (!this.canCompile(resource, config)) {
            return resource;
        }
        resource.content = '';
        return resource;
    }
}