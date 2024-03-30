import { SsgConfig } from "../config";
import { getTsModule, getFirstDefPropAsFn } from "../module-loading/util";
import { FalsyAble } from "../utils/util";
import { CompileRunner, DataParsedDocument, DocumentData } from "./runners";


export async function getTsModuleCompilerData(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DocumentData>> {

    if (!dataCtx) {
        dataCtx = {};
    }

    let loadedModule: any = await getTsModule(fileContent, dataCtx?.inputPath || dataCtx?.path);
    if (!loadedModule) {
        return null;
    }

    const getDataFn = getFirstDefPropAsFn(loadedModule, [ 'data', 'getData', 'frontMatterData', 'getFrontMatterData' ]);

    let moduleData = await getDataFn(dataCtx, config);
    if (!moduleData) {
        moduleData = {};
    }
    if (moduleData.beforeParams) {
        dataCtx = Object.assign(moduleData, dataCtx);
    }
    else {
        dataCtx = Object.assign(dataCtx, moduleData);
    }
    return dataCtx;
}

export async function callTsModuleCompile(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
    if (!dataCtx) {
        dataCtx = {};
    }

    let loadedModule: any = await getTsModule(fileContent, dataCtx?.inputPath || dataCtx?.path);
    if (!loadedModule) {
        return null;
    }
    const compileDocFn = getFirstDefPropAsFn(loadedModule, [ 'render', 'compile', 'parse' ]);
    const compiledContent: DataParsedDocument | string = compileDocFn(dataCtx, config);

    if (typeof compiledContent === 'string') {
        const compiledOutput: DataParsedDocument = {
            content: compiledContent,
            data: dataCtx,
        };
        return compiledOutput;
    }

    return compiledContent;
}


/*export function getCompiler(): DocumentCompiler {
    const defaultTsDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig) => {

            if (!fileContent) {
                return null;
            }
            if (!dataCtx) {
                dataCtx = {};
            }

            dataCtx = getTsModuleCompilerData(fileContent, dataCtx, config);
            return callTsModuleCompile(fileContent, dataCtx, config);
        }
    };

    return defaultTsDocumentCompiler;
}

export function getExtractor(): DataExtractor {
    const defaultTsDataExtractor: DataExtractor = {
        extractData: async (fileContent: string, config?: SsgConfig) => {
            return getTsModuleCompilerData(fileContent, null, config);
        }
    };

    return defaultTsDataExtractor;
}*/


export class TsRunner implements CompileRunner {
    constructor () { }


    public async extractData(fileContent: string, config?: SsgConfig): Promise<DataParsedDocument | DocumentData | null> {

        return getTsModuleCompilerData(fileContent, null, config) as Promise<DocumentData | null>;
    }

    public async compile(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!fileContent) {
            return null;
        }
        if (!dataCtx) {
            dataCtx = {};
        }

        dataCtx = getTsModuleCompilerData(fileContent, dataCtx, config);
        return callTsModuleCompile(fileContent, dataCtx, config);
    }

}

export function getInstance(): CompileRunner {
    return new TsRunner();
}