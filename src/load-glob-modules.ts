
/*export async function processDir(inputPath: string, outputPath: string, config: SsgConfig): Promise<IProcessResource> {

}*/

import path from "path";
import { settleValueOrNullFilter } from "./utils/promise-util";
import { anchorAndGlob } from "./utils/globbing";
import { getFirstInstanceTargetClass, getModuleId } from "./module-loading/ts-modules";
import Module from "module";
import { IProcessor } from "./pipeline/i-processor";

export async function loadProcessorFromPath<InstanceType extends IProcessor>(modulePath: string, targetDict: Record<string, InstanceType>, nameToIdPostfix: string = ''): Promise<InstanceType> {

    const moduleId = getModuleId(modulePath, nameToIdPostfix);

    const importedModule: Module = await import(modulePath);

    const moduleInstance = getFirstInstanceTargetClass(importedModule, '.+', [ 'process' ]);

    if (targetDict) {
        targetDict[ moduleId ] = moduleInstance;
    }

    if (!moduleInstance.id) {
        moduleInstance.id = moduleId;
    }

    return moduleInstance;
}

export async function loadProcessorArrayFromPaths<InstanceType extends IProcessor>(anchorPaths: string[], filesMatchGlobs: string[], moduleNamePostfix: string, cacheTargetDict?: Record<string, InstanceType>): Promise<InstanceType[]> {

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

export async function loadProcessorInstancesFromPaths<InstanceType extends IProcessor>(anchorPaths: string[], filesMatchGlobs: string[], moduleNamePostfix: string): Promise<Record<string, InstanceType>> {

    const resultModulesDict: Record<string, InstanceType> = {};

    await loadProcessorArrayFromPaths(anchorPaths, filesMatchGlobs, moduleNamePostfix, resultModulesDict);

    return resultModulesDict;
}