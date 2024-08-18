import type { SsgConfig } from "../../../config";
import type { IProcessResource } from "../../../processing-tree/i-processor";
import { BaseCompileContentFormatComponent } from "../../base-body-compile-component";

export abstract class DataComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'html';

    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }
}