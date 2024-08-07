import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import * as fs from 'fs';
import path from 'path';
import { getFsNodeStat } from "@markus/ts-node-util-mk1";
import { isPath, possibleDirPath } from "@markus/ts-node-util-mk1";
import { processTreeFromToPath } from "../../processing-tree-wrapper";
import { setKeyInDict } from "@markus/ts-node-util-mk1";


export function getTargetDirPath(resource: IProcessResource): string | null {
    if (!resource.data?.document?.target) {
        return null;
    }

    return path.resolve(resource.data.document.target);
}
export function getSubPathAtTarget(resource: IProcessResource, relativePath: string): string | null {

    const targetDirPath: string | null = getTargetDirPath(resource);
    if (!targetDirPath) {
        return null;
    }

    return path.join(targetDirPath, relativePath);
}

export class DirReader implements IResourceProcessor {

    public id: string = 'dir.reader';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }

        if (!isPath(resourceId)) {
            return false;
        }
        if (!possibleDirPath(resourceId)) {
            return false;
        }
        const resolvedPath: string = path.resolve(resourceId);

        const stat: fs.Stats | null = await getFsNodeStat(resolvedPath);
        if (!stat) {
            return false;
        }
        if (stat.isDirectory()) {
            return true;
        }

        return false;
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        console.log(`Reading ${this.id}: ${resource.data?.document?.src}`);

        if (!resource.data) {
            resource.data = {};
        }
        if (!resource.data.document) {
            resource.data.document = {};
        }

        const resolvedPath: string = path.resolve(resourceId);
        const dirFiles: string[] = await fs.promises.readdir(resolvedPath);


        const fsNodeProcessPromises: Promise<IProcessResource>[] = dirFiles.map(async (dirFile) => {
            const fsNodePath: string = path.join(resolvedPath, dirFile);
            //const targetNodePath: string = path.join(getTargetDirPath(resource), dirFile);

            const processedResource: IProcessResource = await processTreeFromToPath(fsNodePath, getSubPathAtTarget(resource, dirFile), config);


            setKeyInDict(resource, 'document.processed', dirFile);
            return processedResource;
            //processResource();
        });

        const settledProcessPromises: PromiseSettledResult<IProcessResource>[] = await Promise.allSettled(fsNodeProcessPromises);


        /*for (const dirFile of dirFiles) {
            const fsNodePath: string = path.join(resolvedPath, dirFile);
            //const targetNodePath: string = path.join(getTargetDirPath(resource), dirFile);

            processFsNodeAtPath(fsNodePath, getSubPathAtTarget(resource, dirFile), config);
            //processResource();
        }*/


        setKeyInDict(resource, 'data.document.inputFormat', 'dir');
        resource.content = dirFiles;
        //resource = addHandlerId(resource, 'reader', this);

        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        resource.id = undefined;
        return resource;
    }
}