import { DataParsedDocument } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { BaseComponent, IInternalComponent } from "../../base-component";

export abstract class NoRenderComponent implements BaseComponent, IInternalComponent {
    public canCompile(resource: DataParsedDocument, config?: SsgConfig): boolean {
        return true;
    }

    public async data(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {
        return resource;
    }

    public async render(resource: DataParsedDocument, config?: SsgConfig): Promise<DataParsedDocument> {
        if (!this.canCompile(resource, config)) {
            return resource;
        }
        resource.content = '';
        return resource;
    }
}