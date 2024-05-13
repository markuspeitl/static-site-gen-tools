import { DataParsedDocument } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { BaseComponent, IInternalComponent } from "../base-component";

export class PassthroughComponent implements BaseComponent, IInternalComponent {

    public async data(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {
        return resource;
    }
    public async render(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {
        return {
            content: resource?.content || '',
            data: resource?.data,
        };
    }
}