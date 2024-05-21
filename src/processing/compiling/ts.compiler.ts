



import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { addHandlerId } from "../i-resource-processor";
import { IInternalComponent } from '../../components/base-component';
import { FalsyAble } from '../../components/helpers/generic-types';
import { getComponentFrom } from '../../components/components';
import { TsExtractor } from '../extracting/ts.extractor';
import { setHtmlOutputFormat } from './output-format';
import * as lodash from 'lodash';
import { forkResourceScope } from '../../manage-scopes';
import { IResourceProcessor } from '../../pipeline/resource-pipeline';

export class TsCompiler implements IResourceProcessor {
    id: string = 'ts';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {

        const tsExtractor: TsExtractor = new TsExtractor();
        return tsExtractor.canHandle(resource, config);
    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Compiling ${this.id}: ${resource.data?.document?.src}`);

        const component: FalsyAble<IInternalComponent> = await getComponentFrom(null, config, resourceContent);
        if (!component) {
            return resource;
        }

        let dataResource: DataParsedDocument = await component.render(resource, config);
        if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }

        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        dataResource = setHtmlOutputFormat(dataResource);
        return addHandlerId(dataResource, 'compiler', this);
    }
}