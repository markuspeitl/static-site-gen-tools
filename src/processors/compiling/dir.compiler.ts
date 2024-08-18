import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc } from '../../processors/shared/i-processor-resource';
import type { IProcessingNode, IResourceProcessor } from "../../processing-tree/i-processor";

import { getResourceDoc } from "../shared/document-helpers";
import { filterFalsy, setKeyInDict, settleValueOrNull } from "@markus/ts-node-util-mk1";

import path from "path";
export class DirCompiler implements IResourceProcessor {

    public id: string = 'dir.compiler';

    /*/*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        //Check should already be handled by stage guard match
        return true;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        const document: IResourceDoc = getResourceDoc(resource);
        const documentSrc: string = document.src;
        const documentTarget: string = document.target;

        console.log(`Reading ${this.id}: ${documentSrc}`);
        const dirFiles: string[] = resource.content;
        const resourceData: any = resource;

        const subDocProcessPromises: Promise<IProcessResource>[] = dirFiles.map(async (dirFile) => {
            const srcSubDocPath: string = path.join(documentSrc, dirFile);
            //const targetSubDocPath: string = path.join(documentTarget, dirFile);

            const processedChildResource: IProcessResource = await config.processor.processDocument(
                srcSubDocPath,
                //undefined,
                config,
                [
                    'reader',
                    'extractor',
                    'compiler'
                ]
            );
            //setKeyInDict(resource, 'document.processed', dirFile);
            return processedChildResource;
        });

        //Inefficient to wait for the sub promises to finish --> optimize later
        const processedResources: (IProcessResource | null)[] = await settleValueOrNull(subDocProcessPromises);

        resource.content = filterFalsy(processedResources);

        setKeyInDict(resource, 'document.outputFormat', 'dir');

        //Currently workaround for writing
        resource.id = 'dir';

        return resource;
    }
}