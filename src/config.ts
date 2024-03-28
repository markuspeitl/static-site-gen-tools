import { FragmentCache } from "./fragement-cache";

export interface SsgConfig {
    compilers?: Record<string, any>;
    dataExtractors?: Record<string, any>;
    libOverrides?: Record<string, any>;
    fragmentCache?: FragmentCache;
}