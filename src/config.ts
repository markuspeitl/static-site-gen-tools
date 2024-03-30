import Module from "module";
import { FragmentCache } from "./fragement-cache";

export interface SsgConfig {
    compilers?: Record<string, any>;
    dataExtractors?: Record<string, any>;
    libConstructors?: Record<string, any | (() => any)>;
    fragmentCache?: FragmentCache;
    ctxDataPriority?: boolean;

    tsModulesCache?: Record<string, Module>;

    //Default paths from which to scan for a relative notated runner ts file, holding a document compiler
    compilerResolvePaths?: string[];
    //Default paths from which to scan for layout paths
    layoutResolvePaths?: string[];
    //Note: the more paths -> can affect the layout and compiler resolve speed
}