import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { isDirPathOrDirectory } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";

import * as fs from 'fs';
import path from 'path';
import { getReadableResource, getResourceDoc, IReadResource } from "../shared/document-helpers";

export class DirReader implements IResourceProcessor {

    public id: string = 'dir.reader';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }
        return isDirPathOrDirectory(resourceId);
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        /*const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }*/
        const readResource: IReadResource | null = getReadableResource(resource);
        if (!readResource) {
            return resource;
        }
        if (!isDirPathOrDirectory(readResource.src)) {
            return resource;
        }

        console.log(`Reading ${this.id}: ${readResource.src}`);
        //const resolvedPath: string = path.resolve(readResource.src);
        const dirFiles: string[] = await fs.promises.readdir(readResource.src);

        resource.srcFormat = 'dir';
        resource.content = dirFiles;

        return resource;

        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        //resource.id = undefined;


        /*const fsNodeProcessPromises: Promise<IProcessResource>[] = dirFiles.map(async (dirFile) => {
            const fsNodePath: string = path.join(resolvedPath, dirFile);
            //const targetNodePath: string = path.join(getTargetDirPath(resource), dirFile);

            const processedResource: IProcessResource = await config.processor.processDocumentTo(fsNodePath, getDocumentTargetSubPath(resource, dirFile), config);


            setKeyInDict(resource, '.processed', dirFile);
            return processedResource;
            //processResource();
        });

        const settledProcessPromises: PromiseSettledResult<IProcessResource>[] = await Promise.allSettled(fsNodeProcessPromises);*/
        //resource = addHandlerId(resource, 'reader', this);
    }
}