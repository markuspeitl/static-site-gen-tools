import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import * as fs from 'fs';
import path from 'path';
import { getCleanExt, getFsNodeStat } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";

export class PassPathReader implements IResourceProcessor {

    public id: string = 'pass-path.reader';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
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
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        console.log(`Reading ${this.id}: ${resource.document?.src}`);

        const resolvedPath: string = path.resolve(resourceId);
        const fileExtension: string = getCleanExt(resolvedPath);
        setKeyInDict(resource, 'data.document.inputFormat', fileExtension);
        //setKeyInDict(resource, 'data.document.inputFormat', 'pass-path');
        resource.content = resourceId;
        return resource;
    }
}