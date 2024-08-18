import type { IProcessor } from "./i-processor";
import { getFirstMatchedInModuleConstruct, getModuleId, getOrCreateCacheItem, settleValueOrNullFilter } from "@markus/ts-node-util-mk1";
import { anchorAndGlob } from "@markus/ts-node-util-mk1";
import path from "path";

export async function loadNewProcessorFromPath<InstanceType extends IProcessor>(
    modulePath: string,
    nameToIdPostfix: string = ''
): Promise<InstanceType> {
    const moduleId = getModuleId(modulePath, nameToIdPostfix);

    const importedModule: any = await import(modulePath);

    if (importedModule.process) {
        if (!importedModule.id) {
            importedModule.id = moduleId;
        }

        return importedModule as InstanceType;
    }

    const moduleInstance: InstanceType | null = getFirstMatchedInModuleConstruct(
        importedModule,
        '.+',
        [ 'process' ]
    );

    if (!moduleInstance) {
        throw new Error(`Failed loading processor instance from ${modulePath} -> is there are class with a 'process' property at this path?`);
    }

    if (!moduleInstance.id) {
        moduleInstance.id = moduleId;
    }

    return moduleInstance;
}

export async function loadProcessorFromPath<InstanceType extends IProcessor>(
    modulePath: string,
    targetDict: Record<string, InstanceType>,
    nameToIdPostfix: string = ''
): Promise<InstanceType> {

    return getOrCreateCacheItem(
        modulePath,
        loadNewProcessorFromPath,
        [ targetDict ],
        nameToIdPostfix
    );
}

export async function loadProcessorArrayFromPaths<InstanceType extends IProcessor>(
    anchorPaths: string[],
    filesMatchGlobs: string[],
    moduleNamePostfix: string,
    cacheTargetDict?: Record<string, InstanceType>
): Promise<InstanceType[]> {

    const resultModulesDict: Record<string, InstanceType> = {};

    const resultInstanceArrays: Array<Array<InstanceType>> = [];

    for (const anchorPath of anchorPaths) {

        const modulePaths: string[] = await anchorAndGlob(filesMatchGlobs, path.resolve(anchorPath), true);

        const importModulePromises: Promise<any>[] = modulePaths.map((modulePath: string) => loadProcessorFromPath(modulePath, resultModulesDict, moduleNamePostfix));

        const loadedModuleInstances: InstanceType[] = await settleValueOrNullFilter(importModulePromises);
        resultInstanceArrays.push(loadedModuleInstances);

    }
    return resultInstanceArrays.flat();
}

export async function loadProcessorInstancesFromPaths<InstanceType extends IProcessor>(
    anchorPaths: string[],
    filesMatchGlobs: string[],
    moduleNamePostfix: string
): Promise<Record<string, InstanceType>> {

    const resultModulesDict: Record<string, InstanceType> = {};

    await loadProcessorArrayFromPaths(anchorPaths,
        filesMatchGlobs,
        moduleNamePostfix,
        resultModulesDict
    );

    return resultModulesDict;
}