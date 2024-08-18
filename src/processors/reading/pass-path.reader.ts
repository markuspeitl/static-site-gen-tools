import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { getCleanExt, getFsNodeStat } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";

import * as fs from 'fs';
import path from 'path';
import { getResourceDoc } from "../shared/document-helpers";
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
        /*const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }*/

        const document: IResourceDoc = getResourceDoc(resource);
        console.log(`Reading ${this.id}: ${document.src}`);

        const resolvedPath: string = path.resolve(document.src);
        const fileExtension: string = getCleanExt(resolvedPath);
        setKeyInDict(resource, 'document.inputFormat', fileExtension);
        //setKeyInDict(resource, 'document.inputFormat', 'pass-path');
        resource.content = document.src;
        return resource;
    }
}