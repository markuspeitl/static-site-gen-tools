import type { SsgConfig } from "../../../config";
import type { IProcessResource } from "../../../processing-tree/i-processor";
import { BaseComponent, IInternalComponent } from "../../base-component";

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