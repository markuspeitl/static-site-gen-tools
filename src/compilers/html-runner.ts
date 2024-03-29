import { DataExtractor, DocumentData } from "../data-extract";
import { DataParsedDocument, DocumentCompiler, FalsyAble } from "../document-compile";

export function getCompiler(): DocumentCompiler {
    const defaultHtmlDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: any) => {

            if (!fileContent) {
                return null;
            }

            const compiledOutput: DataParsedDocument = {
                content: fileContent,
                data: dataCtx
            };

            return compiledOutput;
        }
    };

    return defaultHtmlDocumentCompiler;
}

export function getExtractor(): DataExtractor {
    const defaultHtmlDataExtractor: DataExtractor = {
        extractData: async (fileContent: string, config?: any) => {
            return {};
        }
    };

    return defaultHtmlDataExtractor;
}