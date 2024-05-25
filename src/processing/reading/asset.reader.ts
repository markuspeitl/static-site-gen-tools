import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { addHandlerId, addResourceDocProp } from '../i-resource-processor';
import * as fs from 'fs';
import path from 'path';
import { getFsNodeStat } from '../../utils/fs-util';
import { IResourceProcessor } from '../../pipeline/i-processor';

export class FileReader implements IResourceProcessor {

    public id: string = 'asset.reader';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }
        const resolvedPath: string = path.resolve(resourceId);

        const stat: fs.Stats | null = await getFsNodeStat(resolvedPath);
        if (!stat) {
            return false;
        }
        return true;

    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        console.log(`Reading ${this.id}: ${resource.data?.document?.src}`);
        //const resolvedPath: string = path.resolve(resourceId);
        //const parsedPath: path.ParsedPath = path.parse(resolvedPath);

        resource = addResourceDocProp(
            resource,
            {
                inputFormat: 'asset',
                outputFormat: 'asset',
            }
        );
        resource = addHandlerId(resource, 'reader', this);

        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        resource.id = undefined;
        return resource;
    }
}