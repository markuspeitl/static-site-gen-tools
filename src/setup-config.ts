import path from "path";
import { SsgConfig } from "./config";
import { GenericRunner, getInstance, IMasterRunner } from './compilers/generic.runner';
import { anchorAndGlob } from "./utils/globbing";
import { CompileRunner, CompileRunnerModule, loadDefaultRunners } from "./compilers/runners";
import { ArgumentParser } from 'argparse';
import * as lodash from 'lodash';
import { getFsNodeStat } from "./utils/fs-util";
import { FalsyString } from "./components/helpers/generic-types";
import { loadDefaultComponents } from "./components/components";

export function addCliConfigOptions(parser: ArgumentParser): void {

    parser.add_argument('-components', '--defaultComponentImportDirs', '--default_component_dirs', {
        help: `From which directories to load the default components from, that are available from all components to be compiled`,
        nargs: '+'
    });

    parser.add_argument('-runners', '--defaultRunnerDirs', '--runner_dirs', {
        help: `From which directories to load the runner files from, can for instance be used to add plugin runners`,
        nargs: '+'
    });

    parser.add_argument('-mrunner', '--masterCompileRunnerPath', '--master_runner', {
        help: `Path of the master runner that holds the assignment logic which component is compiled by which runner and in which order`,
    });

    parser.add_argument('-cache', '--cacheDir', '--cache_dir', {
        help: `Where to store caching information`,
    });

    parser.add_argument('-data', '--data', {
        help: `JSON encoded string of the initial data passed to the component to be compiled`,
        //nargs: '+'
    });

    parser.add_argument('-config', '--userConfigPath', '--configFile', {
        help: `Path to the user configuration file, for static settings`,
        default: './bssg.config.ts'
    });
    parser.add_argument('-rconfig', '--runtimeConfigPath', '--runtimeConfigFile', {
        help: `Path to the user configuration file, for runtime compiler manipulation`,
        default: './bssg.run.config.ts'
    });
}

export async function parseCliConfig(config: SsgConfig = {}): Promise<SsgConfig> {

    const parser = new ArgumentParser({
        description: 'Generated a populated container from a template'
    });

    parser.add_argument('sourcePath', { help: 'Source path to consume' });
    parser.add_argument('targetPath', { help: 'Target path to write to' });
    addCliConfigOptions(parser);

    const args: any = parser.parse_args();

    if (args.data && args.data.length > 0) {
        args.data = JSON.parse(args.data);
    }

    /*const srcPath: string = args.sourceFilePath;
    const targetPath: string = args.targetFilePath;
    delete args.sourceFilePath;
    delete args.targetFilePath;*/

    //config = Object.assign(config, args);
    config = lodash.merge(config, args);
    return config;
}

export async function parseArgsSetupInitializeConfig(config: SsgConfig = {}): Promise<SsgConfig> {
    config = setUpDefaultConfig(config);
    config = await parseCliConfig(config);
    config = await loadUserConfig(config);
    config = await initializeConfig(config);
    config = await loadUserRuntimeConfig(config);
    return config;
}


export function setUpDefaultConfig(config: SsgConfig = {}): SsgConfig {
    if (!config) {
        config = {};
    }

    config.defaultComponentImportDirs = [
        './src/components/default/'
    ];
    config.defaultComponentsMatchGlobs = [
        '**.component.ts',
        '*.component.ts',
        '.component.ts',
        '**/*.component.ts'
    ];

    config.defaultRunnerDirs = [
        './src/compilers'
    ];
    config.defaultRunnersMatchGlobs = [
        '**.runner.ts',
        '*.runner.ts'
    ];

    config.masterCompileRunnerPath = './src/compilers/generic.runner.ts';

    config.resMatchCompileRunnersDict = {
        '.+.html': [
            'html',
            'njk',
        ],
        '.+.ehtml': [
            'njk',
            'html'
        ],
        '.+.md': [
            'md',
            'njk',
            'html'
        ],
        '.+.njk': [
            'njk',
            'html'
        ],
        '.+.ts': [
            "ts",
            //"md",
            //'njk',
            'html',
        ],
    };

    config.outDir = './dist';
    config.cacheDir = path.join(config.outDir, '/cache');
    config.outFile = 'index.html';

    return config;
}

async function loadOrCallConfigFile(defaultConfig: SsgConfig, configPath?: string): Promise<SsgConfig> {
    if (!configPath) {
        return defaultConfig;
    }

    if (!await getFsNodeStat(configPath)) {
        console.log(`Can not load configPath at ${configPath} -- file does not exist`);
        return defaultConfig;
    }

    const resolvedModulePath: string = path.resolve(configPath);

    const configModule = await import(resolvedModulePath);
    if (configPath.endsWith('.json')) {
        return Object.assign(defaultConfig, configModule);
    }
    const defaultExport = configModule.default;
    if (typeof defaultExport === 'object') {
        return Object.assign(defaultConfig, configModule);
    }
    if (typeof defaultExport === 'function') {
        return defaultExport(defaultConfig);
    }
    if (configModule.configure) {
        return configModule.configure(defaultConfig);
    }
    return defaultConfig;
}

//Json, ts or js
export async function loadUserConfig(defaultConfig: SsgConfig, configPath?: string): Promise<SsgConfig> {
    if (!configPath) {
        configPath = defaultConfig.userConfigPath;
    }
    return loadOrCallConfigFile(defaultConfig, configPath);
}

async function setUpMasterRunner(runnerPath: FalsyString, config: SsgConfig): Promise<void> {
    if (runnerPath) {
        const absModulePath = path.resolve(runnerPath);
        const masterRunnerModule: CompileRunnerModule = await import(absModulePath);
        config.masterCompileRunner = masterRunnerModule.getInstance() as IMasterRunner;

        return;
    }
    config.masterCompileRunner = new GenericRunner();
}

export async function initializeConfig(config: SsgConfig): Promise<SsgConfig> {

    console.time('init');

    if (!config.idCompileRunnersDict) {
        config.idCompileRunnersDict = {};
    }
    if (!config.resMatchCompileRunnersDict) {
        config.resMatchCompileRunnersDict = {};
    }
    await setUpMasterRunner(config.masterCompileRunnerPath, config);
    await loadDefaultRunners(config);
    await loadDefaultComponents(config);
    const initializedConfig = await loadUserRuntimeConfig(config);

    console.timeEnd('init');

    return initializedConfig;
}

export async function loadUserRuntimeConfig(setUpConfig: SsgConfig, configPath?: string): Promise<SsgConfig> {
    if (!configPath) {
        configPath = setUpConfig.runtimeConfigPath;
    }
    return loadOrCallConfigFile(setUpConfig, configPath);
}