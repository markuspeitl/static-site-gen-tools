import type { SsgConfig } from "../config/ssg-config";
import type { IProcessResource, IResourceDoc } from "../processors/shared/i-processor-resource";

import { resolveRelativePaths } from "@markus/ts-node-util-mk1";
import { arrayify } from "@markus/ts-node-util-mk1";

import path from "path";
import { getResourceDoc } from "../processors/shared/document-helpers";

export function resolveImportPropToPath(importObj: any): string {
    /*if (typeof importObj === 'string') {
        return importObj;
    }*/
    if (typeof importObj === 'object') {
        return importObj.path;
    }
    return importObj;
}

export function resolveDocPathsFrom(
    fromRootDirPath: string,
    resource: IProcessResource,
    config: SsgConfig
): IProcessResource {

    if (!fromRootDirPath) {
        return resource;
    }

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

    for (let i = 0; i < resource.import.length; i++) {
        resource.import[ i ] = resolveImportPropToPath(resource.import[ i ]);
    }

    resource = resolveRelativePaths(resource, fromRootDirPath);

    return resource;
}

export function resolveDocPathsFromParentFile(
    parentFilePath: string,
    resource: IProcessResource,
    config: SsgConfig
): IProcessResource {

    if (!parentFilePath) {
        return resource;
    }
    const currentDocumentDir: string = path.dirname(parentFilePath);
    const dataResolvedResource: IProcessResource = resolveDocPathsFrom(currentDocumentDir, resource, config);

    return dataResolvedResource;
}

export function resolveDocPathsFromParent(
    parentResource: IProcessResource,
    resource: IProcessResource,
    config: SsgConfig
): IProcessResource {

    if (!parentResource || !parentResource.document?.src) {
        return resource;
    }
    return resolveDocPathsFromParentFile(parentResource.document?.src, resource, config);
}


export async function resolveDocPathsFromSrc(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    if (!resource.document?.src) {
        return resource;
    }

    if (!resource.document?.src) {
        return resource;
    }

    const currentDocumentDir: string = path.dirname(resource.document.src);
    const dataResolvedResource: IProcessResource = resolveDocPathsFrom(currentDocumentDir, resource, config);

    return dataResolvedResource;
}

export async function resolveDocPathsFromSourceDir(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    if (!resource) {
        return resource;
    }
    let currentDocumentDir: string = "";

    const document: IResourceDoc = getResourceDoc(resource);

    if (document.src) {
        currentDocumentDir = path.parse(document.src).dir;
    }

    resource = resolveDocPathsFrom(currentDocumentDir, resource, config);
    return resource;
}