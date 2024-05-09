import Module from "module";
import { FragmentCache } from "./fragement-cache";
import { CompileRunner, CompileRunnerInstantiator } from "./compilers/runners";

export interface SsgConfig {
    //compilers?: Record<string, any>;
    //dataExtractors?: Record<string, any>;

    //Generic compile runner that selects a target runner from src data
    compileRunnerCaller?: CompileRunner;

    //Holds instantiated compile runners
    //Can change during runtime, from runners being dynamically initialized

    //is a dict of id matchers by key, to values which are the runner instances
    //compileRunners?: Record<string, CompileRunner>;



    resourceMatchCompileRunnersDict?: Record<string, string>;
    //alternative represenation that associates the compile runners by name/id
    idCompileRunnersDict?: Record<string, CompileRunner>;

    //Can be used to defer compile runner instantiation when first needed
    //Assumed that these are set up at startup time and do not change
    compileRunnerInstatiators?: Record<string, CompileRunnerInstantiator>;

    //Can be set on startup as configuration:
    //It the specified items are not in 'compileRunnerInstatiators' at initialization then
    //these files are loaded as 'CompileRunnerInstantiator' into 'compileRunnerInstatiators'
    runnerFilesMap?: Record<string, string>;
    defaultRunnersRoot?: string;


    libConstructors?: Record<string, any | (() => any)>;

    fragmentCache?: FragmentCache;
    fragmentCacheDisabled?: boolean;
    cacheDir?: string;
    ctxDataPriority?: boolean;

    tsModulesCache?: Record<string, Module>;
    tsComponentsCache?: Record<string, Module>;

    //Default paths from which to scan for a relative notated runner ts file, holding a document compiler
    runnerResolvePaths?: string[];
    //Default paths from which to scan for layout paths
    layoutResolvePaths?: string[];
    //Note: the more paths -> can affect the layout and compiler resolve speed
    componentResolvePaths?: string[];

    //Detected Components matching in those paths should be automatically loaded as dependencies
    defaultComponentImportDirs?: string[];
}