import type { SsgConfig } from "../../config";
import type { IProcessResource } from "../../processing-tree/i-processor";

import { BaseComponent, IInternalComponent } from "../base-component";

export class HelloWorldComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        if (!resource) {
            resource = {};
        }
        resource.message = "Hello world from component subrenderer";
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        const renderedContent: IProcessResource = await config.processor.renderFork(resource, config, "__echo_content");

        const message = `\
${renderedContent?.content}
This is the message from hello:
${resource.message}`;

        resource.content = message;
        return resource;
    }
}