import { arrayifyFilter, inflateTemplateVars, loadDataAsync, loadDataSources } from "@markus/ts-node-util-mk1";
import path from "path";
import * as fs from 'fs';
import { ArgumentParser } from 'argparse';

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
): Promise<void> {

    console.log(`Generating config '${generatorJsonPath}' --> '${targetFilePath}'`);

    const loadedGenJson: any = await loadDataAsync(generatorJsonPath);
    if (!loadedGenJson) {
        return;
    }

    let inflatedLaunchJson: any = await inflateGenerateJson(loadedGenJson, generatorJsonPath);

    if (!inflatedLaunchJson.configurations) {
        inflatedLaunchJson.configurations = [];
    }

    console.log(`Successfully generated '${inflatedLaunchJson.configurations.length}' configurations from '${generatorJsonPath}'`);

    if (baseLaunchConfig) {
        const inflatedConfigurations = inflatedLaunchJson.configurations || [];
        inflatedLaunchJson = baseLaunchConfig;
        if (!inflatedLaunchJson.configurations) {
            inflatedLaunchJson.configurations = [];
        }
        inflatedLaunchJson.configurations.push(...inflatedConfigurations);
    }

    if (targetFilePath) {

        fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });

        const jsonString = JSON.stringify(inflatedLaunchJson, null, 4);

        console.log(`Writing generated launch.json to '${targetFilePath}'`);

        await fs.promises.writeFile(targetFilePath, jsonString);
    }

    return inflatedLaunchJson;
}

//const generatorFilePath: string = path.join(__dirname, './launch-generator-config.json');
//const targetFilePath: string = path.join(__dirname, './launch.json');

export function main() {
    const parser = new ArgumentParser({
        description: 'Generate launch.json from launch-generator config'
    });

    parser.add_argument('-s', '--source', { help: 'Source path to consume', default: '.vscode/launch-generator-config.json' });
    parser.add_argument('-t', '--target', { help: 'Target path to write to', default: '.vscode/launch.json' });
    parser.add_argument('-tv', '--target_version', { help: 'launch.json version field value', default: '0.2.0' });
    parser.add_argument('-y', '--overwrite', { help: 'Overwrite the --target file without making a backup', action: 'store_true' });

    const args: any = parser.parse_args();

    if (!fs.existsSync(args.source)) {
        throw new Error(`Source file at ${args.source} does not exist -> Exiting launch.json generation`);
    }
    if (!args.target) {
        throw new Error(`Target path was empty --> exiting`);
    }

    if (fs.existsSync(args.target) && !args.overwrite) {

        const parsedTargetPath: path.ParsedPath = path.parse(args.target);

        const targetBackupPath: string = path.join(parsedTargetPath.dir, parsedTargetPath.name + "-backup.json");

        console.log(`Lauch json already exists -> making backup at ${targetBackupPath}`);

        if (fs.existsSync(targetBackupPath)) {
            throw new Error(`Backup path at ${args.source} does already exist -> no overwrite performed
                To do so call with the '-y' option to overwrite without backup, or delete the backup first
            `);
        }

        fs.copyFileSync(args.target, targetBackupPath);
        console.log(`Created backup of ${args.target} at ${targetBackupPath}`);
    }

    generateLaunchConfig(
        args.source,
        args.target,
        {
            'version': args.target_version
        }
    );
}

if (require.main?.filename === __filename) {
    main();
}