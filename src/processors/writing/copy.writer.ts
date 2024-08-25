import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { ensureFileDir, type FalsyStringPromise } from "@markus/ts-node-util-mk1";
import { getResourceDoc, IWriteAbleResource, toWriteableResource } from "../shared/document-helpers";

import * as fs from 'fs';
import path from 'path';


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

export class CopyWriter implements IResourceProcessor {

    public id: string = 'copy.writer';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {

        
        if (resource.target && .src) {
            return true;
        }
        return false;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        /*const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }*/

        const writeResource: IWriteAbleResource | null = toWriteableResource(resource);
        if (!writeResource || !writeResource.src) {
            return resource;
        }

        console.log(`Writing ${this.id}: ${writeResource.src} --> ${writeResource.target}`);
        //resource = addHandlerId(resource, 'writer', this);

        const resolvedTarget: string = path.resolve(writeResource.target);
        const cwd: string = process.cwd();

        if (!resolvedTarget.startsWith(cwd)) {
            console.error("Asset write target is not a subdirectory of process.cwd --> skipping write to prevent accidental overwrites");
            return resource;
        }

        ensureFileDir(resolvedTarget);

        //https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
        await fs.promises.cp(writeResource.src, resolvedTarget);

        return resource;
    }
}