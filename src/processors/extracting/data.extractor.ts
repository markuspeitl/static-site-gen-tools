import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";
import type { IInternalComponent } from '../../components/base/i-component';
import { getResourceDoc } from "../shared/document-helpers";

import type { FalsyAble } from "@markus/ts-node-util-mk1";
import { loadDataAsync, setKeyInDict } from "@markus/ts-node-util-mk1";



export abstract class DataExtractor implements IResourceProcessor {
    id: string = 'data.extractor';


    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return true;
    }*/

    public async process(
        resource: IProcessResource,
        config: SsgConfig,
        //componentProcessingFnKey: string = 'render',
        //outputFormat: string = 'html'
    ): Promise<IProcessResource> {
        //console.log(`LOG: Extracting '${this.id}': ${resource.src}`);

        if (!resource.src) {
            return resource;
        }

        const parsedData: any = await loadDataAsync(resource.src);

        Object.assign(resource, parsedData);

        //setKeyInDict(resource, 'resource.srcFormat', undefined);
        //setKeyInDict(resource, 'resource.targetFormat', undefined);

        return resource;
    }
}