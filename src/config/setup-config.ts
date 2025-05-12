import type { SsgConfig } from "./ssg-config";
import type { IProcessingNodeConfig } from "../processing-tree/i-processor-config";
import type { IScopeManager } from "../data-merge/scope-manager";
import { ArgumentParser } from 'argparse';
import { FalsyString, getFsNodeStat, resolveRelativePaths } from "@markus/ts-node-util-mk1";
import { initDefaultImportSymbols } from "../components/resolve-imports";
import { defaultProcessingHelper } from "../processing-helper";
import { initProcessingTreeFromConf } from "../processing-tree/init-processing-node";

import path from "path";
import * as lodash from 'lodash';

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

export async function parseCliConfig(config: SsgConfig): Promise<SsgConfig> {

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

    config.options = args;

    return config;
}

export async function parseArgsSetupInitializeConfig(config: SsgConfig): Promise<SsgConfig> {
    config = await setUpDefaultConfig(config);
    config = await parseCliConfig(config);
    config = await loadUserConfig(config);
    config = await initializeConfig(config);

    console.time('init_loading_user_runtime_config');

    config = await loadUserRuntimeConfig(config);

    console.timeEnd('init_loading_user_runtime_config');


    return config;
}

export async function loadProcessingTreeConfig(processingTreeConfigPath: string): Promise<IProcessingNodeConfig> {

    processingTreeConfigPath = path.resolve(processingTreeConfigPath);

    const processingTreeConfigDir = path.dirname(processingTreeConfigPath);

    const processingTreeConfig: IProcessingNodeConfig = await loadOrCallConfigFile({}, processingTreeConfigPath);
    //const processingTreeConfig: IProcessingNodeConfig = processingTreeModule.default;
    //The root path in the config should resolve like it would from the config origin file


    const rootChildrenConfig: any = processingTreeConfig.children as any;

    if (!rootChildrenConfig.fileSrcDirs) {
        rootChildrenConfig.fileSrcDirs = [];
    }

    for (let i = 0; i < rootChildrenConfig.fileSrcDirs.length; i++) {
        rootChildrenConfig.fileSrcDirs[ i ] = path.resolve(processingTreeConfigDir, rootChildrenConfig.fileSrcDirs[ i ]);
    }
    return processingTreeConfig;
}

export function initUnsetConfigDicts(keys: string[], config: SsgConfig) {
    for (const key of keys) {
        if (!config[ key ]) {
            config[ key ] = {};
        }
    }
}

export function initUnsetConfigDefaults(config: SsgConfig, defaultsDict: any) {
    for (const key in defaultsDict) {
        if (!config[ key ]) {
            config[ key ] = defaultsDict[ key ];
        }
    }
}

export function getDefaultImportDirs(): string[] {
    let defaultImportsDirs = [
        '../src/components/default/'
    ];
    defaultImportsDirs = resolveRelativePaths(defaultImportsDirs, path.dirname(__dirname));
    return defaultImportsDirs;
}

export async function setUpDefaultConfig(config: SsgConfig): Promise<SsgConfig> {
    if (!config) {
        config = {} as SsgConfig;
    }

    const pipelinePath: string = path.join(__dirname, './ssg-pipeline-conf.ts');

    const scopesManager: IScopeManager = await import("../data-merge/scope-manager");

    const configDefaults: Partial<SsgConfig> = {
        processingTreeConfig: await loadProcessingTreeConfig(pipelinePath),
        //processingTree:
        /*defaultResourceProcessorDirs: [
            './src/processing'
        ],*/
        processor: defaultProcessingHelper,
        defaultImportsDirs: getDefaultImportDirs(),
        scopes: scopesManager,
        processedDocuments: [],
        fragmentCacheDisabled: true,
        outDir: './dist',
        outFile: 'index.html',
        cacheDir: path.join('.dist', '/cache'),
        placeholderChars: 10
    };

    initUnsetConfigDefaults(config, configDefaults);
    initUnsetConfigDicts(
        [
            'globalImportsCache',
            'subTreePathCache',
            //'tsModulesCache'
            'libConstructors',
            'data',
            'defaultImportSymbolPaths',
            'options'
        ],
        config
    );

    return config;
}

async function loadOrCallConfigFile(targetDict: object, configPath?: FalsyString): Promise<any> {
    if (!configPath) {
        return targetDict;
    }

    if (!await getFsNodeStat(configPath)) {
        console.log(`Can not load configPath at ${configPath} -- file does not exist`);
        return targetDict;
    }

    const resolvedModulePath: string = path.resolve(configPath);

    const configModule = await import(resolvedModulePath);
    if (configPath.endsWith('.json')) {
        return Object.assign(targetDict, configModule);
    }
    const defaultExport = configModule.default;
    if (typeof defaultExport === 'object') {
        return Object.assign(targetDict, defaultExport);
    }
    if (typeof defaultExport === 'function') {
        return defaultExport(targetDict);
    }
    if (configModule.configure) {
        return configModule.configure(targetDict);
    }
    return targetDict;
}

//Json, ts or js
export async function loadUserConfig(defaultConfig: SsgConfig, configPath?: FalsyString): Promise<SsgConfig> {
    if (!configPath) {
        configPath = defaultConfig.userConfigPath;
    }
    return loadOrCallConfigFile(defaultConfig, configPath);
}

/*async function setUpMasterRunner(runnerPath: FalsyString, config: SsgConfig): Promise<void> {
    if (runnerPath) {
        const absModulePath = path.resolve(runnerPath);
        const masterRunnerModule: CompileRunnerModule = await import(absModulePath);
        config.masterCompileRunner = masterRunnerModule.getInstance() as IMasterRunner;

        return;
    }
    config.masterCompileRunner = new GenericRunner();
}*/

export async function initializeConfig(config: SsgConfig): Promise<SsgConfig> {

    console.time('init_runtime_state');

    /*if (!config.idCompileRunnersDict) {
        config.idCompileRunnersDict = {};
    }
    if (!config.resMatchCompileRunnersDict) {
        config.resMatchCompileRunnersDict = {};
    }
    if (!config.resMatchDataExtractorsDict) {
        config.resMatchDataExtractorsDict = {};
    }*/
    //await setUpMasterRunner(config.masterCompileRunnerPath, config);
    //await loadDefaultRunners(config);

    console.log('Initializing processing stages');
    /*config.defaultResourceProcessorDirs = config.defaultResourceProcessorDirs || [];
    config.processingStages = config.processingStages || {};
    await loadStageProcessorInstances(config.defaultResourceProcessorDirs, config.processingStages);*/

    //Any non absolute path at this point gets resolved relative to the application directory
    //config = resolveRelativePaths(config, path.join('..', __dirname));
    //config = resolveRelativePaths(config, process.cwd());

    async function initConfigProcessTree() {
        config.processingTree = await initProcessingTreeFromConf(config.processingTreeConfig, undefined);
        return;
    }

    const initStatePromises = [
        initConfigProcessTree(),
        initDefaultImportSymbols(config)
    ];

    await Promise.all(initStatePromises);

    /*if (config.processingTreeConfig) {
        console.time('init_processing_tree');
        config.processingTree = await initProcessingTreeFromConf(config.processingTreeConfig, undefined);
        console.timeEnd('init_processing_tree');
    }

    console.time('init_loading_default_components');

    console.log("Loading default components")
    //await loadDefaultComponents(config);
    await initDefaultImportSymbols(config);
    //const initializedConfig = await loadUserRuntimeConfig(config);

    console.timeEnd('init_loading_default_components');;*/


    console.timeEnd('init_runtime_state');

    return config;
}

export async function loadUserRuntimeConfig(setUpConfig: SsgConfig, configPath?: FalsyString): Promise<SsgConfig> {
    if (!configPath) {
        configPath = setUpConfig.runtimeConfigPath;
    }
    return loadOrCallConfigFile(setUpConfig, configPath);
}

`config.defaultComponentImportDirs = [
        './src/components/default/'
    ];
    config.defaultComponentsMatchGlobs = [
        '**.component.*',
        '*.component.*',
        '.component.*',
        '**/*.component.*',
        '/**/*.component.*',
        '**.component.ts',
        '*.component.ts',
        '.component.ts',
        '**/*.component.ts',
        '/**/*.component.ts',
    ];`;
/*config.defaultRunnerDirs = [
    './src/compilers'
];
config.defaultRunnersMatchGlobs = [
    '**.runner.ts',
    '*.runner.ts'
];*/