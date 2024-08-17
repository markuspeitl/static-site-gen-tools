import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor, ProcessFunction } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import { loadDataAsync, setKeyInDict } from "@markus/ts-node-util-mk1";
import { getTsComponentFromResource } from "../../components/components";
import { getResourceDoc, ResourceDoc } from "../shared/document-helpers";

export abstract class DataExtractor implements IResourceProcessor {
    id: string = 'data.extractor';


    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return true;
    }

    public async process(
        resource: IProcessResource,
        config: SsgConfig,
        //componentProcessingFnKey: string = 'render',
        //outputFormat: string = 'html'
    ): Promise<IProcessResource> {
        //console.log(`LOG: Extracting '${this.id}': ${resource.data?.document?.src}`);

        const document: ResourceDoc = getResourceDoc(resource);
        const documentSrc: string = document.src;

        const parsedData: any = await loadDataAsync(documentSrc);

        if (!resource.data) {
            resource.data = {};
        }

        Object.assign(resource.data, parsedData);

        setKeyInDict(resource, 'data.document.inputFormat', undefined);
        setKeyInDict(resource, 'data.document.outputFormat', undefined);
        return resource;
    }
}