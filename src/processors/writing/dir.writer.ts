import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc } from "../../processors/shared/i-processor-resource";
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { getResourceDoc, setTargetFromFormat } from "../shared/document-helpers";
import { ensureDir, getFsNodeStat, makeAbsolute, setKeyInDict, settleValueOrNull, filterFalsy } from '@markus/ts-node-util-mk1';

import path from "path";

export async function writeDirChildResourceAt(
    targetDirPath: string,
    compiledResource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    const compiledSubResourceDoc: IResourceDoc = getResourceDoc(compiledResource);

    let overridePathPostfix: string | undefined = undefined;
    if (compiledSubResourceDoc.outputFormat === 'dir') {
        overridePathPostfix = '/';
    }
    setTargetFromFormat(
        compiledSubResourceDoc,
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
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        const document: IResourceDoc = getResourceDoc(resource);
        const documentSrc: string = document.src;
        //const documentTarget: string = makeAbsolute(document.target);
        const dirDocumentTarget: string = document.target;

        console.log(`Writing ${this.id}: ${documentSrc} --> ${dirDocumentTarget}`);
        const dirCompiledResources: IProcessResource[] = resource.content;

        await ensureDir(dirDocumentTarget);

        const writeResourcePromises: Promise<IProcessResource>[] = [];
        for (const dirFile of dirCompiledResources) {
            writeResourcePromises.push(
                writeDirChildResourceAt(documentSrc, dirFile, config)
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