import { BaseComponent } from "../components/base-component";
import { FalsyAble } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { getTsModule, getFirstDefPropAsFn } from "../module-loading/util";
import { FileRunner } from "./file.runner";
import { CompileRunner, DataParsedDocument, DocumentData } from "./runners";


export function getTargetModulePath(dataCtx: FalsyAble<DocumentData>): string | null {
    if (!dataCtx) {
        return null;
    }
    const componentModulePath: string = dataCtx?.inputPath || dataCtx?.path || dataCtx?.src;
    return componentModulePath;
}

export async function getComponent(dataCtx?: DocumentData | null, moduleContent?: FalsyAble<string>): Promise<BaseComponent | null> {
    let loadedModule: any = await getTsModule(moduleContent, getTargetModulePath(dataCtx));
    if (!loadedModule) {
        return null;
    }
    const componentInstance: BaseComponent = loadedModule.default;
    return componentInstance;
}

export async function getTsModuleCompilerData(fileContent: FalsyAble<string>, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DocumentData>> {

    if (!dataCtx) {
        dataCtx = {};
    }
    const componentInstance: BaseComponent | null = await getComponent(dataCtx, fileContent);

    const getDataFn = getFirstDefPropAsFn(componentInstance, [ 'data', 'getData', 'frontMatterData', 'getFrontMatterData' ]);
    if (!getDataFn) {
        console.log(`Could not find (data, getData, frontMatterData, getFrontMatterData) function or property in component in module of:\n${fileContent}`);
        return null;
    }

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

    const componentInstance: BaseComponent | null = await getComponent(dataCtx, fileContent);

    const compileDocFn = getFirstDefPropAsFn(componentInstance, [ 'render', 'compile', 'parse' ]);
    if (!compileDocFn) {
        console.log(`Could not (compile, render, parse) fn or property in component in module of:\n${fileContent}`);
        return null;
    }

    const compiledContent: DataParsedDocument | string = await compileDocFn(dataCtx, config);

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


export class TsRunner extends FileRunner {

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        return getTsModuleCompilerData(resource.content, resource.data, config) as Promise<DocumentData | null>;
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.content) {
            return null;
        }
        if (!resource.data) {
            resource.data = await getTsModuleCompilerData(resource.content, resource.data, config);;
        }

        //dataCtx = getTsModuleCompilerData(fileContent, dataCtx, config);
        return callTsModuleCompile(resource.content, resource.data, config);
    }
}

export function getInstance(): CompileRunner {
    return new TsRunner();
}