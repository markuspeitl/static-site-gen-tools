import { DocumentData } from "../compilers/runners";
import { SsgConfig } from "../config";
import { DataFunction, DataToParsedDocumentOrString, ExtensiveComponent } from "./base-component";
import * as fs from 'fs';
import { curvyTemplate } from "./helpers/pre-process";

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
    const renderTemplateFn = async (dataCtx?: DocumentData | null, config?: SsgConfig) => {
        if (!dataCtx) {
            dataCtx = {};
        }
        return curvyTemplate(templateString, dataCtx);
    };
    return renderTemplateFn;
}