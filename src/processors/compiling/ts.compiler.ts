import type { SsgConfig } from "../../config";
import type { IProcessResource } from '../../processing-tree/i-processor';
import { TsBaseProcessor } from "../shared/ts.base.processor";

export class TsCompiler extends TsBaseProcessor {
    id: string = 'ts.compiler';

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return super.process(resource, config, 'render', 'html');
    }
}