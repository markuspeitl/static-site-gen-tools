import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { mapFilterRegexMatches } from "@markus/ts-node-util-mk1";
import { getResourceDoc } from "../shared/document-helpers";
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
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        const document: IResourceDoc = getResourceDoc(resource);
        const documentSrc: string = document.src;

        console.log(`Extracting ${this.id}: ${documentSrc}`);
        const dirFiles: string[] = resource.content;
        //const dirFiles: string[] = [];
        const dirDataFiles: string[] = mapFilterRegexMatches(
            dirFiles,
            dataFilePathRegexes,
            (dirPath: string) => path.basename(dirPath)
        );

        const resourceData: any = resource;

        for (let dirDataFile of dirDataFiles) {
            if (!path.isAbsolute(dirDataFile)) {
                dirDataFile = path.join(documentSrc, dirDataFile);
            }

            //TODO this should fork a sub resource from the current dir context data instead (these fns should also be on the config itself)
            //When cleaning the types it should be possible to write a processor without importing any external functionality
            const dataFileResource: IProcessResource = await config.processor.processDocument(dirDataFile, config, [ 'reader', 'extractor' ]);
            //Merge this or is assign enough
            delete dataFileResource.document;
            Object.assign(resourceData, dataFileResource.data);
        }

        return resource;

        //setKeyInDict(resource, 'data.document.outputFormat', 'dir');
    }
}