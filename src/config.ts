import Module from "module";
import { FragmentCache } from "./fragement-cache";
import { CompileRunner, CompileRunnerInstantiator } from "./compilers/runners";

export interface SsgConfig {
    //compilers?: Record<string, any>;
    //dataExtractors?: Record<string, any>;

    //Holds instantiated compile runners
    //Can change during runtime, from runners being dynamically initialized
    compileRunners?: Record<string, CompileRunner>;

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

    //Default paths from which to scan for a relative notated runner ts file, holding a document compiler
    runnerResolvePaths?: string[];
    //Default paths from which to scan for layout paths
    layoutResolvePaths?: string[];
    //Note: the more paths -> can affect the layout and compiler resolve speed
    componentResolvePaths?: string[];
}