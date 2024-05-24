import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { addHandlerId } from "../i-resource-processor";
import { IInternalComponent } from '../../components/base-component';
import { FalsyAble } from '../../components/helpers/generic-types';
import { getComponentFrom } from '../../components/components';
import { setHtmlOutputFormat } from '../compiling/output-format';
import { forkResourceScope } from '../../manage-scopes';
import { IResourceProcessor } from '../../pipeline/i-processor';

export class TsExtractor implements IResourceProcessor {
    id: string = 'ts';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }
        //if (resourceContent.includes('export ')) {
        /*const module = await getTsModule(resourceContent, null, config.tsModulesCache);
        if (module) {
            return true;
        }*/

        const component: FalsyAble<IInternalComponent> = await getComponentFrom(null, config, resourceContent);
        if (component) {
            return true;
        }

        return true;
        //return false;
    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Extracting ${this.id}: ${resource.data?.document?.src}`);


        const component: FalsyAble<IInternalComponent> = await getComponentFrom(null, config, resourceContent);
        if (!component) {
            return resource;
        }

        let dataResource: DataParsedDocument = await component.data(resource, config);
        if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }

        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        dataResource = setHtmlOutputFormat(dataResource);
        return addHandlerId(dataResource, 'extractor', this);
    }
}