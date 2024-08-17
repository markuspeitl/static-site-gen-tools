import path from "path";
import { IProcessResource } from "../../pipeline/i-processor";

export function getDocumentTargetPath(resource: IProcessResource): string | null {
    if (!resource.data?.document?.target) {
        return null;
    }

    return path.resolve(resource.data.document.target);
}
export function getDocumentTargetSubPath(resource: IProcessResource, relativePath: string): string | null {

    const targetDirPath: string | null = getDocumentTargetPath(resource);
    if (!targetDirPath) {
        return null;
    }

    return path.join(targetDirPath, relativePath);
}

export interface ResourceDoc {
    inputFormat: string,
    outputFormat: string,
    src: string,
    target: string;
}

export function getResourceDoc(resource: IProcessResource): ResourceDoc {
    if (!resource.data) {
        resource.data = {};
    }
    if (!resource.data.document) {
        resource.data.document = {};
    }
    return resource.data.document;
}

export function getTargetFromFormat(
    srcPath: string,
    outputFormat?: string,
    targetDirPath?: string,
    overridePostFix?: string,
): string {

    if (!targetDirPath) {
        targetDirPath = path.dirname(srcPath);
    }
    const parsedSrcPath: path.ParsedPath = path.parse(srcPath);

    if (!overridePostFix) {
        overridePostFix = '.' + outputFormat;
    }

    const targetPath: string = path.join(targetDirPath, parsedSrcPath.name + overridePostFix);
    return targetPath;
}

export function getTargetFromDocFormat(
    document: ResourceDoc,
    outputFormat?: string,
    targetDirPath?: string,
    overridePostFix?: string,
) {
    if (document.target) {
        return document.target;
    }
    if (!outputFormat) {
        outputFormat = document.inputFormat;
    }
    if (document.outputFormat) {
        outputFormat = document.outputFormat;
    }

    return getTargetFromFormat(
        document.src,
        outputFormat,
        targetDirPath,
        overridePostFix
    );
}

export function setTargetFromFormat(
    document: ResourceDoc,
    outputFormat?: string,
    targetDirPath?: string,
    overridePostFix?: string,
): void {

    if (!document) {
        return;
    }

    document.target = getTargetFromDocFormat(
        document,
        outputFormat,
        targetDirPath,
        overridePostFix
    );

    if (document.src === document.target) {
        throw Error("Document src and target paths are identical --> not allowed to prevent data loss");
    }
}
