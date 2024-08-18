import type { SsgConfig } from "../../../config/ssg-config";
import type { IProcessResource } from "../../../processors/shared/i-processor-resource";
import { BaseCompileContentFormatComponent } from "../../base/base-body-compile-component";

export abstract class DataComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'html';

    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }
}