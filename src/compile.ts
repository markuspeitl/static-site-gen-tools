
import matter from 'gray-matter';
import * as fs from 'fs';
import path from 'path';
import markdownit from 'markdown-it';

const mdItInstance = markdownit();
export const defaultMarkdownDocumentCompiler: DocumentCompiler = {
    compile: async (fileContent: string, config?: any) => {
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        return mdItInstance.render(fileContent);
    }
};
export const defaultMarkdownDataExtractor: DataExtractor = {
    extractData: async (fileContent: string, config?: any) => {

        const dataParsedMdFile: matter.GrayMatterFile<string> = matter(fileContent);
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        //mdItInstance.render(fileContent);

        return dataParsedMdFile.data;
    }
};


export function cleanUpExt(fileExtension: string): string {

    if (!fileExtension) {
        return '';
    }

    fileExtension = fileExtension.trim();
    if (!fileExtension.startsWith('.')) {
        return fileExtension;
    }

    if (!fileExtension || fileExtension.length <= 0) {
        return '';
    }

    return fileExtension.slice(1);
}

export type DocumentData = Record<string, any>;

export interface DataParsedDocument {
    content?: string | null;
    data?: DocumentData | null;
}

export interface DocumentCompiler {
    compile: (fileContent: string, data?: DocumentData | null, config?: any) => Promise<string>;
}

export interface DataExtractor {
    extractData: (fileContent: string, config?: any) => Promise<DataParsedDocument | DocumentData>;
}

export type DataExtractors = Record<string, DataExtractor>;
export type DocCompilers = Record<string, DocumentCompiler>;

export function setDefaults(dict: any, defaultDict: any, setIfNull: boolean = false): any {

    if (!dict) {
        return defaultDict;
    }
    if (!defaultDict) {
        return dict;
    }

    for (const key in defaultDict) {

        if (dict[ key ] === undefined || (setIfNull && dict[ key ] === null)) {
            dict[ key ] = defaultDict[ key ];
        }
    }
    return dict;
}

export function getDataExtractedDocOfContent(documentContents: string | DataParsedDocument, docData?: DocumentData | null): DataParsedDocument {
    if (typeof documentContents === 'string') {
        return {
            content: documentContents,
            data: docData
        };
    }
    return documentContents;
}

export function getDataExtractedDocOfData(documentData: DocumentData | DataParsedDocument, docContent?: string | null): DataParsedDocument {
    if (Object.hasOwn(documentData, 'content') && Object.hasOwn(documentData, 'data')) {
        return (documentData as DataParsedDocument);
    }

    return {
        content: docContent,
        data: documentData,
    };
}

export function getDefaultDocCompilers(): DocCompilers {
    const docCompilers: DocCompilers = {};
    docCompilers.md = defaultMarkdownDocumentCompiler;
    return docCompilers;
}
const defaultDocCompilers: DocCompilers = getDefaultDocCompilers();

export function getDefaultDataExtractors(): DataExtractors {
    const extractors: DataExtractors = {};
    extractors.md = defaultMarkdownDataExtractor;
    return extractors;
}
const defaultDataExtractors: DocCompilers = getDefaultDocCompilers();


export async function extractData(documentContents: string, documentTypeExt: string, dataExtractors: DataExtractors, config: any): Promise<DataParsedDocument> {
    dataExtractors = setDefaults(dataExtractors, defaultDataExtractors);

    const resultDataParsedDoc: DataParsedDocument = {
        content: documentContents,
        data: null
    };

    if (!documentTypeExt) {
        //Or do default extraction??
        return resultDataParsedDoc;
    }

    documentTypeExt = cleanUpExt(documentTypeExt);

    const selectedDataExtractor: DataExtractor | undefined = dataExtractors[ documentTypeExt ];

    if (!selectedDataExtractor) {
        return resultDataParsedDoc;
    }

    const parsedDataDoc: DataParsedDocument | DocumentData = selectedDataExtractor.extractData(documentContents, config);

    return getDataExtractedDocOfData(parsedDataDoc, documentContents);
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

