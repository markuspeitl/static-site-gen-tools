import path from "path";
import { SsgConfig } from "./config";
import { ArgumentParser } from 'argparse';
import * as lodash from 'lodash';
import { getFsNodeStat } from "@markus/ts-node-util-mk1";
import { getDefaultProcessingRootNodeConfig } from "./ssg-pipeline-conf";
import { IProcessingNodeConfig } from "./pipeline/i-processor";
import type { IProcessResource } from './pipeline/i-processor';
import { defaultScopeManager } from "./data/scope-manager";
import { initProcessorInstanceFromConf } from "./pipeline/init-processing-node";
import { initDefaultImportSymbols } from "./module-loading/imports-loading";
import { resolveDataFromParentFile } from "./components/resolve-component-path-refs";
import { resolveRelativePaths } from "@markus/ts-node-util-mk1";
import { defaultProcessingWrapper } from "./processing-tree-wrapper";

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

    config.defaultImportsDirs = [
        './src/components/default/'
    ];

    config.defaultImportsDirs = resolveRelativePaths(config.defaultImportsDirs, path.dirname(__dirname));

    /*config.defaultRunnerDirs = [
        './src/compilers'
    ];
    config.defaultRunnersMatchGlobs = [
        '**.runner.ts',
        '*.runner.ts'
    ];*/

    config.defaultResourceProcessorDirs = [
        './src/processing'
    ];
    //const processingStages: ProcessingStagesInfo = getDefaultProcessingStages();

    const processingTreeRootNode: IProcessingNodeConfig = getDefaultProcessingRootNodeConfig();
    //const configToThisPath: string = path.relative("./ssg-pipeline-conf", __dirname);
    processingTreeRootNode.srcDirs = processingTreeRootNode?.srcDirs?.map((topLevelDirPath: string) => path.resolve('./ssg-pipeline-conf', topLevelDirPath));

    config.processingTreeConfig = processingTreeRootNode;

    //config.masterCompileRunnerPath = './src/compilers/generic.runner.ts';

    config.outDir = './dist';
    config.cacheDir = path.join(config.outDir, '/cache');
    config.outFile = 'index.html';

    config.scopeManager = defaultScopeManager;

    config.processor = defaultProcessingWrapper;
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

    console.time('init');

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

    if (config.processingTreeConfig) {
        console.time('init_processing_tree');
        config.processingTree = await initProcessorInstanceFromConf(config.processingTreeConfig, undefined);
        console.timeEnd('init_processing_tree');
    }

    console.time('init_loading_default_components');

    console.log("Loading default components");
    //await loadDefaultComponents(config);
    await initDefaultImportSymbols(config);
    const initializedConfig = await loadUserRuntimeConfig(config);

    console.timeEnd('init_loading_default_components');


    console.timeEnd('init');

    return initializedConfig;
}

export async function loadUserRuntimeConfig(setUpConfig: SsgConfig, configPath?: string): Promise<SsgConfig> {
    if (!configPath) {
        configPath = setUpConfig.runtimeConfigPath;
    }
    return loadOrCallConfigFile(setUpConfig, configPath);
}