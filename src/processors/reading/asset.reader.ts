import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { getCleanExt, getFsNodeStat } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";
import { getReadableResource, getResourceDoc, IReadResource } from "../shared/document-helpers";

import * as fs from 'fs';
import path from 'path';
import { PassPathReader } from "./pass-path.reader";
export class AssetReader extends PassPathReader {

    public id: string = 'asset.reader';

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

        const readResource: IReadResource | null = getReadableResource(resource);
        if (!readResource) {
            return resource;
        }
        readResource.srcFormat = 'asset';
        readResource.targetFormat = getCleanExt(readResource.src);

        /*
        console.log(`Reading ${this.id}: ${.src}`);
        //const resolvedPath: string = path.resolve(resourceId);
        //const parsedPath: path.ParsedPath = path.parse(resolvedPath);

        setKeyInDict(resource, '.inputFormat', 'asset');
        resource.targetFormat = getCleanExt(resource.src);
        resource.targetFormat = getCleanExt(resource.src);
        //setKeyInDict(resource, '.targetFormat', 'asset');
        setKeyInDict(resource, '.targetFormat', getCleanExt(resource.src));*/

        //resource = addHandlerId(resource, 'reader', this);
        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        //resource.id = undefined;
        return readResource;
    }
}