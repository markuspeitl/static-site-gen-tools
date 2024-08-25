import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IGenericResource, IResourceProcessor } from "../../processing-tree/i-processor";

import { isDirPathOrDirectory, mapFilterRegexMatches } from "@markus/ts-node-util-mk1";
import { getReadableResource, getResourceDoc, IReadResource } from "../shared/document-helpers";
import path from 'path';

const dataFilePathRegexes: RegExp[] = [
    new RegExp(/^.+\.data\..+$/i),
    new RegExp(/^.+\.11tydata\..+$/i),
    new RegExp(/_data/i)
];

export class DirReader implements IResourceProcessor {

    public id: string = 'dir.reader';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        //Check should already be handled by stage guard match
        return true;
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
        /*if (!isDirPathOrDirectory(readResource.src)) {
            return resource;
        }*/

        console.log(`Extracting ${this.id}: ${readResource.src}`);
        const dirFiles: string[] = readResource.content;
        //const dirFiles: string[] = [];
        const dirDataFiles: string[] = mapFilterRegexMatches(
            dirFiles,
            dataFilePathRegexes,
            (dirPath: string) => path.basename(dirPath)
        );


        const extractDataPromises: Promise<IProcessResource>[] = [];

        for (let dirDataFile of dirDataFiles) {
            if (!path.isAbsolute(dirDataFile)) {
                dirDataFile = path.join(readResource.src, dirDataFile);
            }

            const extractSubResourcePromise: Promise<IProcessResource> = config.processor.forkProcessMergeBack(
                resource,
                config,
                [
                    'reader',
                    'extractor'
                ],
                {
                    id: 'dir-child__' + dirDataFile
                },
                //dataMergeExcludes
            );
            extractDataPromises.push(extractSubResourcePromise);
        }

        await Promise.all(extractDataPromises);

        return resource;
        //setKeyInDict(resource, '.targetFormat', 'dir');
    }
}