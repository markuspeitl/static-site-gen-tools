import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IInternalComponent } from '../../components/base/i-component';
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import type { IResourceProcessor, ProcessFunction } from "../../processing-tree/i-processor";
import { setKeyInDict } from "@markus/ts-node-util-mk1";
import { getComponentFromResource } from "../../components/load-components";

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

        const component: FalsyAble<IInternalComponent> = await getComponentFromResource(resource, config);
        return component;
    }

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return Boolean(await this.getComponentCompiler(resource, config));
    }*/


    public async process(
        resource: IProcessResource,
        config: SsgConfig,
        componentProcessingFnKey: string = 'render',
        targetFormat: string = 'html'
    ): Promise<IProcessResource> {
        console.log(`Apply ts processor '${componentProcessingFnKey}' on -- '${this.id}': ${resource.src}`);

        const component: FalsyAble<IInternalComponent> = await this.getComponentCompiler(resource, config);
        if (!component) {
            return resource;
        }

        const componentResourceProcFn: ProcessFunction = component[ componentProcessingFnKey ];
        let processedResource: FalsyAble<IProcessResource> = await componentResourceProcFn(resource, config);
        if (!processedResource) {
            return resource;
        }

        resource.targetFormat = 'html';

        if (componentProcessingFnKey === 'data') {

            //processedResource.parent = 

            //As the component 'data' fn might return a completely new data dict
            //Object.assign(resource, processedResource);
            return processedResource;
        }

        /*if (typeof dataResource === 'string') {
            dataResource = Object.assign(forkResourceScope(resource), { content: dataResource });
        }*/
        //The data is different here, as it only contains parsed data,
        // --> Data merging needs to be performed here, or at the caller!

        /*if (typeof processedResource === 'string') {
            processedResource = {
                content: processedResource
            };
        }*/
        //Object.assign(resource, processedResource);

        /*if (componentProcessingFnKey === 'render') {
            resource.content = processedResource.content;
            return resource;
        }*/

        return processedResource;
        //return processedResource;
    }
}