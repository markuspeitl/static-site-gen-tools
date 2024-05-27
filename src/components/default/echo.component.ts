import type { SsgConfig } from "../../config";
import { IProcessResource } from "../../pipeline/i-processor";
import { renderComponentBodyContent } from "../../processing-tree-wrapper";
import { BaseComponent, IInternalComponent } from "../base-component";

export class EchoComponent implements BaseComponent, IInternalComponent {

    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
        return resource;
    }
    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        resource.content = `ECHO--- ${resource?.content || ''} ---ECHO`;

        return renderComponentBodyContent(resource, config, "__echo_content");
        //return resource;
    }
}