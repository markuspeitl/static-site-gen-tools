import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";
import { BaseComponent, IInternalComponent } from "../base/i-component";
import { html } from "@markus/ts-node-util-mk1";

export interface IHelloResource extends IProcessResource {
    message: string,
}

export class HelloWorldComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        if (!resource) {
            resource = {};
        }
        (resource as IHelloResource).message = "Hello world from component subrenderer";
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        const renderedContent: IProcessResource = await config.processor.renderFork(resource, config, "__echo_content");

        const message = html`\
            ${renderedContent?.content}
            This is the message from hello:
            ${(resource as IHelloResource).message}`;

        resource.content = message;
        return resource;
    }
}