import type Module from "module";
import type { FragmentCache } from "./fragement-cache";
import type { IInternalComponent } from "./components/base-component";
import type { IProcessingNode, IResourceProcessor } from "./processing-tree/i-processor";
import type { IScopeManager } from "./data/scope-manager";
import type { IImportInstance } from "./module-loading/imports-loading";
import { ProcessingWrapper } from "./processing-tree-wrapper";
import { IProcessingNodeConfig } from "./processing-tree/i-processor-config";

export interface SsgConfig {
    //sourcePath?: string;
    //targetPath?: string;

    //Configuration of the processing tree (from this config the runtime processing tree is initialized/compiled)
    processingTreeConfig: IProcessingNodeConfig;
    //Processing tree -> recursive tree of nodes that pass the resource down 
    //to their children which should process the resource(if targeted through several conditions)
    processingTree: IProcessingNode;
    //Helper fns for using the 'processingTree' to process resources
    processor: ProcessingWrapper;
    //Cache collection of called processing stages used in tandem for reuse
    subTreePathCache: Record<string, IResourceProcessor>;
    //defaultResourceProcessorDirs: string[];

    //paths to the config extensions and mods to load
    userConfigPath: string | null;
    runtimeConfigPath: string | null;

    globalImportsCache: Record<string, IImportInstance>;
    //symbol/alias --> file path
    defaultImportsDirs: string[];
    defaultImportSymbolPaths: Record<string, string>;
    defaultImportSymbolsInitialized?: boolean;

    scopeManager: IScopeManager;

    libConstructors: Record<string, any | (() => any)>;
    tsModulesCache: Record<string, Module>;

    data: any;

    //State info for reading
    processedDocuments: any[];
    outDir: string | null;
    outFile: string | null;

    //cli/arg options and such for reading
    options: any;

    //TODO
    //fragmentCache?: FragmentCache;
    fragmentCacheDisabled: boolean;
    cacheDir: string | null;
}

export interface PreInitConfig {
    [ configKey: string ]: any;
}


//ctxDataPriority?: boolean;
//Detected Components matching in those paths should be automatically loaded as dependencies
//Default: [./src/components/default]
//defaultComponentImportDirs?: string[];
//defaultComponentsMatchGlobs?: string[];


/*defaultImportSymbols?: string[];
//defaultImportLoaders?: Record<string, IImportLoader>;
importLoadersCache?: Record<string, IImportLoader>;
importInstancesCache?: Record<string, IImportInstance>;
defaultImportsDirs?: string[];
defaultImportsMatchGlobs?: string[];*/




//defaultComponentsCache?: Record<string, IInternalComponent>;
//componentsCache?: Record<string, IInternalComponent>;

//global data available to all compile runs



//<deprecated>
//Generic compile runner that selects a target runner from src data
//masterCompileRunner?: IMasterRunner;
//resMatchCompileRunnersDict?: Record<string, string[]>;
//resMatchDataExtractorsDict?: Record<string, string[]>;
//idCompileRunnersDict?: Record<string, CompileRunner>;

//masterCompileRunnerPath?: string;
//Autoload runners from these dirs, by their file names and remove '-runner' (could be detected with the 'getInstance' method existance on the module)
//Default: [./src/compilers]
//defaultRunnerDirs?: string[];
//defaultRunnersMatchGlobs?: string[];
//</deprecated>


//Holds instantiated compile runners
//Can change during runtime, from runners being dynamically initialized

//is a dict of id matchers by key, to values which are the runner instances
//compileRunners?: Record<string, CompileRunner>;



//resourceMatchCompileRunnersDict?: Record<string, string>;
//alternative represenation that associates the compile runners by name/id
//idCompileRunnersDict?: Record<string, CompileRunner>;

//Can be used to defer compile runner instantiation when first needed
//Assumed that these are set up at startup time and do not change

//Does currently not really make sense like this as currently CompileRunners are cheap during construction,
//And only pull in libraries dynamically when first needed
//compileRunnerInstatiators?: Record<string, CompileRunnerInstantiator>;

//Can be set on startup as configuration:
//It the specified items are not in 'compileRunnerInstatiators' at initialization then
//these files are loaded as 'CompileRunnerInstantiator' into 'compileRunnerInstatiators'
//runnerFilesMap?: Record<string, string>;
//defaultRunnersRoot?: string;

//tsComponentsCache?: Record<string, Module>;

//Default paths from which to scan for a relative notated runner ts file, holding a document compiler
//runnerResolvePaths?: string[];
//Default paths from which to scan for layout paths
//layoutResolvePaths?: string[]; // removed layout == component
//Note: the more paths -> can affect the layout and compiler resolve speed
//componentResolvePaths?: string[];

//compilers?: Record<string, any>;
//dataExtractors?: Record<string, any>;
//globalImportLoadersCache?: Record<string, IImportLoader>;

//defaultResourceProcessorDirsMatchGlobs?: string[]; --> depend on stage name --> 'reader' -> file.reader.ts within 'defaultResourceProcessorDirs'