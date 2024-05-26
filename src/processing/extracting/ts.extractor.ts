import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import type { FalsyAble } from '../../components/helpers/generic-types';
import { setKeyInDict } from "../../components/helpers/dict-util";
import { getTsComponentFromResource } from "../../components/components";

export class TsExtractor implements IResourceProcessor {
    id: string = 'ts.extractor';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
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

        const component: FalsyAble<IInternalComponent> = await getTsComponentFromResource(resource, config);
        if (component) {
            return true;
        }
        return false;
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        console.log(`Extracting ${this.id}: ${resource.data?.document?.src}`);

        const component: FalsyAble<IInternalComponent> = await getTsComponentFromResource(resource, config);
        if (!component) {
            return resource;
        }

        const dataResource: IProcessResource = await component.data(resource, config);
        /*if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }*/

        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        //dataResource = setHtmlOutputFormat(dataResource);
        setKeyInDict(resource, 'data.document.outputFormat', 'html');

        return dataResource;

        //return addHandlerId(dataResource, 'extractor', this);
    }
}