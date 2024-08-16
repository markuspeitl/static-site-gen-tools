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