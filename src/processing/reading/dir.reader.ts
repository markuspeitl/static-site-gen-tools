import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { addHandlerId, addResourceDocProp, IResourceProcessor } from '../i-resource-processor';
import * as fs from 'fs';
import { isDirPath, isPath, possibleDirPath } from '../../compilers/resolve-sub-html.runner';
import path from 'path';
import { getFsNodeStat } from '../../utils/fs-util';
import { processFsNodeAtPath, processStage } from '../process-resource';


export function getTargetDirPath(resource: DataParsedDocument): string | null {
    if (!resource.data?.document?.target) {
        return null;
    }

    return path.resolve(resource.data.document.target);
}
export function getSubPathAtTarget(resource: DataParsedDocument, relativePath: string): string | null {

    const targetDirPath: string | null = getTargetDirPath(resource);
    if (!targetDirPath) {
        return null;
    }

    return path.join(targetDirPath, relativePath);
}

export class DirReader implements IResourceProcessor {

    public id: string = 'dir';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
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
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
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


        const fsNodeProcessPromises: Promise<DataParsedDocument>[] = dirFiles.map(async (dirFile) => {
            const fsNodePath: string = path.join(resolvedPath, dirFile);
            //const targetNodePath: string = path.join(getTargetDirPath(resource), dirFile);

            const processedResource: DataParsedDocument = await processFsNodeAtPath(fsNodePath, getSubPathAtTarget(resource, dirFile), config);

            resource = addResourceDocProp(
                resource,
                {
                    processed: dirFile,
                }
            );

            return processedResource;
            //processResource();
        });

        const settledProcessPromises: PromiseSettledResult<DataParsedDocument>[] = await Promise.allSettled(fsNodeProcessPromises);


        /*for (const dirFile of dirFiles) {
            const fsNodePath: string = path.join(resolvedPath, dirFile);
            //const targetNodePath: string = path.join(getTargetDirPath(resource), dirFile);

            processFsNodeAtPath(fsNodePath, getSubPathAtTarget(resource, dirFile), config);
            //processResource();
        }*/


        resource = addResourceDocProp(
            resource,
            {
                inputFormat: 'dir',
            }
        );
        resource.content = dirFiles;

        resource = addHandlerId(resource, 'reader', this);

        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        resource.id = undefined;
        return resource;
    }
}