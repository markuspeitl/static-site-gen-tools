import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { FalsyString, FalsyStringPromise, getCleanExt } from "@markus/ts-node-util-mk1";

import { getFsNodeStat } from "@markus/ts-node-util-mk1";
import { isDirPath, isPath } from "@markus/ts-node-util-mk1";
import { setKeyInDict } from "@markus/ts-node-util-mk1";

import * as fs from 'fs';
import path from 'path';
import { getReadableResource, getResourceDoc, IReadResource } from "../shared/document-helpers";
import { PassPathReader } from "./pass-path.reader";

export async function readFileAsString(filePath: string): FalsyStringPromise {

    if (!filePath) {
        return null;
    }

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const docFileBuffer: Buffer = await fs.promises.readFile(filePath);
    let docFileContent: string = docFileBuffer.toString();

    return docFileContent;
}

export class FileReader extends PassPathReader {

    public id: string = 'file.reader';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }

        //Resource was already read --> nothing to do here
        if (resource.content) {
            return false;
        }

        if (!isPath(resourceId)) {
            return false;
        }
        if (isDirPath(resourceId)) {
            return false;
        }
        const resolvedPath: string = path.resolve(resourceId);

        const stat: fs.Stats | null = await getFsNodeStat(resolvedPath);
        if (!stat) {
            return false;
        }
        if (stat.isFile()) {
            return true;
        }

        return false;

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

        const fileContents: FalsyString = await readFileAsString(readResource.src);
        readResource.content = fileContents;
        //resource = addHandlerId(resource, 'reader', this);
        //Mark resource as read --> resource is not processed by the 'reader' stage anymore
        //resource.id = undefined;
        return readResource;
    }
}