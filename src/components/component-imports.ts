import { resolveDataRefs } from "./resolve-component-path-refs";
import type { SsgConfig } from "../config";
import type { IProcessResource } from "../pipeline/i-processor";
import type { IInternalComponent } from "./base-component";
import { getImportComponentsPool } from "./components";
import { isEmpty } from "./helpers/array-util";
import path from "path";

export function getResourceImportsCache(resource: IProcessResource, config: SsgConfig): Record<string, IInternalComponent> {
    let selectedDependencies: Record<string, IInternalComponent> = {};
    if (resource.data?.importCache && !isEmpty(resource.data?.importCache)) {
        selectedDependencies = resource.data?.importCache;
    }
    else {
        selectedDependencies = config.defaultComponentsCache || {};
    }
    return selectedDependencies;
}

export async function getResourceImports(resource: IProcessResource, config: SsgConfig): Promise<Record<string, IInternalComponent>> {

    if (!resource) {
        return {};
    }
    if (!resource.data) {
        resource.data = {};
    }
    if (!resource.data.import) {
        resource.data.import = [];
    }
    const importPaths: string[] = resource.data.import;
    const currentImportComponentsPool: Record<string, IInternalComponent> = await getImportComponentsPool(importPaths, config);

    resource.data.importCache = currentImportComponentsPool;

    return currentImportComponentsPool;
}


export async function resolveResourceImports(fromRootDirPath: string, resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

    resource = resolveDataRefs(fromRootDirPath, resource, config);
    if (!resource.data) {
        resource.data = {};
    }
    resource.data.importCache = await getResourceImports(resource, config);
    return resource;
}

export async function resolveImportsFromDocDir(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    if (!resource.data) {
        return resource;
    }
    let currentDocumentDir: string = "";
    if (resource.data.document.src) {
        currentDocumentDir = path.parse(resource.data.document.src).dir;
    }

    return resolveResourceImports(currentDocumentDir, resource, config);
}