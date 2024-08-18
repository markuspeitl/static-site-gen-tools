import type { SsgConfig } from "../config";
import * as fs from 'fs';
import { DataFunction, DataToParsedDocumentOrString, DocumentData, ExtensiveComponent } from "./base-component";
import { curvyTemplate } from "@markus/ts-node-util-mk1";
import { IProcessResource } from "../pipeline/i-processor";

export function readFileFn(filePath: string): () => Promise<string> {
    return async () => {
        const fileContents: Buffer = await fs.promises.readFile(filePath);
        return fileContents.toString();
    };
}

const defaultFiles: Record<string, string> = {
    data: './data.json',
    style: './style.css',
    clientCode: './script.js',
    render: './index.html',
};
export abstract class StaticAssembledFileComponent implements ExtensiveComponent {
    public files: Record<string, string> = defaultFiles;

    public data: DocumentData | DataFunction;
    public style: DataToParsedDocumentOrString;
    public clientCode: DataToParsedDocumentOrString;
    public render: DataToParsedDocumentOrString;

    public constructor (files?: Record<string, string>) {
        if (files) {
            this.files = files;
        }

        this.data = readFileFn(this.files.data);
        this.style = readFileFn(this.files.style);
        this.clientCode = readFileFn(this.files.clientCode);
        this.render = readFileFn(this.files.render);
    }
}
/*public dataFile: string = './data.json';
public styleFile: string = './style.css';
public clientCodeFile: string = './script.js';
public renderFile: string = './index.html';*/

export function dataTemplateFn(templateString: string): DataToParsedDocumentOrString {
    const renderTemplateFn = async (resource: IProcessResource, config: SsgConfig) => {
        if (!resource) {
            resource = {};
        }
        if (!resource) {
            return templateString;
        }

        return curvyTemplate(templateString, resource);
    };
    return renderTemplateFn;
}