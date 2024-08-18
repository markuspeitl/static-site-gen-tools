import type { SsgConfig } from "../../config/ssg-config";
import type { BaseComponent, IInternalComponent } from "../base/i-component";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";

export class EchoComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        resource.content = `ECHO--- ${resource?.content || ''} ---ECHO`;

        return config.processor.renderFork(resource, config, "__echo_content");
        //return resource;
    }
}