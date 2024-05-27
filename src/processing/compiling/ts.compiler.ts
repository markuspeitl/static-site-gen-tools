import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import type { FalsyAble } from '../../components/helpers/generic-types';
import { getTsComponentFromResource } from '../../components/components';
import { TsExtractor } from '../extracting/ts.extractor';
import { setKeyInDict } from "../../components/helpers/dict-util";

export class TsCompiler implements IResourceProcessor {
    id: string = 'ts.compiler';

    protected tsExtractor: TsExtractor = new TsExtractor();

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return this.tsExtractor.canHandle(resource, config);
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        //console.log(`LOG: Compiling '${this.id}': ${resource.data?.document?.src}`);

        const component: FalsyAble<IInternalComponent> = await getTsComponentFromResource(resource, config);
        if (!component) {
            return resource;
        }

        let renderedResource: IProcessResource = await component.render(resource, config);

        if (typeof renderedResource === 'string') {
            renderedResource = {
                content: renderedResource
            };
        }

        /*
        //Removed as not allowed to be a 'string' when coming from an IInternalComponent
        if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }*/

        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        //dataResource = setHtmlOutputFormat(dataResource);
        //return addHandlerId(dataResource, 'compiler', this);

        setKeyInDict(renderedResource, 'data.document.outputFormat', 'html');
        return renderedResource;
    }
}