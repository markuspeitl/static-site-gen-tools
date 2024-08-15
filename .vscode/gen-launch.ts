import { arrayifyFilter, inflateTemplateVars, loadDataAsync, loadDataSources } from "@markus/ts-node-util-mk1";
import path from "path";
import * as fs from 'fs';


const launchFilePath: string = path.join(__dirname, './launch.json');
const targetFilePath: string = path.join(__dirname, './launch-generated.json');
const generatorFilePath: string = path.join(__dirname, './launch-configs-template.json');


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
        return inflateTemplateVars(targetDict, valuesDict);
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

export function getLaunchConfigsFromGenJson(genJson: any, currentKey: string | null = null, parentDefault: any = {}): any[] {

    if (genJson.params || !genJson.default) {

        const merged = Object.assign({}, parentDefault, genJson);

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

        return [
            inflateTemplatedValuesIn(merged, paramScopedDict)
        ];
    }

    let currentDefault: any = Object.assign({}, parentDefault || {});

    const subLaunchConfigs: any[] = [];

    for (const key in genJson) {

        const currentItemValue: any = genJson[ key ];

        if (key === 'default') {
            currentDefault = Object.assign(currentDefault, currentItemValue);
        }
        if (key !== 'default' && key !== 'extend') {
            const branchSubLaunchConfigs: any[] = getLaunchConfigsFromGenJson(currentItemValue, key, currentDefault);
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


export async function generateLaunchConfig(generatorJsonPath: string, targetFilePath: string): Promise<any> {

    const loadedGenJson: any = await loadDataAsync(generatorJsonPath);

    const inflatedLaunchJson: any = await inflateGenerateJson(loadedGenJson, generatorJsonPath);

    const jsonString = JSON.stringify(inflatedLaunchJson, null, 4);
    await fs.promises.writeFile(targetFilePath, jsonString);

    return inflatedLaunchJson;
}

generateLaunchConfig(generatorFilePath, targetFilePath);