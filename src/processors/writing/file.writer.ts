import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceDoc } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { getCleanExt, makeAbsolute } from "@markus/ts-node-util-mk1";
import { getResourceDoc, setTargetFromFormat } from "../shared/document-helpers";

import * as fs from 'fs';
import path from 'path';


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

        const targetFilePath = resource.document?.target;
        if (!targetFilePath) {
            return false;
        }

        return true;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        /*if (!await this.canHandle(resource, config)) {
            return resource;
        }*/
        const document: IResourceDoc = getResourceDoc(resource);

        console.log(`Writing ${this.id}: resource: ${document.src} ---> n-th: ${FileWriter.fileWriteCounter} to path ${document.target}`);
        console.log('file://' + makeAbsolute(document.target));

        setTargetFromFormat(document);
        const targetDir = path.dirname(document.target);

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