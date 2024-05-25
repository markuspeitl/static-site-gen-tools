import path from "path";
import { resolvePrimitiveLeaves } from "./walk-recurse";

export function isDirPath(value: any): boolean {
    return isPath(value) && value.endsWith('/');
}

export function possibleDirPath(value: any): boolean {
    return isPath(value);
}

export function isPath(value: any): boolean {
    if (typeof value === 'string') {
        const hasSeperator = value.includes(path.sep);
        if (!hasSeperator) {
            return false;
        }
        return true;
    }
    return false;
}

export function isRelativePath(value: any): boolean {

    if (isPath(value) && (value.startsWith('./') || value.startsWith('../'))) {
        return true;
    }
    return false;
}

export function detectResolveRelativePath(relPath: string, rootPath: string): string | undefined {

    if (isRelativePath(relPath)) {
        const joinedPath = path.join(rootPath, relPath);
        return path.resolve(joinedPath);
    }
    return undefined;
}

export function resolveRelativePaths(dict: any, rootPath: string): any {
    return resolvePrimitiveLeaves(dict, (value) => detectResolveRelativePath(value, rootPath));
}