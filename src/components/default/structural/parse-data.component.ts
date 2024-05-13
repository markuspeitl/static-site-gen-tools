import { DataParsedDocument } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { BaseCompileContentFormatComponent } from "../../base-body-compile-component";

export abstract class DataComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'html';

    public async render(resource: DataParsedDocument, config?: SsgConfig): Promise<DataParsedDocument> {
        return resource;
    }
}