import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from "../../config";
import { addHandlerId, IResourceProcessor } from "../i-resource-processor";
import { IInternalComponent } from '../../components/base-component';
import { FalsyAble } from '../../components/helpers/generic-types';
import { getComponentFrom } from '../../components/components';


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


        return false;
    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }


        const component: FalsyAble<IInternalComponent> = await getComponentFrom(null, config, resourceContent);
        if (!component) {
            return resource;
        }

        const dataResource: DataParsedDocument = await component.data(resource, config);
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        return addHandlerId(dataResource, 'extractor', this);
    }
}