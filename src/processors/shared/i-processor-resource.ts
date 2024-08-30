import type { IInternalComponent } from "../../components/base/i-component";
import type { IFragmentCompile } from "../../components/compile-fragments";
import type { IImportInstance } from "../../components/resolve-imports";
import type { IGenericControl, IGenericResource, IProcessor } from "../../processing-tree/i-processor";

export type MergeExcludeKeys = string[];

export interface IResourceControl extends IGenericControl {
    pendingFragments?: IFragmentCompile[];
    importScope?: Record<string, IInternalComponent | IProcessor>;
}

export interface IProcessResource extends IGenericResource, IResourceControl {
    id?: string,
    content?: any,
    exclude?: MergeExcludeKeys;
    //document?: Partial<IResourceDoc>;
    //Resource props
    src?: string,
    srcFormat?: string,
    targetFormat?: string,
    target?: string,
}

export interface IComponentResource extends IProcessResource {
    componentInstance: IImportInstance;
}

export function isComponentResource(resource): resource is IComponentResource {
    if (resource.componentInstance) {
        return true;
    }
    return false;
}