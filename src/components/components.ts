import type { SsgConfig } from "../config";
import type { FalsyAble } from "@markus/ts-node-util-mk1";
import { callClassConstructor, getFirstInstanceTargetClass, getModuleId, getTsModule } from "../module-loading/ts-modules";
import { BaseComponent, DocumentData, IInternalComponent } from "./base-component";
import { PassthroughComponent } from "./default/passthrough.component";
import { FileComponent } from "./default/file.component";
import type Module from "module";
import type { IProcessResource } from "../pipeline/i-processor";


export function getComponentIdFromPath(runnerPath: string): string {
    return getModuleId(runnerPath, '.component');
}

/*export function getTargetModulePath(dataCtx: FalsyAble<DocumentData>): FalsyAble<string> {
    if (!dataCtx) {
        return null;
    }
    const componentModulePath: string = dataCtx?.inputPath || dataCtx?.path || dataCtx?.src;
    return componentModulePath;
}*/

export interface IExternalComponentModule extends Module {
    default?: any,
    data?: any,
    render?: any;
}

//Only 1 component per file is allowed right now
export function moduleToComponentInstance(module: IExternalComponentModule): FalsyAble<IInternalComponent> {

    let componentInstance: BaseComponent | null = null;
    const passThroughComponent: PassthroughComponent = new PassthroughComponent();

    const defaultExport = module.default;
    if (defaultExport) {
        if (defaultExport.constructor) {
            //A component class is exported
            componentInstance = callClassConstructor(defaultExport.constructor);
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
        componentInstance = getFirstInstanceTargetClass(module, '.+Component.*', [ 'render' ]);
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
        componentInstance.render = async (dataCtx?: DocumentData | null, config?: SsgConfig) => {
            return {
                content: renderContent,
                data: dataCtx,
            };
        };
    }
    if (componentInstance.data && typeof componentInstance.data === 'object') {

        const staticData: Object = componentInstance.data;
        componentInstance.data = async (dataCtx?: DocumentData | null, config?: SsgConfig) => {
            return {
                content: '',
                data: staticData //Object.assign(staticData, dataCtx),
            };
        };
    }

    //TODO add special component: not function and export is specified, but the 'data', 'config' properties can be assumed to
    //be available during runtime and the compiled document string is printed to std.out

    return componentInstance as FalsyAble<IInternalComponent>;
}

export async function getTsComponentFrom(componentPath: FalsyAble<string>, config: SsgConfig, moduleBuffer: FalsyAble<string>): Promise<FalsyAble<IInternalComponent>> {
    let loadedModule: any = await getTsModule(moduleBuffer, componentPath, config?.tsModulesCache);
    if (!loadedModule) {
        return null;
    }

    return moduleToComponentInstance(loadedModule);

    //const componentInstance: BaseComponent = loadedModule.default;

    /*if (componentPath) {
        const componentId: string = getComponentIdFromPath(componentPath);
        (componentInstance as any).id = componentId;
    }*/

    //return componentInstance;
}

export async function getTsComponentFromBuffer(moduleBuffer: string, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {

    if (!moduleBuffer) {
        return null;
    }
    return getTsComponentFrom(null, config, moduleBuffer);
}

export async function getComponentFromPath(componentPath: string, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {

    if (!componentPath) {
        return null;
    }

    if (componentPath.endsWith('.ts')) {
        return getTsComponentFrom(componentPath, config, null);
    }

    return new FileComponent(componentPath);
    //return getComponentFromPath(componentPath, config);
}

/*export async function getComponent(dataCtx?: DocumentData | null, moduleContent?: FalsyAble<string>, config?: SsgConfig): Promise<FalsyAble<IInternalComponent>> {
    const modulePath: FalsyAble<string> = getTargetModulePath(dataCtx);
    return getComponentFrom(modulePath, config, moduleContent);
}*/

export async function getTsComponentFromResource(resource: IProcessResource, config: SsgConfig): Promise<FalsyAble<IInternalComponent>> {
    if (resource.data?.document?.inputFormat !== 'ts') {
        return null;
    }

    const inputPath: string | undefined = resource.data?.document?.src;
    if (inputPath) {
        const filePathComponent: FalsyAble<IInternalComponent> = await getComponentFromPath(inputPath, config);
        return filePathComponent;
    }

    if (resource.content) {
        const bufferComponent: FalsyAble<IInternalComponent> = await getTsComponentFromBuffer(resource.content, config);
        if (bufferComponent) {
            return bufferComponent;
        }
    }

    return null;
}