import type { IProcessingNode } from "./i-processor";
import type { FileChainProcessorConfig } from "./i-processor-config";
import path from "path";
import { collectParentPermutations } from "@markus/ts-node-util-mk1";

export interface FileSearchOptions {
    dirs?: string[],
    postfix?: string;
}

//As the processor node configs can contain multiple base paths from which the
//Sub processors can be loaded, we need to check for the sub hierarchy in all of them
//Example: srcDirs: ['test', 'other/test'] --> test/reader, test/compiler, other/test/compiler, other/test/reader ...
export function collectNestedPathPermutations(
    parentAble: { parent?: any; },
    pathArrayKey: string
): string[] {

    const dirPermutationArrays: string[][] = collectParentPermutations(
        parentAble,
        pathArrayKey
    );

    const permutedJoinedPathOptions: string[] = [];
    for (let i = 0; i < dirPermutationArrays.length; i++) {
        const pathParts: string[] = dirPermutationArrays[ i ];
        const joinedPath: string = path.resolve(path.join(...pathParts));
        permutedJoinedPathOptions.push(joinedPath);
    }

    return permutedJoinedPathOptions;
}

export function calculateProcessorFileSearchOpts(
    fileProcessorChainsConfig: FileChainProcessorConfig,
    currentNode: IProcessingNode
): FileSearchOptions {

    const fileSearchConfig: FileSearchOptions = {
        postfix: fileProcessorChainsConfig.fileIdPostfix
    };

    //TODO: filter absolute paths and add to search options
    /*if (currentNode?.srcDirs) {
        for (const dir of currentNode?.srcDirs) {
        }
    }*/

    //Wrong place to recompute this each time, if many deeply nested paths are to be expected
    const selectedTargetDirs: string[] = collectNestedPathPermutations(currentNode, 'srcDirs');
    fileSearchConfig.dirs = selectedTargetDirs;

    return fileSearchConfig;
}