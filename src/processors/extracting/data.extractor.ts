import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc } from '../../processors/shared/i-processor-resource';
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
        //console.log(`LOG: Extracting '${this.id}': ${resource.document?.src}`);

        const document: IResourceDoc = getResourceDoc(resource);
        const documentSrc: string = document.src;

        const parsedData: any = await loadDataAsync(documentSrc);

        if (!resource) {
            resource = {};
        }

        Object.assign(resource, parsedData);

        setKeyInDict(resource, 'document.inputFormat', undefined);
        setKeyInDict(resource, 'document.outputFormat', undefined);
        return resource;
    }
}