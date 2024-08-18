import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc, IResourceProcessor, ProcessFunction } from '../../processors/shared/i-processor-resource';
import type { IInternalComponent } from '../../components/base/i-component';
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import { loadDataAsync, setKeyInDict } from "@markus/ts-node-util-mk1";
import { getTsComponentFromResource } from "../../components/components-loading";
import { getResourceDoc } from "../shared/document-helpers";

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

        setKeyInDict(resource, 'data.document.inputFormat', undefined);
        setKeyInDict(resource, 'data.document.outputFormat', undefined);
        return resource;
    }
}