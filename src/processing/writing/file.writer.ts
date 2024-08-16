import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import * as fs from 'fs';
import path from 'path';

export class FileWriter implements IResourceProcessor {

    public id: string = 'file.writer';

    protected static fileWriteCounter: number = 0;

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
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
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        if (!await this.canHandle(resource, config)) {
            return resource;
        }


        let targetFilePath = resource.data?.document?.target;
        if (!targetFilePath) {
            return resource;
        }

        console.log(`Writing ${this.id}: resource: ${resource?.id} ---> n-th: ${FileWriter.fileWriteCounter} to path ${targetFilePath}`);
        FileWriter.fileWriteCounter++;


        const parsedTargetPath: path.ParsedPath = path.parse(targetFilePath);
        const targetDir: string = parsedTargetPath.dir;

        let cleanExtension = parsedTargetPath.ext;
        if (cleanExtension) {
            cleanExtension = cleanExtension.slice(1);
        }
        const outputFormat = resource.data?.document?.outputFormat;

        if (outputFormat && outputFormat !== cleanExtension) {
            targetFilePath = path.join(targetDir, parsedTargetPath.name + '.' + outputFormat);
        }


        await fs.promises.mkdir(targetDir, { recursive: true });

        await fs.promises.writeFile(targetFilePath, resource.content);

        //resource = addHandlerId(resource, 'writer', this);
        //return resource;
        return resource;
    }
}