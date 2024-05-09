import fastglob from 'fast-glob';

export function anchorGlobs(globPatterns: string[], atPath: string): string[] {
    const rootedGlobs = globPatterns.map((inPageGlob) => atPath + inPageGlob);//path.join(rootDir as string, inPageGlob)
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

export async function anchorAndGlob(globPatterns: string[], anchorPath?: string): Promise<string[]> {

    if (!anchorPath) {
        anchorPath = '';
    }

    const anchoredGlobs = anchorGlobs(globPatterns, anchorPath);

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