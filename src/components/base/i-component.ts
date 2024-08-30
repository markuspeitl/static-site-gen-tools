import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";

//export type FunctionOrStatic<FnParams, ReturnType> = ((args: FnParams) => ReturnType) | ReturnType;

export type DocumentData = Record<string, any>;

export type DataToParsedDocumentFn = (resource: DocumentData | IProcessResource, config: SsgConfig) => Promise<IProcessResource | string>;
export type DataToParsedDocumentOrString = DataToParsedDocumentFn | IProcessResource | string;

export type DataFunction = (resource: DocumentData | IProcessResource, config: SsgConfig) => Promise<IProcessResource | DocumentData>;
//export type RenderFunction = DataToParsedDocumentFn;

//Possible formats of Component on disk (before the component is loaded into memory)
export interface BaseComponent {
    //model
    data: DataFunction | DocumentData;
    //view
    render: DataToParsedDocumentOrString;

    //control data -> for manipulating the data and or layout chain / components flow settings dynamically
    //controlData?(dataCtx?: DocumentData | null, config: SsgConfig): any;
}

//Format the components after loading them into memory (normalized internal component)
export interface IInternalComponent {
    data: (resource: IProcessResource, config: SsgConfig) => Promise<IProcessResource>;
    render: (resource: IProcessResource, config: SsgConfig) => Promise<IProcessResource>;
}

export function isRenderComponent(component): component is IInternalComponent {
    if (component.render) {
        return true;
    }
    return false;
}

export function isDataComponent(component): component is IInternalComponent {
    if (component.data) {
        return true;
    }
    return false;
}

/*export interface FnBaseComponent {
    data(dataCtx?: DocumentData | null, config: SsgConfig): Promise<IProcessResource | DocumentData>;
    render(dataCtx?: DocumentData | null, config: SsgConfig): Promise<IProcessResource | string>;
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

export async function renderComponent(componentModule: BaseComponent, dataCtx: DocumentData | null, config: SsgConfig): Promise<IProcessResource> {

    if (!dataCtx) {
        dataCtx = {};
    }

    for (const key of dataPackResultKeys) {
        if (componentModule[ key ]) {
            const extendedRenderFn: DataToParsedDocumentOrString = getFnFromParam(componentModule[ key ]);

            const renderedExtension: IProcessResource | string = await extendedRenderFn(dataCtx, config);

            dataCtx[ key ] = renderedExtension;
        }
    }


    const renderFn = getFnFromParam(componentModule.render);
    const renderedComponent: IProcessResource | string = await renderFn(dataCtx, config);

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

export async function renderComponentAt(componentIdOrLocation: string, dataCtx: DocumentData | null, config: SsgConfig): Promise<IProcessResource | null> {

    if (config && !config.tsComponentsCache) {
        config.tsComponentsCache = {};
    }

    const componentModule: BaseComponent | null = (await loadTsModuleFromPath(componentIdOrLocation, config.tsComponentsCache)) as BaseComponent | null;

    if (componentModule) {
        return renderComponent(componentModule, dataCtx, config);
    }
    return null;
}*/