import path from "path";
import { IProcessResource } from "../processors/shared/i-processor-resource";
import * as lodash from 'lodash';
export interface IScopeManager {
    recursiveDictMerge: Function,

    mergeToResource: (
        targetResource: IProcessResource,
        srcResource: IProcessResource,
        mergeExcludedKeys: string[]
    ) => IProcessResource,

    getMergeExcludeKeys: Function,

    mergeToParent: (
        resource: IProcessResource,
        mergeExcludedKeys?: string[]
    ) => IProcessResource,

    forkResourceData: Function,

    forkFromResource: (
        baseResource: IProcessResource,
        forkedResourceProps?: Record<string, any>,
        forkExcludeKeys?: string[],
        noParentSet?: boolean
    ) => IProcessResource;

    dataFromResource: (
        baseResource: IProcessResource,
        excludeKeys?: string[]
    ) => IProcessResource;
}

export const controlFlowExcludes = [
    'parent',
    'pendingFragments',
    'importScope'
];
export const documentExcludes = [
    'src',
    'srcFormat',
    'targetFormat',
    'target',
];

export const fragmentExcludes = [
    'componentInstance',
    'fragmentId',
    'fragmentTag',
    'placeholder',
    'import',
    //'currentImportSymbols'
];

export const defaultForkControlExcludeKeys = [
    'id',
    'exclude',
    ...controlFlowExcludes
];

export const defaultForkMergeExcludedKeys = [
    ...defaultForkControlExcludeKeys,
    ...documentExcludes,
    ...fragmentExcludes
];
export const defaultMergeExcludedKeys = [
    ...defaultForkControlExcludeKeys,
    ...documentExcludes,
    ...fragmentExcludes
];

export const dataExcludeKeys = [
    'content',
    ...defaultForkControlExcludeKeys,
    ...documentExcludes,
    ...fragmentExcludes
];


const defaultResourceTemplate: IProcessResource = {
    id: undefined,
    //exclude: defaultMergeExcludedKeys
};


export function recursiveDictMerge(
    target: any,
    src: any,
    excludeKeys: string[] = [],
    currentPath: string = ''
): any {

    const dotBranchPath = currentPath.replace('/', '.');
    if (excludeKeys.includes(dotBranchPath)) {
        return undefined;
    }

    if (target === undefined || target === null) {
        return src;
    }

    if (typeof (src) !== 'object') {
        return src;
    }

    if (Array.isArray(src)) {
        return src;
    }

    for (const key in src) {

        let branchPath = path.join(currentPath, key);

        const srcVal: any = src[ key ];
        const targetVal = target[ key ];

        if (typeof srcVal !== 'function') {
            const srcValueResult = recursiveDictMerge(
                targetVal,
                srcVal,
                excludeKeys,
                branchPath
            );

            if (srcValueResult !== undefined && target[ key ] !== srcValueResult) {

                if (typeof (target) !== 'object') {
                    target = {};
                }

                target[ key ] = srcValueResult;
            }
        }
    }
    return target;
}

export function mergeToResource(
    targetResource: IProcessResource,
    srcResource: IProcessResource,
    mergeExcludedKeys: string[]
): IProcessResource {

    if (srcResource === targetResource) {
        return targetResource;
    }

    //const mergeExcludedKeys: string[] = srcResource.exclude || defaultMergeExcludedKeys;

    const merged = recursiveDictMerge(targetResource, srcResource, mergeExcludedKeys);
    return merged;

    /*for (const key in srcResource) {
        const srcResourceProp: any = srcResource[ key ];

        if (!mergeExcludedKeys.includes(key)) {
            targetResource[ key ] = srcResourceProp;
        }
    }
    return targetResource;*/
}

export function getMergeExcludeKeys(resource: IProcessResource, defaultKeys: string[], overrideKeys?: string[]): string[] {
    if (!overrideKeys) {
        overrideKeys = resource.exclude;
    }
    if (!overrideKeys) {
        overrideKeys = defaultKeys;
    }

    return overrideKeys;
}

export function mergeToParent(
    resource: IProcessResource,
    mergeExcludeKeys?: string[]
) {

    if (!resource.parent) {
        return resource;
    }

    mergeExcludeKeys = getMergeExcludeKeys(
        resource,
        defaultMergeExcludedKeys,
        mergeExcludeKeys
    );

    const targetResource: IProcessResource = resource.parent;
    if (!targetResource) {
        return resource;
    }

    return mergeToResource(targetResource, resource, mergeExcludeKeys);
}


export function forkResourceData(
    resource: IProcessResource,
    forkExcludeKeys?: string[],
    noParentSet: boolean = false
): IProcessResource {

    let resourceTemplate: IProcessResource = lodash.cloneDeep(defaultResourceTemplate);
    if (!resource) {
        return lodash.cloneDeep(defaultResourceTemplate);
    }

    forkExcludeKeys = getMergeExcludeKeys(
        resource,
        defaultForkMergeExcludedKeys,
        forkExcludeKeys
    );
    resourceTemplate = mergeToResource(
        resourceTemplate,
        resource,
        forkExcludeKeys
    );

    if (!resourceTemplate) {
        resourceTemplate = {};
    }

    if (noParentSet) {
        return resourceTemplate;
    }

    resourceTemplate.parent = resource;
    return resourceTemplate;
}

//Use this when compiling a sub component with current data scope
export function forkFromResource(
    baseResource: IProcessResource,
    forkedResourceProps?: Record<string, any>,
    forkExcludeKeys?: string[],
    noParentSet: boolean = false
): IProcessResource {

    if (!forkedResourceProps) {
        forkedResourceProps = {};
    }

    const resourceTemplate: IProcessResource = forkResourceData(
        baseResource,
        forkExcludeKeys,
        noParentSet
    );
    const subResource: IProcessResource = Object.assign(resourceTemplate, forkedResourceProps);
    return subResource;
}

export function dataFromResource(
    resource: IProcessResource,
    excludeKeys?: string[]
): IProcessResource {

    if (!excludeKeys) {
        excludeKeys = dataExcludeKeys;
    }
    const dataScope = {};

    for (const key in resource) {
        if (!excludeKeys || !excludeKeys.includes(key)) {
            dataScope[ key ] = resource[ key ];
        }
    }
    return dataScope;
}





/*export function forkDataScope(resource: any): any {
    //Inefficient but simple
    return lodash.cloneDeep(resource) as any;
}

export function forkResourceScope(resource: any): any {
    //Inefficient but simple
    return lodash.cloneDeep(resource) as any;
}

//parentScope: available variables unless shadowed by any component specific data.
//passDataScope: Things like html attributes or data specifically passed to component. (data passed into component)
//extractedScope: Data defined within the component (extractData, or component.data()) --> extractedScope.content should the component body without the data

export function mergeResourceScopes(parentScope: IProcessResource, passDataScope: IProcessResource, extractedScope: IProcessResource): IProcessResource {

    const forkedScope = forkDataScope(parentScope);

    //Data in lower level scopes is shadowed/overwritten

    forkedScope.data = Object.assign(forkedScope.data || {}, passDataScope.data || {}, extractedScope.data || {});
    forkedScope.content = extractedScope.content || forkedScope.content;

    //return Object.assign(forkedScope, passDataScope, extractedScope);

    return forkedScope;
}

export function forkResourceChild(resource: IProcessResource, childResourceContent?: string, childResourceId?: string): IProcessResource {

    const childForkedResource: IProcessResource = lodash.cloneDeep(resource);
    childForkedResource.id = childResourceId || resource.id;
    childForkedResource.content = childResourceContent;
    childForkedResource = {
        parent: resource,
        handledProcIds: [],
    };

    return childForkedResource;
}
*/


//Some props would need to be merged in the sub component instead:
//data.import + data.importCache: should be available is sub component, but additional imports might be added (if the component depends on this)

//data.compileAfter: Needs to be scoped + shadowed

//data.src ??? (maybe give sub scopes access to some parent scope info but through different props) 
//data.src-- > .src;
//data.target-- > .target;

//data.compileRunner: should be scoped and shadowed (sub components should have to define their own compile chain/ format)
//data.extractRunner: should be scoped and shadowed (sub components should have to define their own data extract chain/ format)
//When to fork??


/*export interface IScopeManager {
    combineResources(resource1: IProcessResource, resource2: IProcessResource): IProcessResource;
    combineAllResources(...resources: IProcessResource[]): IProcessResource;
    forkResource(resource: IProcessResource): IProcessResource;
    forkResourceResetControl(resource: IProcessResource): IProcessResource;
    forkChildResource(resource: IProcessResource, childResourceContent?: string, childResourceId?: string): IProcessResource;
}

export function mergeData(resource1: IProcessResource, resource2: IProcessResource): IProcessResource {
    return resource1;
}

export class DefaultScopeManager implements IScopeManager {

    combineResources(resource1: IProcessResource, resource2: IProcessResource): IProcessResource {
        return lodash.merge({}, resource1, resource2);
    }
    combineAllResources(...resources: IProcessResource[]): IProcessResource {
        return lodash.merge({}, ...resources);
    }
    forkResource(resource: IProcessResource): IProcessResource {
        return lodash.cloneDeep(resource);
    }
    forkResourceResetControl(resource: IProcessResource): IProcessResource {

        const forkedResource: IProcessResource = this.forkResource(resource);

        forkedResource = {
            parent: resource,
            handledProcIds: [],
            pendingFragments: undefined,
        };

        return forkedResource;
    }

    forkChildResource(resource: IProcessResource, childResourceContent?: string, childResourceId?: string): IProcessResource {
        const childForkedResource: IProcessResource = {
            id: childResourceId || resource.id,
            content: childResourceContent,
            control: {
                parent: resource,
                handledProcIds: [],
                pendingFragments: undefined,
            },
            data: lodash.cloneDeep(resource),
        };
        return childForkedResource;
    }
}

export const defaultScopeManager: IScopeManager = new DefaultScopeManager();*/
