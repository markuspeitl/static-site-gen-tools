import { DataExtractor, DocumentData } from "../data-extract";
import { FalsyAble, DataParsedDocument, DocumentCompiler } from "../document-compile";
import { calcHash } from "../fragement-cache";
import { getTsModule, getFirstDefPropAsFn } from "../module-loading/util";


export async function getTsModuleCompilerData(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any): Promise<FalsyAble<DocumentData>> {

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

export async function callTsModuleCompile(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any): Promise<FalsyAble<DataParsedDocument>> {
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


export function getCompiler(): DocumentCompiler {
    const defaultTsDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any) => {

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
        extractData: async (fileContent: string, config?: any) => {
            return getTsModuleCompilerData(fileContent, null, config);
        }
    };

    return defaultTsDataExtractor;
}