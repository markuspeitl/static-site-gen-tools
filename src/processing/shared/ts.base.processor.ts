import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor, ProcessFunction } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";
import { getTsComponentFromResource } from "../../components/components";

export abstract class TsBaseProcessor implements IResourceProcessor {
    abstract id: string;
    //id: string = 'ts.extractor';

    public async getComponentCompiler(resource: IProcessResource, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {

        const resourceContent: string | undefined = resource.content?.trim();

        const isTsFileTarget = Boolean(resource.id && resource.id.endsWith('.ts'));
        const hasTsContent = Boolean(resourceContent);

        if (!isTsFileTarget && !hasTsContent) {
            return null;
        }

        /*if (typeof resource.content !== 'string') {
            return null;
        }

        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }*/
        //if (resourceContent.includes('export ')) {
        /*const module = await getTsModule(resourceContent, null, config.tsModulesCache);
        if (module) {
            return true;
        }*/

        const component: FalsyAble<IInternalComponent> = await getTsComponentFromResource(resource, config);
        return component;
    }

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return Boolean(await this.getComponentCompiler(resource, config));
    }*/


    public async process(
        resource: IProcessResource,
        config: SsgConfig,
        componentProcessingFnKey: string = 'render',
        outputFormat: string = 'html'
    ): Promise<IProcessResource> {
        //console.log(`LOG: Extracting '${this.id}': ${resource.document?.src}`);

        const component: FalsyAble<IInternalComponent> = await getTsComponentFromResource(resource, config);
        if (!component) {
            return resource;
        }

        const componentResourceProcFn: ProcessFunction = component[ componentProcessingFnKey ];
        let processedResource: IProcessResource = await componentResourceProcFn(resource, config);
        /*if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }*/
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        if (typeof processedResource === 'string') {
            processedResource = {
                content: processedResource
            };
        }

        setKeyInDict(resource, 'data.document.outputFormat', outputFormat);
        return processedResource;
    }
}