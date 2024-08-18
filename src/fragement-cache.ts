import * as fs from 'fs';
import * as crypto from 'crypto';
import type { IProcessResource } from './processing-tree/i-processor';

export function calcHash(content: any): string {

    const serializedContent = JSON.stringify(content);
    //return crypto.createHash('sha256').update(serializedContent, 'utf-8').digest('hex');
    return crypto.createHash('sha256').update(serializedContent, 'utf-8').digest('base64');
}

/*export interface IProcessResource {
    content: string;
    data: any;
}*/

/*export interface DocumentCompileInput extends IProcessResource {
    dataCtx: DocumentData;
}

export interface DocumentCompileOutput extends IProcessResource {
    passedData: DocumentData;
}*/

export type HashesDict = Record<string, any> & { hash: string | null; };

export interface CompiledFragment {
    inputData: IProcessResource,
    outputData: IProcessResource,
}
export interface CompiledFragmentHashes {
    inputData: HashesDict,
    outputData: HashesDict,
}
/*export interface FragmentHashes {
    input: HashesDict;
    output: HashesDict;
}*/

/*export interface CompileHashes {
    document: string;
    documentData: string;
    passedData: string;
    hash: string;
}*/



export function calcPropHashes(dict: Record<string, any>, addFullHash: boolean = true): HashesDict {
    const hashes: any = {};

    const subKeyHashes: string[] = [];
    for (const key in dict) {
        const currentValue = dict[ key ];
        hashes[ key ] = calcHash(currentValue);
    }

    //if (addFullHash) {
    hashes.hash = calcHash(subKeyHashes.join(''));
    //}

    return hashes as HashesDict;
}

export function calcCompileDataHashes(compileData: IProcessResource): HashesDict {
    /*const documentHashes: any = {
        document: calcHash(compileInputs.contents),
        documentData: calcHash(compileInputs.data),
        passedData: calcHash(compileInputs.passedData),
    };

    const subHashes = [ documentHashes.document, documentHashes.documentData, documentHashes.passedData ];
    documentHashes.state = calcHash(subHashes);*/

    return calcPropHashes(compileData);
}

export function hasChanged(previousHashes: HashesDict, currentHashes: HashesDict): boolean {
    return previousHashes.hash === currentHashes.hash;
}


export function getFragmentPath(): string {
    return '';
}
export function getFragmentHashesPath(): string {
    return '';
}
export function getFragmentContentsPath(): string {
    return '';
}



export async function readStoredFragmentHashes(fragmentHashesPath: string): Promise<CompiledFragmentHashes> {
    return {
        inputData: {
            hash: 'sdgoins'
        },
        outputData: {
            hash: 'asfaipgs'
        }
    };
}


export function checkUpdatedCompileInputs(previousHashes: HashesDict, currentInputData: IProcessResource): HashesDict | null {
    const updatedCompileHashes: HashesDict = calcCompileDataHashes(currentInputData);

    if (hasChanged(previousHashes as HashesDict, updatedCompileHashes as HashesDict)) {
        return updatedCompileHashes;
    }
    return null;
}

//export function fragmentNeedsRecompilation(inputs: CompileInputs): Promise<boolean> {

export async function getExistingFragmentFromCache(inputData: IProcessResource): Promise<null | IProcessResource> {
    const fragmentHashesPath: string = getFragmentHashesPath();
    const storedFragmentHashes: CompiledFragmentHashes = await readStoredFragmentHashes(fragmentHashesPath);

    const updatedHashes: HashesDict | null = checkUpdatedCompileInputs(storedFragmentHashes.inputData, inputData);

    if (updatedHashes) {
        return null;
    }

    const fragmentContentsPath: string = getFragmentContentsPath();
    const fragmentFileContent: string = (await fs.promises.readFile(fragmentContentsPath)).toString();

    return JSON.parse(fragmentFileContent);
}

//Check if fragment context has changed and only write if it is different (no unnecessary writes)
export async function storeUpdatedCompiledFragment(inputData: IProcessResource, outputData: IProcessResource): Promise<void> {

    const fragmentHashesPath: string = getFragmentHashesPath();
    const storedFragmentHashes: CompiledFragmentHashes = await readStoredFragmentHashes(fragmentHashesPath);

    const outputHashes: HashesDict = calcPropHashes(outputData);

    if (!hasChanged(storedFragmentHashes.outputData, outputHashes)) {
        return;
    }
    const inputHashes: HashesDict = calcPropHashes(inputData);

    /*if (!hasChanged(storedFragmentHashes.input, inputHashes)) {
        console.log("Fragment hashes have changed -> updating fragment");
        console.log("Input hashes of fragment have changed");
    }*/

    const updatedHashes: CompiledFragmentHashes = {
        inputData: inputHashes,
        outputData: outputHashes
    };
    const serializedUpdatedHashes: string = JSON.stringify(updatedHashes);
    await fs.promises.writeFile(fragmentHashesPath, serializedUpdatedHashes);

    const fragmentContentsPath: string = getFragmentContentsPath();

    const serializedOutputs: string = JSON.stringify(outputData);
    await fs.promises.writeFile(fragmentContentsPath, serializedOutputs);
}

export interface FragmentCache {
    getExistingFragmentFromCache(inputData: IProcessResource): Promise<null | IProcessResource>;
    storeUpdatedCompiledFragment(inputData: IProcessResource, outputData: IProcessResource): Promise<void>;
}

export const defaultFragmentCache: FragmentCache = {
    getExistingFragmentFromCache: getExistingFragmentFromCache,
    storeUpdatedCompiledFragment: storeUpdatedCompiledFragment
};