import path from "path";
import { SsgConfig } from "../config";
import { FalsyAble, FalsyString, FalsyStringPromise } from "../utils/util";
import { CompileRunner, ResourceWriter, ResourceReader, DataParsedDocument, DocumentData, ResourceRunner } from "./runners";
import * as fs from 'fs';


export async function writeFileResource(compiledFileResource: FalsyAble<any>, resourceId: FalsyString, targetId: string, config: SsgConfig): Promise<void> {

    if (!compiledFileResource) {
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


export async function readFileResource(resourceId: string, targetId: string, config: SsgConfig): FalsyStringPromise {
    return readFileAsString(resourceId);
}

//CompileRunner, ResourceWriter, 
export abstract class FileRunner implements ResourceRunner {
    public async readResource(resourceId: string, targetId: string, config: SsgConfig): FalsyStringPromise {
        return readFileResource(resourceId, targetId, config);
    }

    abstract extractData(fileContent: string, config?: SsgConfig | undefined): Promise<DocumentData | DataParsedDocument | null>;
    abstract compile(fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: SsgConfig | undefined): Promise<FalsyAble<DataParsedDocument>>;

    public async writeResource(compiledResource: any, resourceId: FalsyString, targetId: string, config: SsgConfig): Promise<void> {
        return writeFileResource(compiledResource, resourceId, targetId, config);
    }
}