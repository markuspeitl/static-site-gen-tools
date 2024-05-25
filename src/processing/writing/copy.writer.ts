import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import type { FalsyStringPromise } from '../../components/helpers/generic-types';
import { addHandlerId } from '../i-resource-processor';
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

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {

        if (resource.data?.document?.target && resource.data?.document?.src) {
            return true;
        }
        return false;
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        console.log(`Writing ${this.id}: ${resource.data?.document?.target}`);

        resource = addHandlerId(resource, 'writer', this);

        const targetPath: string | null = resource.data?.document?.target;
        const srcPath: string | null = resource.data?.document?.src;

        if (srcPath && targetPath) {

            const resolvedTarget: string = path.resolve(targetPath);
            const cwd: string = process.cwd();

            if (!resolvedTarget.startsWith(cwd)) {
                console.error("Asset write target is not a subdirectory of process.cwd --> skipping write to prevent accidental overwrites");
                return resource;
            }

            const targetDir: string = path.dirname(resolvedTarget);
            await fs.promises.mkdir(targetDir, { recursive: true });

            //https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
            await fs.promises.cp(srcPath, resolvedTarget);
        }

        return resource;
    }
}