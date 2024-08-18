import type { SsgConfig } from "../../config";
import { IProcessResource } from "../../processing-tree/i-processor";

import { BaseComponent, IInternalComponent } from "../base-component";

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