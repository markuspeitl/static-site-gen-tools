import { DataParsedDocument } from '../../compilers/runners';
import { FalsyString, FalsyStringPromise } from '../../components/helpers/generic-types';
import { SsgConfig } from '../../config';
import { addHandlerId, addResourceDocProp, IResourceProcessor } from '../i-resource-processor';
import * as fs from 'fs';
import { isDirPath, isPath } from '../../compilers/resolve-sub-html.runner';
import path from 'path';
import { getFsNodeStat } from '../../utils/fs-util';


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

    public id: string = 'copy';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {

        if (resource.data?.document?.target && resource.data?.document?.src) {
            return true;
        }
        return false;
    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
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