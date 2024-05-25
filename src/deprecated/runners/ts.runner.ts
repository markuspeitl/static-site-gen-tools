import { BaseComponent, IInternalComponent } from "../components/base-component";
import { getComponent } from "../components/components";
import { FalsyAble } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { getTsModule, getFirstDefPropAsFn } from "../module-loading/ts-modules";
import { FileRunner } from "./file.runner";
import { CompileRunner, DataParsedDocument, DocumentData } from "./runners";
import { data } from '../deprecated/render/sample-layout';


/*export async function getTsComponentData(fileContent: FalsyAble<string>, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DocumentData>> {

    //const fileContent: string = resource.content;
    //const dataCtx: any = resource.data;
    //dataCtx.content = fileContent;
    return await componentInstance.data();

    if (!dataCtx) {
        dataCtx = {};
    }
    const componentInstance: FalsyAble<BaseComponent> = await getComponent(dataCtx, fileContent);

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
}*/

/*export async function compileComponent(resource: DataParsedDocument, componentInstance: IInternalComponent, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {


    //const internalComponent: IInternalComponent = normalizeModuleToComponent(componentInstance);

    const fileContent: string = resource.content;
    const dataCtx: any = resource.data;
    dataCtx.content = fileContent;
    return await componentInstance.render(dataCtx, config);

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

export async function getComponentData(resource: DataParsedDocument, componentInstance: IInternalComponent, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
    //const fileContent: string = resource.content;
    const dataCtx: any = resource.data;
    //dataCtx.content = fileContent;
    return componentInstance.data(dataCtx, config);
}

export async function compileTsComponent(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
    if (!dataCtx) {
        dataCtx = {};
    }

    const componentInstance: FalsyAble<IInternalComponent> = await getComponent(dataCtx, fileContent);
    if (!componentInstance) {
        return null;
    }

    return compileComponent(
        {
            content: fileContent,
            data: dataCtx,
        },
        componentInstance,
        config
    );
}
*/

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

        const dataCtx: any = resource.data;
        const toRenderContent: any = resource.content;
        const componentInstance: FalsyAble<IInternalComponent> = await getComponent(dataCtx, toRenderContent, config);
        const dataResult: any = await componentInstance?.data(dataCtx, config);

        if (dataResult.content && dataResult.data) {
            return dataResult;
        }

        return {
            content: toRenderContent,
            data: dataResult
        };

        /*const componentData: any = await componentInstance?.data(dataCtx, config);

        return {
            content: toRenderContent,
            data: componentData
        };*/
        //return getTsModuleCompilerData(resource.content, resource.data, config) as Promise<DocumentData | null>;
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.content) {
            return null;
        }
        if (!resource.data) {
            resource.data = await this.extractData(resource, config);;
        }

        const dataCtx: any = resource.data;
        const toRenderContent: any = resource.content;
        const componentInstance: FalsyAble<IInternalComponent> = await getComponent(dataCtx, toRenderContent, config);

        const renderResult = await componentInstance?.render(dataCtx, config);

        if (renderResult?.content) {
            return renderResult;
        }

        return {
            content: renderResult,
            data: resource.data,
        };

        //return componentInstance?.render(dataCtx, config);

        /*return {
            content: toRenderContent,
            data: componentData
        }

        //dataCtx = getTsModuleCompilerData(fileContent, dataCtx, config);
        return callTsModuleCompile(resource.content, resource.data, config);*/
    }
}

export function getInstance(): CompileRunner {
    return new TsRunner();
}