import path from "path";
import { CompileRunner, DataParsedDocument, DocumentData, findRunnerInstanceFor, ResourceRunner, ResourceWriter, setDefaultRunnerInstantiatorsFromFiles } from "./compilers/runners";
import { SsgConfig } from "./config";
import { FalsyAble, FalsyStringPromise } from "./utils/util";
import * as fs from 'fs';
import { getDataExtractedDocOfData } from "./data-extract";

export function packIntoDataOpt(data: any, packIfMissingObj: any): Record<string, any> {
    if (!data) {
        return {};
    }

    for (const key in packIfMissingObj) {
        const currentElement = packIfMissingObj[ key ];
        if (!data[ key ]) {
            data[ key ] = packIfMissingObj[ key ];
        }
    }

    return data;
}
export function unpackDataProps(data: any, dataToResultKeys: any): any {
    const result = {};
    for (const key in dataToResultKeys) {
        const targetKey = dataToResultKeys[ key ];
        const srcValue = data[ key ];
        result[ targetKey ] = srcValue;
    }
    return result;
}

export async function readResource(resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {
    data = packIntoDataOpt(data, {
        target: targetId,
        src: resourceId
    });

    //let resourceId: string | null = null;
    /*if (!resourceId) {
        if (data.src) {
            resourceId = data.src;
        }
        if (data.target) {
            targetId = data.target;
        }    
    }*/

    /*const { resourceId, targetId } = unpackDataProps(data, {
        'src': 'resourceId',
        'target': 'targetId'
    });*/

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(data.src, config);

    if (compileRunner && (compileRunner as ResourceRunner).readResource) {
        return (compileRunner as ResourceRunner).readResource(data.src, targetId, config);
    }
}

export async function writeResource(compiledResult: FalsyAble<DataParsedDocument>, resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {
    data = packIntoDataOpt(data, {
        target: targetId,
        src: resourceId
    });

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(data.src, config);

    if (compiledResult && compileRunner && (compileRunner as ResourceRunner).writeResource) {
        //return (compileRunner as ResourceRunner).readResource(resourceId, targetId, config);

        //let resourceId: string | null = null;
        /*if (compiledResult.src || data.src) {
            resourceId = compiledResult.src || data.src;
        }

        if (compiledResult.target || data.target) {
            targetId = compiledResult.target || data.target;
        }*/

        if (!compiledResult.data) {
            compiledResult.data = {};
        }

        const afterCompileData: DocumentData = compiledResult.data;
        const mergedAfterCompile: DocumentData = Object.assign(data, afterCompileData);

        (compileRunner as ResourceRunner).writeResource(compiledResult, mergedAfterCompile.src, mergedAfterCompile.target, config);
    }

    return compiledResult;
}


export function mergeDataDoc(input: DataParsedDocument | string, dataDoc: DataParsedDocument | any): DataParsedDocument {

    //Todo should handle 'input' already being a DataParsedDocument as well
    return getDataExtractedDocOfData(dataDoc, input as string);
}

export async function compileResource(resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {

    packIntoDataOpt(data, {
        target: targetId,
        src: resourceId
    });

    await setDefaultRunnerInstantiatorsFromFiles(config);

    let toCompileResourceContents: any = await readResource(resourceId, targetId, data, config);

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resourceId, config);

    const contentAndData: DocumentData | DataParsedDocument | null | undefined = await compileRunner?.extractData(toCompileResourceContents, data, config);

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

    const compiledResource: any = await compileResource(resourceId, targetId, data, config);
    return compiledResource;
}