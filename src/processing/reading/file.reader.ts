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

export class FileReader implements IResourceProcessor {

    public id: string = 'file';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
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

    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        const resolvedPath: string = path.resolve(resourceId);
        const parsedPath: path.ParsedPath = path.parse(resolvedPath);
        const fileContents: FalsyString = await readFileAsString(resolvedPath);

        let fileExtension = parsedPath.ext;
        if (fileExtension.startsWith('.')) {
            fileExtension = fileExtension.slice(1);
        }

        resource = addResourceDocProp(
            resource,
            {
                inputFormat: fileExtension,
            }
        );
        resource.content = fileContents;

        resource = addHandlerId(resource, 'reader', this);
        return resource;
    }

}