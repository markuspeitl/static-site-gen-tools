import { FragmentCache } from "./fragement-cache";

export interface SsgConfig {
    compilers?: Record<string, any>;
    dataExtractors?: Record<string, any>;
    libOverrides?: Record<string, any>;
    fragmentCache?: FragmentCache;
    ctxDataPriority?: boolean;



    //Default paths from which to scan for a relative notated runner ts file, holding a document compiler
    compilerResolvePaths?: string[];
    //Default paths from which to scan for layout paths
    layoutResolvePaths?: string[];
    //Note: the more paths -> can affect the layout and compiler resolve speed
}