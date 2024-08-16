import path from "path";
import { SsgConfig } from "../../config";
import { IProcessResource, IResourceProcessor } from "../../pipeline/i-processor";
import { getResourceDoc, ResourceDoc } from "../shared/document-helpers";
import { processStagesOnInputPath } from "../../processing-tree-wrapper";
import { filterFalsy, setKeyInDict, settleValueOrNull } from "@markus/ts-node-util-mk1";

export class DirCompiler implements IResourceProcessor {

    public id: string = 'dir.compiler';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        //Check should already be handled by stage guard match
        return true;
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        const document: ResourceDoc = getResourceDoc(resource);
        const documentSrc: string = document.src;

        console.log(`Reading ${this.id}: ${documentSrc}`);
        const dirFiles: string[] = resource.content;
        const resourceData: any = resource.data;

        const subDocProcessPromises: Promise<IProcessResource>[] = dirFiles.map(async (dirFile) => {
            const subDocNodePath: string = path.join(documentSrc, dirFile);
            const processedChildResource: IProcessResource = await processStagesOnInputPath(subDocNodePath, config, [ 'reader', 'extractor', 'compiler' ]);
            //setKeyInDict(resource, 'document.processed', dirFile);
            return processedChildResource;
        });

        //Inefficient to wait for the sub promises to finish --> optimize later
        const processedResources: (IProcessResource | null)[] = await settleValueOrNull(subDocProcessPromises);

        resource.content = filterFalsy(processedResources);

        setKeyInDict(resource, 'data.document.outputFormat', 'dir');

        //Currently workaround for writing
        resource.id = 'dir';

        return resource;
    }
}