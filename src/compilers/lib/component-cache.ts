import Module from "module";
import { BaseComponent } from "../../components/base-component";
import { FalsyAble } from "../../components/helpers/generic-types";
import { SsgConfig } from "../../config";
import { anchorAndGlob } from "../../utils/globbing";
import * as fs from 'fs';
import { loadTsModule } from "../../module-loading/ts-modules";
import { filterFalsy } from "../../components/helpers/array-util";

export function detectComponentFiles(componentCandidatePaths: string[], config: SsgConfig): string[] {
    return componentCandidatePaths;
}

export async function loadComponentModule(path: string, config: SsgConfig): Promise<Module | null> {
    const componentModule: Module | null = await loadTsModule(path, config?.tsModulesCache);

    if (!config.tsComponentsCache) {
        config.tsComponentsCache = {};
    }
    if (componentModule) {
        config.tsComponentsCache[ path ] = componentModule;
    }
    else {
        console.log(`Failed loading component module at ${path}.`);
    }

    return componentModule;
}

export async function loadComponentModules(componentFilePaths: string[], config: SsgConfig): Promise<Array<Module | null>> {

    const importPromises = componentFilePaths.map((componentFile: string) => loadComponentModule(componentFile, config));
    return Promise.all(importPromises);
}

export async function loadComponentImports(srcFilePath: string, importPaths: FalsyAble<string[]>, config: SsgConfig = {}): Promise<BaseComponent[]> {
    if (!importPaths) {
        return [];
    }

    const importedComponents: BaseComponent[] = [];

    //TODO load all found components in the target path into cache

    const importedFiles: string[] = await anchorAndGlob(importPaths, srcFilePath);
    importedFiles.filter((nodePath: string) => fs.statSync(nodePath).isFile());

    const importedComponentFiles: string[] = detectComponentFiles(importedFiles, config);
    //const importPromises = importedComponentFiles.map((componentFile: string) => loadComponentModule(componentFile, config));

    const importedModules = await loadComponentModules(importedComponentFiles, config);
    const definedImportedModules = filterFalsy(importedModules);

    return definedImportedModules as BaseComponent[];
}