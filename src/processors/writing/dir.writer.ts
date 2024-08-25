import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { getResourceDoc, IWriteAbleResource, setTargetFromFormat, toWriteableResource } from "../shared/document-helpers";
import { ensureDir, getFsNodeStat, makeAbsolute, setKeyInDict, settleValueOrNull, filterFalsy } from '@markus/ts-node-util-mk1';

import path from "path";

export async function writeDirChildResourceAt(
    targetDirPath: string,
    compiledResource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    let overridePathPostfix: string | undefined = undefined;
    if (compiledResource.targetFormat === 'dir') {
        overridePathPostfix = '/';
    }
    setTargetFromFormat(
        compiledResource,
        undefined,
        targetDirPath,
        overridePathPostfix
    );

    const processedChildResource: IProcessResource = await config.processor.processStages(
        compiledResource,
        config,
        [ 'writer' ]
    );
    return processedChildResource;
}
export class DirWriter implements IResourceProcessor {

    public id: string = 'dir.writer';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        //Check should already be handled by stage guard match
        return true;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        /*const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }*/

        const writeResource: IWriteAbleResource | null = toWriteableResource(resource);
        if (!writeResource) {
            return resource;
        }

        console.log(`Writing ${this.id}: ${writeResource.src} --> ${writeResource.target}`);

        const dirCompiledResources: IProcessResource[] = resource.content;

        await ensureDir(writeResource.target);

        const writeResourcePromises: Promise<IProcessResource>[] = [];
        for (const dirFile of dirCompiledResources) {
            writeResourcePromises.push(
                writeDirChildResourceAt(writeResource.target, dirFile, config)
            );
        }

        //Inefficient to wait for the sub promises to finish --> optimize later
        //All descendant components are compiled in memory, before everything is collected and written to disk
        const processedResources: (IProcessResource | null)[] = await settleValueOrNull(writeResourcePromises);

        resource.content = filterFalsy(processedResources);
        //resource.id = undefined;
        //resource.document = undefined;

        return resource;
    }
}