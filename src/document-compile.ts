import * as fs from 'fs';
import path from 'path';
import markdownit from 'markdown-it';
import { setDefaults, cleanUpExt } from './compile';
import { DocumentData, extractData } from './data-extract';
import { defaultDocCompilers } from './defaults';

export interface DataParsedDocument {
    content?: string | null;
    data?: DocumentData | null;
}

export interface DocumentCompiler {
    compile: (fileContent: string, data?: DocumentData | null, config?: any) => Promise<string>;
}

export type DocCompilers = Record<string, DocumentCompiler>;

export function getDataExtractedDocOfContent(documentContents: string | DataParsedDocument, docData?: DocumentData | null): DataParsedDocument {
    if (typeof documentContents === 'string') {
        return {
            content: documentContents,
            data: docData
        };
    }
    return documentContents;
}

export async function compileDocument(documentContents: string | DataParsedDocument, documentTypeExt: string, docCompilers: DocCompilers, config: any): Promise<string> {
    docCompilers = setDefaults(docCompilers, defaultDocCompilers);

    const selectedCompiler: DocumentCompiler = config.compilers[ documentTypeExt ];

    if (!selectedCompiler) {
        throw new Error(`No compiler found for extension ${documentTypeExt}`);
    }

    const dataExtDoc: DataParsedDocument = getDataExtractedDocOfContent(documentContents, null);

    if (!dataExtDoc.content) {
        throw new Error(`Document has not contents to compile ${documentContents}`);
    }

    const compiledDocumentContents: string = await selectedCompiler.compile(dataExtDoc.content, dataExtDoc.data, config);

    return compiledDocumentContents;
}

export async function compileFile(srcFilePath: string, targetFilePath: string, config: any): Promise<string> {

    if (!fs.existsSync(srcFilePath)) {
        //return null;
        throw new Error(`Src file at ${srcFilePath} does not exist`);
    }

    const srcFilePathParsed: path.ParsedPath = path.parse(srcFilePath);
    const srcFilePathName = srcFilePathParsed.name;
    let documentTypeExt = srcFilePathParsed.ext;
    documentTypeExt = cleanUpExt(documentTypeExt);


    let docFileContent = await fs.promises.readFile(srcFilePath).toString();

    if (!docFileContent || docFileContent.length <= 0) {
        throw new Error(`File ${srcFilePath} is empty -> nothing to compile`);
        //return null;
    }

    let dataExtractedDocument: DataParsedDocument = await extractData(docFileContent, documentTypeExt, config.dataExtractors, config);

    const docToCompile = dataExtractedDocument || docFileContent;

    const compiledDocumentContents: string = await compileDocument(docToCompile, documentTypeExt, config.compilers, config);

    return compiledDocumentContents;
}

export async function compileFileTo(srcFilePath: string, targetFilePath: string, config: any): Promise<string> {
    const compiledDocumentContents: string = await compileFile(srcFilePath, targetFilePath, config);
    await fs.promises.writeFile(targetFilePath, compiledDocumentContents);
    return compiledDocumentContents;
}