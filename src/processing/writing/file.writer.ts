import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { IResourceProcessor } from '../../pipeline/i-processor';
import { addHandlerId, addResourceDocProp } from '../i-resource-processor';
import * as fs from 'fs';
import path from 'path';

export class FileWriter implements IResourceProcessor {

    public id: string = 'file';

    protected fileWriteCounter: number = 0;

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (!resource.content || typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        const targetFilePath = resource.data?.document?.target;
        if (!targetFilePath) {
            return false;
        }

        return true;
    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {

        if (!await this.canHandle(resource, config)) {
            return resource;
        }


        const targetFilePath = resource.data?.document?.target;
        if (!targetFilePath) {
            return resource;
        }

        console.log(`Writing ${this.id}: resource: ${resource?.id} -- n-th: ${this.fileWriteCounter} to path ${targetFilePath}`);
        this.fileWriteCounter++;

        const targetDir: string = path.dirname(targetFilePath);
        await fs.promises.mkdir(targetDir, { recursive: true });
        await fs.promises.writeFile(targetFilePath, resource.content);

        resource = addHandlerId(resource, 'writer', this);
        return resource;
    }

}