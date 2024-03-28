import { DataExtractor, DocumentData } from "./data-extract";
import { FalsyAble, DataParsedDocument, DocumentCompiler } from "./document-compile";
import { calcHash } from "./fragement-cache";

export function getValueFromFnOrVar(fnOrVar: any, ...fnPassArgs: any[]): any {

    if (!fnOrVar) {
        return null;
    }
    if (typeof fnOrVar === 'function') {
        return fnOrVar(...fnPassArgs);
    }
    return fnOrVar;
}

export function getCallDefModuleValOrFn(module: any, propKeys: string[], ...fnPassArgs: any[]): any {
    for (const key of propKeys) {
        if (module[ key ]) {
            return getValueFromFnOrVar(module[ key ], ...fnPassArgs);
        }
    }
    return null;
}

export function getFnFromParam(paramItem: any): (...args: any[]) => any {
    if (!paramItem) {
        return () => null;
    }
    if (typeof paramItem === 'function') {
        return paramItem;
    }
    return () => paramItem;
}

export function getFirstDefPropAsFn(obj: Object, propKeys: string[]): any {
    for (const key of propKeys) {
        if (obj[ key ]) {
            return getFnFromParam(obj[ key ]);
        }
    }
    return null;
}

const tsComponentModulesCache: Record<string, any> = {};

export async function getTsModule(content?: string | null, modulePath?: string): Promise<any> {
    if (!modulePath && !content) {
        return null;
    }

    if (modulePath) {
        if (tsComponentModulesCache[ modulePath ]) {
            return tsComponentModulesCache[ modulePath ];
        }
    }
    if (!content) {
        return null;
    }
    let moduleKey: string | null | undefined = modulePath;
    if (!moduleKey) {
        moduleKey = calcHash(content);
    }

    tsComponentModulesCache[ moduleKey ] = eval(content);

    return tsComponentModulesCache[ moduleKey ];
}

export async function getTsCompilerData(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any): Promise<FalsyAble<DocumentData>> {

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

export async function callTsCompile(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any): Promise<FalsyAble<DataParsedDocument>> {
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

export const defaultTsDocumentCompiler: DocumentCompiler = {
    compile: async (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any) => {

        if (!fileContent) {
            return null;
        }
        if (!dataCtx) {
            dataCtx = {};
        }

        dataCtx = getTsCompilerData(fileContent, dataCtx, config);
        return callTsCompile(fileContent, dataCtx, config);
    }
};

export const defaultTsDataExtractor: DataExtractor = {
    extractData: async (fileContent: string, config?: any) => {
        return getTsCompilerData(fileContent, null, config);
    }
};