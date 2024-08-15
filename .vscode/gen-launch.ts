import { arrayifyFilter, inflateTemplateVars, loadDataAsync, loadDataSources } from "@markus/ts-node-util-mk1";
import path from "path";
import * as fs from 'fs';

export async function getConfigurationArrayFrom(jsonFilePath: string): Promise<any[]> {
    const loadedJson: any = await loadDataAsync(jsonFilePath);
    return loadedJson?.configurations || [];
}

export async function getConfigurations(jsonFilePaths: string[]): Promise<any[]> {

    const collectedConfigs: any[][] = await Promise.all(jsonFilePaths.map((filePath) => getConfigurationArrayFrom(filePath)));

    return collectedConfigs.flat();
}

export function inflateTemplatedValuesIn(targetDict: any, valuesDict: any): any {

    if (typeof targetDict === 'string') {
        return inflateTemplateVars(targetDict, valuesDict, undefined, undefined, '[$]?');
    }

    if (typeof targetDict !== 'object') {
        return targetDict;
    }

    for (const key in targetDict) {

        const currentItemValue = targetDict[ key ];

        targetDict[ key ] = inflateTemplatedValuesIn(currentItemValue, valuesDict);
    }
    return targetDict;
}

const specialKeys: string[] = [
    'default',
    'extend',
    'parametrize',
    'parametrize-keys'
];

export function assignMergeDefaults(target: any, src: any): any {

    if (!target) {
        target = {};
    }

    for (const key in src) {
        if (key === 'params') {
            target.params = Object.assign(target.params || {}, src.params);
        }
        else if (src[ key ]) {
            target[ key ] = src[ key ];
        }
    }

    return target;
}

export function parserSpecialKeyDict(content: any, key: string, currentDefault: any = {}): null | any[] {
    if (key === 'default') {
        currentDefault = assignMergeDefaults(currentDefault, content);
        return null;
    }
    if (key === 'parametrize' || key === 'parametrize-keys') {

        const subLaunchConfigs: any[] = [];

        for (const parameters of content) {

            let virtualOverrideEntry: any = {};

            if (typeof parameters === 'string') {
                virtualOverrideEntry = {
                    params: {
                        key: parameters
                    }
                };
            }
            else {
                virtualOverrideEntry = {
                    params: parameters
                };
            }

            let key = null;
            if (virtualOverrideEntry.key) {
                key = parameters.key;
            }
            const branchSubLaunchConfigs: any[] = getLaunchConfigsFromGenJson(virtualOverrideEntry, key, currentDefault);
            subLaunchConfigs.push(...branchSubLaunchConfigs);
        }

        return subLaunchConfigs;
    }
    return null;
}

export function cloneDict(dict) {
    return JSON.parse(JSON.stringify(dict));
}

export function getLaunchConfigsFromGenJson(genJson: any, currentKey: string | null = null, parentDefault: any = {}): any[] {

    if (genJson.params || !genJson.default) {

        let merged = assignMergeDefaults({}, parentDefault);
        merged = assignMergeDefaults(merged, genJson);

        if (!merged.params) {
            merged.params = {};
        }

        if (!merged.params.key) {
            merged.params.key = currentKey;
        }
        const paramsDict: any = merged.params;

        delete merged.params;

        const paramScopedDict = {
            params: paramsDict
        };

        const mergedClone = cloneDict(merged);

        const inflatedValues = inflateTemplatedValuesIn(mergedClone, paramScopedDict);

        return [
            inflatedValues
        ];
    }

    let currentDefault = cloneDict(parentDefault);

    const subLaunchConfigs: any[] = [];

    for (const key in genJson) {

        const currentItemValue: any = genJson[ key ];

        let handleItemFn: Function = getLaunchConfigsFromGenJson;
        if (specialKeys.includes(key)) {
            handleItemFn = parserSpecialKeyDict;
        }

        const branchSubLaunchConfigs: any[] | null = handleItemFn(currentItemValue, key, currentDefault);
        if (branchSubLaunchConfigs) {
            subLaunchConfigs.push(...branchSubLaunchConfigs);
        }
    }

    return subLaunchConfigs;
}

export async function inflateGenerateJson(genJson: any, filePath: string): Promise<any> {

    //const loadedGenJson: any = await loadDataAsync(generatorFilePath);

    const targetLaunch: any = {
        version: '0.2.0',
        configurations: []
    };

    //Must be real launch config not generator def
    if (genJson.extend) {
        const extendPaths = arrayifyFilter(genJson.extend);
        const extendFilePaths: string[] = extendPaths.map((extendPath) => path.join(path.dirname(filePath), extendPath));
        //targetLaunch.configurations = await getConfigurations(extendFilePaths);
    }

    const generatedLaunchConfigs: any[] = getLaunchConfigsFromGenJson(genJson);
    targetLaunch.configurations.push(...generatedLaunchConfigs);

    return targetLaunch;
}


export async function generateLaunchConfig(
    generatorJsonPath: string,
    targetFilePath: string,
    baseLaunchConfig: any = null,
): Promise<any> {

    const loadedGenJson: any = await loadDataAsync(generatorJsonPath);

    let inflatedLaunchJson: any = await inflateGenerateJson(loadedGenJson, generatorJsonPath);

    if (baseLaunchConfig) {
        const inflatedConfigurations = inflatedLaunchJson.configurations || [];
        inflatedLaunchJson = baseLaunchConfig;
        if (!inflatedLaunchJson.configurations) {
            inflatedLaunchJson.configurations = [];
        }
        inflatedLaunchJson.configurations.push(...inflatedConfigurations);
    }

    const jsonString = JSON.stringify(inflatedLaunchJson, null, 4);
    await fs.promises.writeFile(targetFilePath, jsonString);

    return inflatedLaunchJson;
}


const launchFilePath: string = path.join(__dirname, './launch.json');
//const targetFilePath: string = path.join(__dirname, './launch-generated.json');
const generatorFilePath: string = path.join(__dirname, './launch-configs-template.json');
const targetFilePath: string = path.join(__dirname, './launch.json');


generateLaunchConfig(
    generatorFilePath,
    targetFilePath,
    {
        'version': '0.2.0'
    }
);