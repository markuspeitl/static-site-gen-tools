import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import * as fs from 'fs';
import path from 'path';
import { getFsNodeStat } from '../../utils/fs-util';
import { setKeyInDict } from "../../components/helpers/dict-util";

export class FileReader implements IResourceProcessor {

    public id: string = 'asset.reader';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
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
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        console.log(`Reading ${this.id}: ${resource.data?.document?.src}`);
        //const resolvedPath: string = path.resolve(resourceId);
        //const parsedPath: path.ParsedPath = path.parse(resolvedPath);

        setKeyInDict(resource, 'data.document.inputFormat', 'asset');
        setKeyInDict(resource, 'data.document.outputFormat', 'asset');

        //resource = addHandlerId(resource, 'reader', this);
        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        //resource.id = undefined;
        return resource;
    }
}