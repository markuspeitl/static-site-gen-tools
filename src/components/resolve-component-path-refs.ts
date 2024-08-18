import path from "path";
import type { SsgConfig } from "../config";
import type { IProcessResource } from "../pipeline/i-processor";
import { resolveRelativePaths } from "@markus/ts-node-util-mk1";
import { arrayify } from "@markus/ts-node-util-mk1";

export function resolveImportPropToPath(importObj: any): string {
    /*if (typeof importObj === 'string') {
        return importObj;
    }*/
    if (typeof importObj === 'object') {
        return importObj.path;
    }
    return importObj;
}

export function resolveDataPaths(fromRootDirPath: string, resource: IProcessResource, config: SsgConfig): IProcessResource {
    if (fromRootDirPath) {
        //const currentDocumentDir: string = path.parse(fromRootPath).dir;
        resource = resolveRelativePaths(resource, fromRootDirPath);
    }
    return resource;
}

export function resolveDataRefs(fromRootDirPath: string, resource: IProcessResource, config: SsgConfig): IProcessResource {
    if (!resource) {
        resource = {};
    }
    //assignAttribsToSelf(dataExtractedDoc.data, 'import');
    if (!resource.import) {
        resource.import = [];
    }
    if (!Array.isArray(resource.import)) {
        resource.import = arrayify(resource.import);
    }
    resource.import = resource.import.map(resolveImportPropToPath);

    resource = resolveDataPaths(fromRootDirPath, resource, config);

    return resource;
}

export function resolveDataFromParentFile(parentFilePath: string, resource: IProcessResource, config: SsgConfig): IProcessResource {
    if (!parentFilePath) {
        return resource;
    }
    const currentDocumentDir: string = path.dirname(parentFilePath);
    const dataResolvedResource: IProcessResource = resolveDataRefs(currentDocumentDir, resource, config);

    return dataResolvedResource;
}

export function resolveDataFromParentResource(parentResource: IProcessResource, resource: IProcessResource, config: SsgConfig): IProcessResource {
    if (!parentResource || !parentResource.document?.src) {
        return resource;
    }
    return resolveDataFromParentFile(parentResource.document?.src, resource, config);
}


export async function resolveDataFromSrc(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    if (!resource.document?.src) {
        return resource;
    }

    if (!resource.document?.src) {
        return resource;
    }

    const currentDocumentDir: string = path.dirname(resource.document.src);
    const dataResolvedResource: IProcessResource = resolveDataRefs(currentDocumentDir, resource, config);

    return dataResolvedResource;
}