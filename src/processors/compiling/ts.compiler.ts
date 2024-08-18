import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';

import { TsBaseProcessor } from "../shared/ts.base.processor";

export class TsCompiler extends TsBaseProcessor {
    id: string = 'ts.compiler';

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return super.process(resource, config, 'render', 'html');
    }
}