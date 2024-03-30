import { SsgConfig } from './config';
import { DataExtractor, DataParsedDocument, DocumentData, findRunnerInstanceFor, getRunnerInstance, setDefaultRunnerInstantiatorsFromFiles } from './compilers/runners';
import { cleanUpExt, FalsyAble } from './utils/util';

export function getDataExtractedDocOfData(documentData: DocumentData | DataParsedDocument | null, docContent?: string | null): DataParsedDocument {
    if (!documentData) {
        return {
            content: docContent,
            data: null
        };
    }

    if (Object.hasOwn(documentData, 'content') && Object.hasOwn(documentData, 'data')) {
        return (documentData as DataParsedDocument);
    }

    return {
        content: docContent,
        data: documentData,
    };
}

export async function extractData(documentContents: string, fsNodePath: string, config: SsgConfig = {}): Promise<DataParsedDocument> {

    //dataExtractors?: DataExtractors
    /*if (!dataExtractors) {
        dataExtractors = {};
    }*/

    //Load template defaults
    await setDefaultRunnerInstantiatorsFromFiles(config);

    //documentTypeExt = cleanUpExt(documentTypeExt);

    const dataExtractorInstance: FalsyAble<DataExtractor> = await findRunnerInstanceFor(fsNodePath, config);

    const resultDataParsedDoc: DataParsedDocument = {
        content: documentContents,
        data: null
    };

    if (!dataExtractorInstance) {
        return resultDataParsedDoc;
    }

    const parsedDataDoc: DataParsedDocument | DocumentData | null = await dataExtractorInstance.extractData(documentContents, config);

    return getDataExtractedDocOfData(parsedDataDoc, documentContents);


    //const defaultDataExtractors: DataExtractors = await getDefaultDataExtractors();
    //dataExtractors = setDefaults(dataExtractors, defaultDataExtractors);


    /*if (!documentTypeExt) {
        //Or do default extraction??
        return resultDataParsedDoc;
    }*/

    /*documentTypeExt = cleanUpExt(documentTypeExt);

    if (!dataExtractors) {
        return resultDataParsedDoc;
    }

    const selectedDataExtractor: DataExtractor | undefined = dataExtractors[ documentTypeExt ];

    if (!selectedDataExtractor) {
        return resultDataParsedDoc;
    }

    const parsedDataDoc: DataParsedDocument | DocumentData = selectedDataExtractor.extractData(documentContents, config);

    return getDataExtractedDocOfData(parsedDataDoc, documentContents);*/
}