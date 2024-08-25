import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";

import { makeAbsolute } from "@markus/ts-node-util-mk1";
import { IWriteAbleResource, toWriteableResource } from "../shared/document-helpers";

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

        const targetFilePath = resource.target;
        if (!targetFilePath) {
            return false;
        }

        return true;
    }*/

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        /*if (!await this.canHandle(resource, config)) {
            return resource;
        }*/

        const writeResource: IWriteAbleResource | null = toWriteableResource(resource);
        if (!writeResource) {
            return resource;
        }

        console.log(`Writing ${this.id}: resource: ${writeResource.src} ---> n-th: ${FileWriter.fileWriteCounter} to path ${writeResource.target}`);
        console.log('file://' + makeAbsolute(writeResource.target));

        await fs.promises.mkdir(writeResource.targetParent, { recursive: true });

        await fs.promises.writeFile(
            writeResource.target,
            writeResource.content
        );
        FileWriter.fileWriteCounter++;

        return writeResource;

        //resource = addHandlerId(resource, 'writer', this);
        //return resource;
        /*let targetFilePath = .target;
        if (!targetFilePath) {
            return resource;
        }*/
    }
}