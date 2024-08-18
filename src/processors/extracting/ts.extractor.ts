import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import { TsBaseProcessor } from "../shared/ts.base.processor";

export class TsExtractor extends TsBaseProcessor {
    id: string = 'ts.extractor';

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return super.process(resource, config, 'data', 'html');
    }
}