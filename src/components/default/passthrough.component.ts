import type { SsgConfig } from "../../config";
import type { IProcessResource } from "../../pipeline/i-processor";
import { BaseComponent, IInternalComponent } from "../base-component";

export class PassthroughComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
        return {
            content: resource?.content || '',
            data: resource?.data,
        };
    }
}