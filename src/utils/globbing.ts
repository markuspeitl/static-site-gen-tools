import fastglob from 'fast-glob';
import path from 'path';
import fs from 'fs';
import { BaseComponent } from '../components/base-component';
import { FalsyAble } from '../components/helpers/generic-types';
import { getFsNodeStat } from './fs-util';
import { filterFalsy } from './util';

export function anchorGlobs(globPatterns: string[], atPath: string, pathJoinAnchor: boolean = false): string[] {
    const rootedGlobs = globPatterns.map((inPathGlob) => {
        if (!pathJoinAnchor) {
            return atPath + inPathGlob;
        }
        return path.join(atPath, inPathGlob);
    });
    //path.join(rootDir as string, inPageGlob)
    return rootedGlobs;
}

async function findFirstGlobbed(globPatterns: string[], rootDir: string): Promise<string | null> {

    if (!rootDir) {
        rootDir = "";
    }

    const rootedGlobs = anchorGlobs(globPatterns, rootDir);


    const matchedPaths: string[] = await fastglob(rootedGlobs, {
        caseSensitiveMatch: false, // insensitive
        dot: true,
    });

    if (matchedPaths.length !== 1) {
        throw new Error(`Invalid amount of found pages for ${globPatterns} found were ${matchedPaths.length}`);
    }

    if (matchedPaths && matchedPaths.length > 0) {
        return matchedPaths[ 0 ];
    }

    return null;

}

export async function anchorAndGlob(globPatterns: string[], anchorPath?: string, pathJoinAnchor: boolean = false): Promise<string[]> {

    if (!anchorPath) {
        anchorPath = '';
    }

    const anchoredGlobs = anchorGlobs(globPatterns, anchorPath, pathJoinAnchor);

    const matchedPaths: string[] = await fastglob(anchoredGlobs, {
        caseSensitiveMatch: false, // insensitive
        dot: true,
    });
    return matchedPaths;
}

export async function findWithAnyExt(dirPath: string, basefileName: string, includeExtensionLess: boolean = false): Promise<string[]> {

    let followingNameGlob = '.*';
    if (includeExtensionLess) {
        followingNameGlob = '*';
    }

    let fileGlobs = [
        '/' + basefileName + followingNameGlob
    ];
    fileGlobs = anchorGlobs(fileGlobs, dirPath);

    const matchedPaths: string[] = await fastglob(fileGlobs, {
        caseSensitiveMatch: false, // insensitive
        dot: true,
    });
    return matchedPaths;
}

export async function globInDirsCollectFlat(anchorDirs: string[], subGlobs: string[], processPathFn: (filePath: string, ...fnArgs: any[]) => Promise<any>, ...fnArgs: any[]): Promise<any> {

    const results: any[] = [];
    for (const anchorDir of anchorDirs) {

        const nodeStat: fs.Stats | null = await getFsNodeStat(anchorDir);
        if (nodeStat && nodeStat.isFile()) {
            results.push(await processPathFn(anchorDir, ...fnArgs));
        }
        else {
            const globMatchedPaths: string[] = await anchorAndGlob(subGlobs, path.resolve(anchorDir), false);

            const processingResultPromises: Promise<FalsyAble<BaseComponent>>[] = globMatchedPaths.map((matchedPath: string) => processPathFn(matchedPath, ...fnArgs));
            const processingResults: FalsyAble<BaseComponent>[] = await Promise.all(processingResultPromises);
            const truthyResults: any[] = filterFalsy(processingResults);
            results.push(truthyResults);
        }
    }
    return results.flat();
}