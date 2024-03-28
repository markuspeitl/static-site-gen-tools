
import matter from 'gray-matter';
import { setDefaults, cleanUpExt } from './compile';
import { DataParsedDocument, DocCompilers, FalsyAble } from './document-compile';
import { defaultDataExtractors } from './defaults';

export type DocumentData = Record<string, any>;

export interface DataExtractor {
    extractData: (fileContent: string, config?: any) => Promise<DataParsedDocument | FalsyAble<DocumentData>>;
}

export type DataExtractors = Record<string, DataExtractor>;

export function getDataExtractedDocOfData(documentData: DocumentData | DataParsedDocument, docContent?: string | null): DataParsedDocument {
    if (Object.hasOwn(documentData, 'content') && Object.hasOwn(documentData, 'data')) {
        return (documentData as DataParsedDocument);
    }

    return {
        content: docContent,
        data: documentData,
    };
}

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