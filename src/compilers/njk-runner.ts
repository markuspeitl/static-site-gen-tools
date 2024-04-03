import { getLibInstance } from "../dependencies/module-instances";
import { FalsyAble } from '../utils/util';
import { CompileRunner, DataParsedDocument, DocumentData, getRunnerInstance } from './runners';
//import { getOverrideOrLocal } from "./libs-cache-override";
//import { getExtractor as getMarkdownExtractor } from "./md-runner";
//import * as nunjucks from 'nunjucks';
import type { Environment } from 'nunjucks';
import { SsgConfig } from "../config";
//import type nunjucks from 'nunjucks';
import { getInstance as getMarkdownRunnerInstance } from './md-runner';
import { FileRunner } from "./file-runner";

/*export function getCompiler(): DocumentCompiler {
    const defaultNjkDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: FalsyAble<DocumentData>, config?: SsgConfig) => {
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
        extractData: async (fileContent: string, config?: SsgConfig) => {

            let dataExtractor = config.dataExtractors[ 'md' ];
            if (!dataExtractor) {
                dataExtractor = getMarkdownExtractor();
            }
            return dataExtractor.extractData(fileContent, config);
        }
    };

    return defaultNjkDataExtractor;
}*/

export class NunjucksRunner extends FileRunner {

    public async extractData(fileContent: string, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | DocumentData | null> {


        let markdownRunner: CompileRunner | null = await getRunnerInstance('markdown', config);
        if (!markdownRunner) {
            markdownRunner = getMarkdownRunnerInstance();
        }

        /*let dataExtractor = config.dataExtractors[ 'md' ];
        if (!dataExtractor) {
            //dataExtractor = getMarkdownExtractor();
            dataExtractor = getRunner('markdown', config);
        }*/
        if (!markdownRunner) {
            return {};
        }

        return markdownRunner.extractData(fileContent, config);
    }

    public async compile(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

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

}

export function getInstance(): CompileRunner {
    return new NunjucksRunner();
}