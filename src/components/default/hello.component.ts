import { DocumentData, DataParsedDocument } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { BaseComponent, IInternalComponent } from "../base-component";

export class HelloWorldComponent implements BaseComponent, IInternalComponent {

    public async data(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {

        if (!resource.data) {
            resource.data = {};
        }
        resource.data.message = "Hello world from component subrenderer";
        return resource;
    }
    public async render(resource: DataParsedDocument, config?: SsgConfig): Promise<DataParsedDocument> {

        const message = `\
${resource?.content}
This is the message from hello:
${resource?.data?.message}`;

        resource.content = message;
        return resource;
    }
}