import path from "path";
import { IProcessResource } from "../../processors/shared/i-processor-resource";
import { getCleanExt } from "@markus/ts-node-util-mk1";

export function getDocumentTargetPath(resource: IProcessResource): string | null {
    if (!resource.target) {
        return null;
    }

    return path.resolve(resource.target);
}
export function getDocumentTargetSubPath(resource: IProcessResource, relativePath: string): string | null {

    const targetDirPath: string | null = getDocumentTargetPath(resource);
    if (!targetDirPath) {
        return null;
    }

    return path.join(targetDirPath, relativePath);
}

export function getResourceDoc(resource: IProcessResource): IProcessResource {
    if (!resource) {
        resource = {};
    }
    return resource as IProcessResource;
}

export function getTargetFromFormat(
    srcPath: string,
    targetFormat?: string,
    targetDirPath?: string,
    overridePostFix?: string,
): string {

    if (!targetDirPath) {
        targetDirPath = path.dirname(srcPath);
    }
    const parsedSrcPath: path.ParsedPath = path.parse(srcPath);

    if (!overridePostFix) {
        overridePostFix = '.' + targetFormat;
    }

    const targetPath: string = path.join(targetDirPath, parsedSrcPath.name + overridePostFix);
    return targetPath;
}

export function getTargetFromResourceFormat(
    resource: IProcessResource,
    targetFormat?: string,
    targetDirPath?: string,
    overridePostFix?: string,
) {
    if (resource.target) {
        return resource.target;
    }
    if (resource.targetFormat) {
        targetFormat = resource.targetFormat;
    }
    if (!targetFormat) {
        targetFormat = resource.srcFormat;
    }
    if (!resource.src) {
        return;
    }

    return getTargetFromFormat(
        resource.src,
        targetFormat,
        targetDirPath,
        overridePostFix
    );
}

export function setTargetFromFormat(
    resource: IProcessResource,
    targetFormat?: string,
    targetDirPath?: string,
    overridePostFix?: string,
): void {

    if (!document) {
        return;
    }

    resource.target = getTargetFromResourceFormat(
        resource,
        targetFormat,
        targetDirPath,
        overridePostFix
    );

    if (resource.src === resource.target) {
        throw Error(`Document src and target paths ${resource.src} are identical --> not allowed to prevent data loss`);
    }
}

export interface IWriteAbleResource extends IProcessResource {
    target: string;
    targetFormat: string;
    targetParent: string;
}

export function toWriteableResource(
    resource: IProcessResource,
): IWriteAbleResource | null {

    if (resource.srcFormat && !resource.targetFormat) {
        resource.targetFormat = resource.srcFormat;
    }

    if (!resource.targetFormat && resource.target) {
        resource.targetFormat = getCleanExt(resource.target);
    }

    if (!resource.target) {
        if (!resource.src) {
            return null;
        }

        if (!resource.target) {
            resource.target = getTargetFromFormat(resource.src, resource.targetFormat);
        }
    }

    if (!resource.target) {
        return null;
    }

    resource.targetParent = path.dirname(resource.target);

    return resource as IWriteAbleResource;
}


export interface IReadResource extends IProcessResource {
    src: string;
    srcFormat: string;
}

export function getReadableResource(
    resource: IProcessResource,
): IReadResource | null {

    if (resource.src && !resource.srcFormat) {
        resource.srcFormat = getCleanExt(resource.src);
    }
    if (!resource.src) {
        return null;
    }
    return resource as IReadResource;
}
