import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import * as fs from 'fs';
import path from 'path';
import { isDirPathOrDirectory } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";

export class DirReader implements IResourceProcessor {

    public id: string = 'dir.reader';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }
        return isDirPathOrDirectory(resourceId);
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        if (!resource.data) {
            resource.data = {};
        }
        if (!resource.data.document) {
            resource.data.document = {};
        }

        console.log(`Reading ${this.id}: ${resource.data?.document?.src}`);

        const resolvedPath: string = path.resolve(resourceId);
        const dirFiles: string[] = await fs.promises.readdir(resolvedPath);
        setKeyInDict(resource, 'data.document.inputFormat', 'dir');
        resource.content = dirFiles;

        return resource;

        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        //resource.id = undefined;


        /*const fsNodeProcessPromises: Promise<IProcessResource>[] = dirFiles.map(async (dirFile) => {
            const fsNodePath: string = path.join(resolvedPath, dirFile);
            //const targetNodePath: string = path.join(getTargetDirPath(resource), dirFile);

            const processedResource: IProcessResource = await config.processor.processDocumentTo(fsNodePath, getDocumentTargetSubPath(resource, dirFile), config);


            setKeyInDict(resource, 'document.processed', dirFile);
            return processedResource;
            //processResource();
        });

        const settledProcessPromises: PromiseSettledResult<IProcessResource>[] = await Promise.allSettled(fsNodeProcessPromises);*/
        //resource = addHandlerId(resource, 'reader', this);
    }
}