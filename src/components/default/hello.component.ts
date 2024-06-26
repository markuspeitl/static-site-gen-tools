import type { SsgConfig } from "../../config";
import type { IProcessResource } from "../../pipeline/i-processor";
import { renderComponentBodyContent } from "../../processing-tree-wrapper";
import { BaseComponent, IInternalComponent } from "../base-component";

export class HelloWorldComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        if (!resource.data) {
            resource.data = {};
        }
        resource.data.message = "Hello world from component subrenderer";
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        const renderedContent: IProcessResource = await renderComponentBodyContent(resource, config, "__echo_content");

        const message = `\
${renderedContent?.content}
This is the message from hello:
${resource?.data?.message}`;

        resource.content = message;
        return resource;
    }
}