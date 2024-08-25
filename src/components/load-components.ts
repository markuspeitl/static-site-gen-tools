import type { SsgConfig } from "../config/ssg-config";
import type Module from "module";
import type { IProcessResource } from "../processors/shared/i-processor-resource";

import { BaseComponent, DocumentData, IInternalComponent } from "./base/i-component";
import { PassthroughComponent } from "./default/passthrough.component";
import { FileComponent } from "./default/file.component";

import { constructFromClassType, getFirstMatchedInModuleConstruct, getModuleId, loadModuleFromPath, loadModuleFromString, loadModulesFromPaths, type FalsyAble } from "@markus/ts-node-util-mk1";

export function getComponentIdFromPath(runnerPath: string): string {
    return getModuleId(runnerPath, '.component');
}

export interface IExternalComponentModule extends Module {
    default?: any,
    data?: any,
    render?: any;
}

export function addPostProcessingNormalization(componentInstance: BaseComponent): void {
    //Convert to resource in postprocessing if the component render returns a string
    const origRenderFn: any = componentInstance.render;
    componentInstance.render = async (...args: any[]) => {
        const resource: any = await origRenderFn.call(componentInstance, ...args);
        if (typeof resource === 'string') {
            return {
                content: resource
            };
        }
        return resource;
    };
}

//Only 1 component per file is allowed right now
export function moduleToComponentInstance(module: IExternalComponentModule): FalsyAble<IInternalComponent> {

    let componentInstance: BaseComponent | null = null;
    const passThroughComponent: PassthroughComponent = new PassthroughComponent();

    const defaultExport = module.default;
    if (defaultExport) {
        if (defaultExport.constructor) {
            //A component class is exported
            componentInstance = constructFromClassType(defaultExport.constructor);
        }
        if (defaultExport.render || module.data) {
            //A component instance is exported through default
            componentInstance = defaultExport;
        }
        if (typeof defaultExport === 'function') {
            //A rendering function is exported through default export
            componentInstance = passThroughComponent;
            componentInstance.render = defaultExport;
        }
    }

    if (module.render || module.data) {
        //The module itself is a component
        componentInstance = module as BaseComponent;
    }

    if (!componentInstance) {

        componentInstance = getFirstMatchedInModuleConstruct(module, '.+Component.*', [ 'render' ]);
    }

    if (!componentInstance) {
        return null;
    }
    //The module contains a Component (as we are using the file name as id, currently only 1 component per file is allowed)

    if (!componentInstance.render) {
        componentInstance.render = passThroughComponent.render;
    }
    if (!componentInstance.data) {
        componentInstance.data = passThroughComponent.data;
    }

    if (componentInstance.render && typeof componentInstance.render === 'string') {

        const renderContent: string = componentInstance.render;
        componentInstance.render = async (resource: IProcessResource, config: SsgConfig) => {
            return renderContent;
            /*return {
                content: renderContent,
                data: dataCtx,
            };*/
        };
    }
    if (componentInstance.data && typeof componentInstance.data === 'object') {

        const staticData: Object = componentInstance.data;
        componentInstance.data = (resource: IProcessResource, config: SsgConfig) => {
            return staticData;
            /*return {
                content: '',
                data: staticData //Object.assign(staticData, dataCtx),
            };*/
        };
    }

    addPostProcessingNormalization(componentInstance);

    //TODO add special component: not function and export is specified, but the 'data', 'config' properties can be assumed to
    //be available during runtime and the compiled document string is printed to std.out

    return componentInstance as FalsyAble<IInternalComponent>;
}

export async function getComponentFromBuffer(moduleBuffer: string, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {

    if (!moduleBuffer) {
        return null;
    }

    const loadedModule: any | null = await loadModuleFromString(
        moduleBuffer,
        config.modulesCache,
        'ts'
    );

    return moduleToComponentInstance(loadedModule);
}

export async function getComponentFromPath(componentPath: string, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {

    if (!componentPath) {
        return null;
    }

    if (componentPath.endsWith('.ts') || componentPath.endsWith('.js')) {
        const loadedModule: any | null = await loadModuleFromPath(
            componentPath,
            config.modulesCache
        );
        return moduleToComponentInstance(loadedModule);
    }

    return new FileComponent(componentPath);
    //return getComponentFromPath(componentPath, config);
}

/*export async function getComponent(dataCtx?: DocumentData | null, moduleContent?: FalsyAble<string>, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {
    const modulePath: FalsyAble<string> = getTargetModulePath(dataCtx);
    return getComponentFrom(modulePath, config, moduleContent);
}*/

export async function getComponentFromResource(
    resource: IProcessResource,
    config: SsgConfig
): Promise<FalsyAble<IInternalComponent>> {

    if (resource.src?.endsWith('.ts') || resource.srcFormat == 'ts' || resource.src?.endsWith('.js') || resource.srcFormat == 'js') {
        const inputPath: string | undefined = resource.src;
        if (inputPath) {
            const filePathComponent: FalsyAble<IInternalComponent> = await getComponentFromPath(inputPath, config);
            return filePathComponent;
        }

        if (resource.content) {
            const bufferComponent: FalsyAble<IInternalComponent> = await getComponentFromBuffer(resource.content, config);
            if (bufferComponent) {
                return bufferComponent;
            }
        }

        return null;
    }
}

/*export async function getTsComponentFrom(componentPath: FalsyAble<string>, config: SsgConfig, moduleBuffer: FalsyAble<string>): Promise<FalsyAble<IInternalComponent>> {
    let loadedModule: any = await getTsModule(moduleBuffer, componentPath, config?.tsModulesCache);
    if (!loadedModule) {
        return null;
    }

    return moduleToComponentInstance(loadedModule);
}*/

/*export function getTargetModulePath(dataCtx: FalsyAble<DocumentData>): FalsyAble<string> {
    if (!dataCtx) {
        return null;
    }
    const componentModulePath: string = dataCtx?.inputPath || dataCtx?.path || dataCtx?.src;
    return componentModulePath;
}*/
