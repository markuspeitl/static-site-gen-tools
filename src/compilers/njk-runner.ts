import { DataExtractor, DocumentData } from "../data-extract";
import { getLibInstance } from "../dependencies/module-instances";
import { DataParsedDocument, DocumentCompiler, FalsyAble } from "../document-compile";
//import { getOverrideOrLocal } from "./libs-cache-override";
import { getExtractor as getMarkdownExtractor } from "./md-runner";
//import * as nunjucks from 'nunjucks';
import type { Environment } from 'nunjucks';
//import type nunjucks from 'nunjucks';

export function getCompiler(): DocumentCompiler {
    const defaultNjkDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: any) => {
            if (!fileContent) {
                return null;
            }

            const nunjucks: Environment = await getLibInstance('nunjucks', config);

            if (!dataCtx) {
                dataCtx = {};
            }

            const compiledString: string = nunjucks.renderString(fileContent, dataCtx);

            const compiledOutput: DataParsedDocument = {
                content: compiledString,
                data: dataCtx
            };

            return compiledOutput;
        }
    };

    return defaultNjkDocumentCompiler;
}

export function getExtractor(): DataExtractor {
    const defaultNjkDataExtractor: DataExtractor = {
        extractData: async (fileContent: string, config?: any) => {

            let dataExtractor = config.dataExtractors[ 'md' ];
            if (!dataExtractor) {
                dataExtractor = getMarkdownExtractor();
            }
            return dataExtractor.extractData(fileContent, config);
        }
    };

    return defaultNjkDataExtractor;
}