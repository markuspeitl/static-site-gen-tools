import { getCleanExt } from "@markus/ts-node-util-mk1";
import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceDoc, IResourceProcessor } from '../../processing-tree/i-processor';
import * as fs from 'fs';
import path from 'path';
import { getResourceDoc, setTargetFromFormat } from "../shared/document-helpers";

export class FileWriter implements IResourceProcessor {

    public id: string = 'file.writer';

    protected static fileWriteCounter: number = 0;

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        if (!resource.content || typeof resource.content !== 'string') {
            return false;
        }
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return false;
        }

        /*const targetFilePath = resource.document?.target;
        if (!targetFilePath) {
            return false;
        }*/

        return true;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise < IProcessResource > {

    if(!await this.canHandle(resource, config)) {
    return resource;
}
const document: IResourceDoc = getResourceDoc(resource);

setTargetFromFormat(document);
const targetDir = path.dirname(document.target);

console.log(`Writing ${this.id}: resource: ${resource?.id} ---> n-th: ${FileWriter.fileWriteCounter} to path ${document.target}`);
FileWriter.fileWriteCounter++;

await fs.promises.mkdir(targetDir, { recursive: true });

await fs.promises.writeFile(
    document.target,
    resource.content
);

return resource;

        //resource = addHandlerId(resource, 'writer', this);
        //return resource;
        /*let targetFilePath = document.target;
        if (!targetFilePath) {
            return resource;
        }*/
    }
}