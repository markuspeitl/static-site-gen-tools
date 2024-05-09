import path from "path";
import { SsgConfig } from "../config";
import { CompileRunner, ResourceWriter, ResourceReader, DataParsedDocument, DocumentData, ResourceRunner } from "./runners";
import * as fs from 'fs';
import { FalsyAble, FalsyString, FalsyStringPromise } from "../components/helpers/generic-types";


export async function writeFileResource(compiledFileResource: FalsyAble<any>, config: SsgConfig): Promise<void> {

    if (!compiledFileResource) {
        return;
    }

    const targetId = compiledFileResource.data.target;
    if (!compiledFileResource.data.target) {
        return;
    }

    if (!targetId) {
        return;
    }

    let compiledResourceText: string | null = null;

    if (typeof compiledFileResource === 'object') {
        compiledResourceText = compiledFileResource.content;
    }
    else if (typeof compiledFileResource === 'string') {
        compiledResourceText = compiledFileResource;
    }

    if (!compiledResourceText) {
        return;
    }

    const targetDir: string = path.dirname(targetId);
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.writeFile(targetId, compiledResourceText);

    return;
}

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


export async function readFileResource(resourceId: string, config: SsgConfig): FalsyStringPromise {
    return readFileAsString(resourceId);
}

//CompileRunner, ResourceWriter, 
export abstract class FileRunner implements ResourceRunner {
    public async readResource(resourceId: string, config: SsgConfig): FalsyStringPromise {
        return readFileResource(resourceId, config);
    }

    abstract extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
    abstract compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;

    public async writeResource(compiledResource: any, config: SsgConfig): Promise<void> {
        return writeFileResource(compiledResource, config);
    }
}