import path from "path";
import { CompileRunner, DataParsedDocument, DocumentData, findRunnerInstanceFor, ResourceRunner, ResourceWriter, setDefaultRunnerInstantiatorsFromFiles } from "./compilers/runners";
import { SsgConfig } from "./config";
import { FalsyAble, FalsyString, FalsyStringPromise } from './components/helpers/generic-types';
import * as fs from 'fs';
import { getDataExtractedDocOfData } from "./data-extract";
import { packIntoDataOpt } from "./components/helpers/dict-util";

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
        return (compileRunner as ResourceRunner).readResource(data.src, config);
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


export function getAsDataParsedDocument(input: DataParsedDocument | string, dataDoc: DataParsedDocument | any): DataParsedDocument {

    //Todo should handle 'input' already being a DataParsedDocument as well
    return getDataExtractedDocOfData(dataDoc, input as string);
}

export async function compileResource(resourceId: string, targetId: string, data: FalsyAble<DocumentData>, config: SsgConfig = {}): Promise<any> {

    packIntoDataOpt(data, {
        src: resourceId,
        target: targetId,
    });

    await setDefaultRunnerInstantiatorsFromFiles(config);

    let readResourceContents: any = await readResource(resourceId, targetId, data, config);

    const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resourceId, config);

    const contentAndData: DocumentData | DataParsedDocument | null | undefined = await compileRunner?.extractData(readResourceContents, data, config);

    //Make sure 'toCompileResourceContents' is a DataParsedDocument after this call
    //readResourceContents = getAsDataParsedDocument(readResourceContents, contentAndData);

    if (!contentAndData) {
        return null;
    }

    const mergedData = Object.assign(contentAndData.data, data);

    const compiledResult = await compileRunner?.compile(contentAndData.content, mergedData, config);

    //TODO: check if needs to be recompiled (possibly with another compiler)
    //Different runner syntax nesting should be possible (maybe possible explicitly marked to reference the target runner - as it can not be detected with the file extension)
    //So when there are still custom components in the result -> reiterat rendering until resolved

    //Local or global component concepts (implementation is the runners, or here?)

    //If we make the assumption that the output of the compile is HTML
    //1. render
    //2. check if there are unresolved components
    //3. render sub component and pass data selected from this content and the content that the element wraps
    //4. Repeat until there are not unresolved components left

    /**
     * But as a "CompileRunner" can also be something like a directory handler consumer that means not everything coming out of the 
     * compile process is HTML.
     * -> Return rendered Input and output format and runner from compile process via output data.
     */



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