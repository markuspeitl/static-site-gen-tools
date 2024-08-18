import { resolveDataRefs } from "./resolve-component-path-refs";
import type { SsgConfig } from "../config";
import type { IProcessResource, IResourceDoc } from "../pipeline/i-processor";
import type { IInternalComponent } from "./base-component";
import path from "path";
import { getResourceDoc } from "../processing/shared/document-helpers";

/*export function getResourceImportsCache(resource: IProcessResource, config: SsgConfig): Record<string, IInternalComponent> {
    let selectedDependencies: Record<string, IInternalComponent> = {};
    if (resource.importCache && !isEmpty(resource.importCache)) {
        selectedDependencies = resource.importCache;
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
    if (!resource) {
        resource = {};
    }
    if (!resource.import) {
        resource.import = [];
    }
    const importPaths: string[] = resource.import;
    const currentImportComponentsPool: Record<string, IInternalComponent> = await getImportComponentsPool(importPaths, config);

    resource.importCache = currentImportComponentsPool;

    return currentImportComponentsPool;
}


export async function resolveResourceImports(fromRootDirPath: string, resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

    resource = resolveDataRefs(fromRootDirPath, resource, config);
    if (!resource) {
        resource = {};
    }
    resource.importCache = await getResourceImports(resource, config);
    return resource;
}

export async function resolveImportsFromDocDir(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    if (!resource) {
        return resource;
    }
    let currentDocumentDir: string = "";
    if (resource.document.src) {
        currentDocumentDir = path.parse(resource.document.src).dir;
    }

    return resolveResourceImports(currentDocumentDir, resource, config);
}*/

export async function resolveDataRefPathsFromDocDir(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    if (!resource) {
        return resource;
    }
    let currentDocumentDir: string = "";

    const document: IResourceDoc = getResourceDoc(resource);

    if (document.src) {
        currentDocumentDir = path.parse(document.src).dir;
    }

    resource = resolveDataRefs(currentDocumentDir, resource, config);
    return resource;
}