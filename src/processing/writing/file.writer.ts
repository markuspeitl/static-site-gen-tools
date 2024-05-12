import { DataParsedDocument } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { addHandlerId, addResourceDocProp, IResourceProcessor } from '../i-resource-processor';
import * as fs from 'fs';
import path from 'path';

export class FileReader implements IResourceProcessor {

    public id: string = 'file';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        if (typeof resource.content !== 'string') {
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

        const targetDir: string = path.dirname(targetFilePath);
        await fs.promises.mkdir(targetDir, { recursive: true });
        await fs.promises.writeFile(targetFilePath, resource.content);

        resource = addHandlerId(resource, 'writer', this);
        return resource;
    }

}