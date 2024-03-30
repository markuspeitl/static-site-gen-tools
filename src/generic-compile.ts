import path from "path";
import { CompileRunner, DataParsedDocument, DocumentData, findRunnerInstanceFor, ResourceRunner, ResourceWriter, setDefaultRunnerInstantiatorsFromFiles } from "./compilers/runners";
import { SsgConfig } from "./config";
import { FalsyAble, FalsyStringPromise } from "./utils/util";
import * as fs from 'fs';
import { getDataExtractedDocOfData } from "./data-extract";



export async function readResource(resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {

    if (!data) {
        data = {};
    }
    //let resourceId: string | null = null;
    if (data.src) {
        resourceId = data.src;
    }

    if (data.target) {
        targetId = data.target;
    }

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resourceId, config);

    if (compileRunner && (compileRunner as ResourceRunner).readResource) {
        return (compileRunner as ResourceRunner).readResource(resourceId, targetId, config);
    }
}

export async function writeResource(compiledResult: any, resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resourceId, config);

    if (compiledResult && compileRunner && (compileRunner as ResourceRunner).writeResource) {
        //return (compileRunner as ResourceRunner).readResource(resourceId, targetId, config);

        if (!data) {
            data = {};
        }
        //let resourceId: string | null = null;
        if (compiledResult.src || data.src) {
            resourceId = compiledResult.src || data.src;
        }

        if (compiledResult.target || data.target) {
            targetId = compiledResult.target || data.target;
        }

        (compileRunner as ResourceRunner).writeResource(compiledResult, resourceId, targetId, config);
    }

    return compiledResult;
}


export function mergeDataDoc(input: DataParsedDocument | string, dataDoc: DataParsedDocument | any): DataParsedDocument {

    //Todo should handle 'input' already being a DataParsedDocument as well
    return getDataExtractedDocOfData(dataDoc, input as string);
}

export async function compileResource(resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {
    await setDefaultRunnerInstantiatorsFromFiles(config);

    let toCompileResourceContents: any = await readResource(resourceId, targetId, data, config);

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resourceId, config);

    const contentAndData: DocumentData | DataParsedDocument | null | undefined = await compileRunner?.extractData(toCompileResourceContents, config);

    toCompileResourceContents = mergeDataDoc(toCompileResourceContents, contentAndData);

    const compiledResult = await compileRunner?.compile(toCompileResourceContents, data, config);

    //this await can be removed in production
    await writeResource(compiledResult, resourceId, targetId, data, config);

    return compiledResult;
}

/*export function getResourceWriter(compiledResource: any): ResourceWriter {
    throw new Error('Not implemented');
}*/

export async function compileResourceTo(resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {

    if (!data) {
        data = {};
    }
    if (!data.target) {
        data.target = targetId;
    }
    if (!data.src) {
        data.src = resourceId;
    }

    const compiledResource: any = await compileResource(resourceId, targetId, data, config);
    return compiledResource;
}