import * as fs from 'fs';
import * as crypto from 'crypto';

export function calcHash(content: any): string {

    const serializedContent = JSON.stringify(content);
    //return crypto.createHash('sha256').update(serializedContent, 'utf-8').digest('hex');
    return crypto.createHash('sha256').update(serializedContent, 'utf-8').digest('base64');
}

export interface DocumentState {
    contents: string;
    data: any;
}

export interface CompileInputs extends DocumentState {
    passedData: any;
}

export interface CompileOutputs extends DocumentState {
}

export interface CompiledFragment {
    inputs: CompileInputs,
    output: CompileOutputs,
}

export interface CompileHashes {
    document: string;
    documentData: string;
    passedData: string;
    hash: string;
}

export type HashesDict = Record<string, any>;

export function calcPropHashes(dict: Record<string, any>, addFullHash: boolean = true): Record<string, string> {
    const hashes: Record<string, string> = {};

    const subKeyHashes: string[] = [];
    for (const key in dict) {
        const currentValue = dict[ key ];
        hashes[ key ] = calcHash(currentValue);
    }

    if (addFullHash) {
        hashes.hash = calcHash(subKeyHashes.join(''));
    }

    return hashes;
}

export function calcCompileDocInputHashes(compileInputs: CompileInputs): any {
    /*const documentHashes: any = {
        document: calcHash(compileInputs.contents),
        documentData: calcHash(compileInputs.data),
        passedData: calcHash(compileInputs.passedData),
    };

    const subHashes = [ documentHashes.document, documentHashes.documentData, documentHashes.passedData ];
    documentHashes.state = calcHash(subHashes);*/

    return calcPropHashes(compileInputs);
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

export interface FragmentHashes {
    input: HashesDict;
    output: HashesDict;
}

export async function readStoredFragmentHashes(fragmentHashesPath: string): Promise<FragmentHashes> {
    return {
        input: {
            hash: 'sdgoins'
        },
        output: {
            hash: 'asfaipgs'
        }
    };
}


export function checkUpdatedCompileInputs(previousHashes: CompileHashes, currentInputs: CompileInputs): CompileHashes | null {
    const updatedCompileHashes: CompileHashes = calcCompileDocInputHashes(currentInputs);

    if (hasChanged(previousHashes as HashesDict, updatedCompileHashes as HashesDict)) {
        return updatedCompileHashes;
    }
    return null;
}

//export function fragmentNeedsRecompilation(inputs: CompileInputs): Promise<boolean> {

export async function getExistingFragmentFromCache(inputs: CompileInputs): Promise<null | CompileOutputs> {
    const fragmentHashesPath: string = getFragmentHashesPath();
    const storedFragmentHashes: FragmentHashes = await readStoredFragmentHashes(fragmentHashesPath);

    const updatedHashes: CompileHashes | null = checkUpdatedCompileInputs(storedFragmentHashes.input as CompileHashes, inputs);

    if (updatedHashes) {
        return null;
    }

    const fragmentContentsPath: string = getFragmentContentsPath();
    const fragmentFileContent: string = (await fs.promises.readFile(fragmentContentsPath)).toString();

    return JSON.parse(fragmentFileContent);
}

//Check if fragment context has changed and only write if it is different (no unnecessary writes)
export async function storeUpdatedCompiledFragment(inputs: CompileInputs, outputs: CompileOutputs): Promise<void> {

    const fragmentHashesPath: string = getFragmentHashesPath();
    const storedFragmentHashes: FragmentHashes = await readStoredFragmentHashes(fragmentHashesPath);

    const outputHashes: HashesDict = calcPropHashes(outputs);

    if (!hasChanged(storedFragmentHashes.output, outputHashes)) {
        return;
    }
    const inputHashes: HashesDict = calcPropHashes(inputs);

    /*if (!hasChanged(storedFragmentHashes.input, inputHashes)) {
        console.log("Fragment hashes have changed -> updating fragment");
        console.log("Input hashes of fragment have changed");
    }*/

    const updatedHashes: any = {
        input: inputHashes,
        output: outputHashes
    };

    await fs.promises.writeFile(fragmentHashesPath, updatedHashes);

    const fragmentContentsPath: string = getFragmentContentsPath();

    const serializedOutputs: string = JSON.stringify(outputs);

    await fs.promises.writeFile(fragmentContentsPath, serializedOutputs);
}

export interface FragmentCache {
    getExistingFragmentFromCache(inputs: CompileInputs): Promise<null | CompileOutputs>;
    storeUpdatedCompiledFragment(inputs: CompileInputs, outputs: CompileOutputs): Promise<void>;
}

export const defaultFragmentCache: FragmentCache = {
    getExistingFragmentFromCache: getExistingFragmentFromCache,
    storeUpdatedCompiledFragment: storeUpdatedCompiledFragment
};