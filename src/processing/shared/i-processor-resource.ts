import { IInternalComponent } from "../../components/base-component";
import { DeferCompileArgs } from "../../deprecated/runners/resolve-sub-html.runner";
import { IGenericControl, IGenericResource, IProcessor } from "../../processing-tree/i-processor";

export type MergeExcludeKeys = string[];

export interface IResourceDoc {
    inputFormat: string,
    outputFormat: string,
    src: string,
    target: string;
}

export interface IResourceControl extends IGenericControl {
    pendingChildren?: DeferCompileArgs[];
    importScope?: Record<string, IInternalComponent | IProcessor>;
}

export interface IProcessResource extends IGenericResource {
    id?: string,
    content?: any,
    control?: IResourceControl;
    exclude?: MergeExcludeKeys;
    document?: Partial<IResourceDoc>;
}

