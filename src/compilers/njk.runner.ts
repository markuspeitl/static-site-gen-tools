import { getLibInstance } from "../dependencies/module-instances";
import { CompileRunner, DataParsedDocument, DocumentData, getRunnerInstance } from './runners';
//import { getOverrideOrLocal } from "./libs-cache-override";
//import { getExtractor as getMarkdownExtractor } from "./md-runner";
//import * as nunjucks from 'nunjucks';
import type { Environment } from 'nunjucks';
import { SsgConfig } from "../config";
//import type nunjucks from 'nunjucks';
import { getInstance as getMarkdownRunnerInstance } from './md.runner';
import { FileRunner } from "./file.runner";
import { FalsyAble } from "../components/helpers/generic-types";

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

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {


        let markdownRunner: FalsyAble<CompileRunner> = await getRunnerInstance('markdown', config);
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

        return markdownRunner.extractData(resource, config);
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.content) {
            return null;
        }
        if (!resource.data) {
            resource.data = await this.extractData(resource.content, config);
        }
        if (!resource.data) {
            resource.data = {};
        }

        const nunjucks: Environment = await getLibInstance('nunjucks', config);

        const compiledString: string = nunjucks.renderString(resource.content, resource.data);

        const compiledOutput: DataParsedDocument = {
            content: compiledString,
            data: resource.data
        };

        return compiledOutput;
    }

}

export function getInstance(): CompileRunner {
    return new NunjucksRunner();
}