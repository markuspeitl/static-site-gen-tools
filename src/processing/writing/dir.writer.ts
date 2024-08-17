import path from "path";
import { SsgConfig } from "../../config";
import { IProcessResource, IResourceProcessor } from "../../pipeline/i-processor";
import { getResourceDoc, ResourceDoc } from "../shared/document-helpers";
import { ensureDir, getFsNodeStat, makeAbsolute, setKeyInDict, settleValueOrNull, filterFalsy } from '@markus/ts-node-util-mk1';

export class DirWriter implements IResourceProcessor {

    public id: string = 'dir.writer';

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
        const documentTarget: string = makeAbsolute(document.target);

        console.log(`Reading ${this.id}: ${documentSrc}`);
        const dirCompiledResources: IProcessResource[] = resource.content;

        await ensureDir(documentTarget);

        const writeResourcePromises: Promise<IProcessResource>[] = dirCompiledResources.map(async (compiledResource: IProcessResource) => {
            const processedChildResource: IProcessResource = await config.processor.processStages(compiledResource, config, [ 'writer' ]);
            return processedChildResource;
        });

        //Inefficient to wait for the sub promises to finish --> optimize later
        //All descendant components are compiled in memory, before everything is collected and written to disk
        const processedResources: (IProcessResource | null)[] = await settleValueOrNull(writeResourcePromises);

        resource.content = filterFalsy(processedResources);
        //resource.id = undefined;
        //resource.data.document = undefined;

        return resource;
    }
}