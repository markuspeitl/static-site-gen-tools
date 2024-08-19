import type { IInternalComponent } from "../../components/base/i-component";
import type { IFragmentCompile } from "../../components/compile-fragments";
import type { IGenericControl, IGenericResource, IProcessor } from "../../processing-tree/i-processor";

export type MergeExcludeKeys = string[];

export interface IResourceDoc {
    inputFormat: string,
    outputFormat: string,
    src: string,
    target: string;
}

export interface IResourceControl extends IGenericControl {
    pendingFragments?: IFragmentCompile[];
    importScope?: Record<string, IInternalComponent | IProcessor>;
}

export interface IProcessResource extends IGenericResource {
    id?: string,
    content?: any,
    control?: IResourceControl;
    exclude?: MergeExcludeKeys;
    document?: Partial<IResourceDoc>;
}

