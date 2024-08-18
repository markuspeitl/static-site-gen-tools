import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc, IResourceProcessor } from '../../processors/shared/i-processor-resource';
import { ensureFileDir, type FalsyStringPromise } from "@markus/ts-node-util-mk1";
import * as fs from 'fs';
import path from 'path';
import { getResourceDoc } from "../shared/document-helpers";


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

        const document: IResourceDoc = getResourceDoc(resource);
        if (document.target && document.src) {
            return true;
        }
        return false;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }

        const document: IResourceDoc = getResourceDoc(resource);
        console.log(`Writing ${this.id}: ${document.src} --> ${document.target}`);
        //resource = addHandlerId(resource, 'writer', this);

        const targetPath: string | null = document.target;
        const srcPath: string | null = document.src;

        if (srcPath && targetPath) {

            const resolvedTarget: string = path.resolve(targetPath);
            const cwd: string = process.cwd();

            if (!resolvedTarget.startsWith(cwd)) {
                console.error("Asset write target is not a subdirectory of process.cwd --> skipping write to prevent accidental overwrites");
                return resource;
            }

            ensureFileDir(resolvedTarget);

            //https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
            await fs.promises.cp(srcPath, resolvedTarget);
        }

        return resource;
    }
}