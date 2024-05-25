import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import type { FalsyAble } from '../../components/helpers/generic-types';
import { addHandlerId } from "../i-resource-processor";
import { getComponentFrom } from '../../components/components';
import { TsExtractor } from '../extracting/ts.extractor';
import { setHtmlOutputFormat } from './output-format';
import { forkResourceScope } from '../../manage-scopes';

export class TsCompiler implements IResourceProcessor {
    id: string = 'ts.compiler';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {

        const tsExtractor: TsExtractor = new TsExtractor();
        return tsExtractor.canHandle(resource, config);
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Compiling ${this.id}: ${resource.data?.document?.src}`);

        const component: FalsyAble<IInternalComponent> = await getComponentFrom(null, config, resourceContent);
        if (!component) {
            return resource;
        }

        let dataResource: IProcessResource = await component.render(resource, config);
        if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }

        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        dataResource = setHtmlOutputFormat(dataResource);
        return addHandlerId(dataResource, 'compiler', this);
    }
}