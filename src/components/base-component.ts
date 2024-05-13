import { DocumentData, DataParsedDocument } from "../compilers/runners";
import { SsgConfig } from "../config";
import { getFnFromParam, getTsModule, loadTsModuleFromPath } from "../module-loading/ts-modules";
import { FalsyAble } from "./helpers/generic-types";


//export type FunctionOrStatic<FnParams, ReturnType> = ((args: FnParams) => ReturnType) | ReturnType;

export type DataToParsedDocumentFn = (resource: DocumentData | DataParsedDocument, config?: SsgConfig) => Promise<DataParsedDocument | string>;
export type DataToParsedDocumentOrString = DataToParsedDocumentFn | DataParsedDocument | string;

export type DataFunction = (resource: DocumentData | DataParsedDocument, config?: SsgConfig) => Promise<DataParsedDocument | DocumentData>;
//export type RenderFunction = DataToParsedDocumentFn;

//Possible formats of Component on disk (before the component is loaded into memory)
export interface BaseComponent {
    //model
    data: DataFunction | DocumentData;
    //view
    render: DataToParsedDocumentOrString;

    //control data -> for manipulating the data and or layout chain / components flow settings dynamically
    //controlData?(dataCtx?: DocumentData | null, config?: SsgConfig): any;
}

//Format the components after loading them into memory (normalized internal component)
export interface IInternalComponent {
    data: (resource: DataParsedDocument, config?: SsgConfig) => Promise<DataParsedDocument>;
    render: (resource: DataParsedDocument, config?: SsgConfig) => Promise<DataParsedDocument>;
}

/*export interface FnBaseComponent {
    data(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | DocumentData>;
    render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string>;
}*/

//export type StyleFunction = DataToParsedDocumentFn;
//export type ClientCodeFunction = DataToParsedDocumentFn;

export interface ExtensiveComponent extends BaseComponent {
    style: DataToParsedDocumentOrString;
    clientCode: DataToParsedDocumentOrString;
}

/*const dataPackResultKeys: string[] = [
    'style',
    'clientCode'
];

export async function renderComponent(componentModule: BaseComponent, dataCtx: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument> {

    if (!dataCtx) {
        dataCtx = {};
    }

    for (const key of dataPackResultKeys) {
        if (componentModule[ key ]) {
            const extendedRenderFn: DataToParsedDocumentOrString = getFnFromParam(componentModule[ key ]);

            const renderedExtension: DataParsedDocument | string = await extendedRenderFn(dataCtx, config);

            dataCtx[ key ] = renderedExtension;
        }
    }


    const renderFn = getFnFromParam(componentModule.render);
    const renderedComponent: DataParsedDocument | string = await renderFn(dataCtx, config);

    if (typeof renderedComponent === 'string') {
        return {
            content: renderedComponent as string,
            data: dataCtx,
        };
    }

    return {
        content: renderedComponent.content,
        data: Object.assign({}, dataCtx, renderedComponent.data),
    };
}

export async function renderComponentAt(componentIdOrLocation: string, dataCtx: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | null> {

    if (config && !config.tsComponentsCache) {
        config.tsComponentsCache = {};
    }

    const componentModule: BaseComponent | null = (await loadTsModuleFromPath(componentIdOrLocation, config.tsComponentsCache)) as BaseComponent | null;

    if (componentModule) {
        return renderComponent(componentModule, dataCtx, config);
    }
    return null;
}*/