import Module from "module";
import { FragmentCache } from "./fragement-cache";
import { CompileRunner, CompileRunnerInstantiator } from "./compilers/runners";

export interface SsgConfig {
    //compilers?: Record<string, any>;
    //dataExtractors?: Record<string, any>;

    //Generic compile runner that selects a target runner from src data
    masterCompileRunner?: CompileRunner;
    resMatchCompileRunnersDict?: Record<string, string>;
    idCompileRunnersDict?: Record<string, CompileRunner>;
    //Autoload runners from these dirs, by their file names and remove '-runner' (could be detected with the 'getInstance' method existance on the module)
    defaultRunnerDirs?: string[];



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

    libConstructors?: Record<string, any | (() => any)>;


    fragmentCache?: FragmentCache;
    fragmentCacheDisabled?: boolean;
    cacheDir?: string;
    //ctxDataPriority?: boolean;

    tsModulesCache?: Record<string, Module>;
    tsComponentsCache?: Record<string, Module>;

    //Default paths from which to scan for a relative notated runner ts file, holding a document compiler
    runnerResolvePaths?: string[];
    //Default paths from which to scan for layout paths
    //layoutResolvePaths?: string[]; // removed layout == component
    //Note: the more paths -> can affect the layout and compiler resolve speed
    componentResolvePaths?: string[];
    //Detected Components matching in those paths should be automatically loaded as dependencies
    defaultComponentImportDirs?: string[];
}