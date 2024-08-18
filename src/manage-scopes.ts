import * as lodash from 'lodash';
import type { IProcessResource } from './processing-tree/i-processor';

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
    childForkedResource.control = {
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
//data.src-- > data.document.src;
//data.target-- > data.document.target;

//data.compileRunner: should be scoped and shadowed (sub components should have to define their own compile chain/ format)
//data.extractRunner: should be scoped and shadowed (sub components should have to define their own data extract chain/ format)
//When to fork??



const defaultMergeExcludedKeys = [
    'id',
    'document',
    'content',
    'exclude'
];

const defaultResourceTemplate: IProcessResource = {
    id: undefined,
    control: {},
    document: {},
    exclude: defaultMergeExcludedKeys
};

export function forkResourceData(resource: IProcessResource): IProcessResource {

    const resourceTemplate: IProcessResource = lodash.cloneDeep(defaultResourceTemplate);
    if (!resource) {
        return lodash.cloneDeep(defaultResourceTemplate);
    }

    const mergeExcludedKeys: string[] = resource.exclude || defaultMergeExcludedKeys;

    for (const key in resource) {
        const baseResourceProp: any = resource[ key ];
        if (!mergeExcludedKeys.includes(key)) {
            resourceTemplate[ key ] = baseResourceProp;
        }
    }

    if (!resourceTemplate.control) {
        resourceTemplate.control = {};
    }
    resourceTemplate.control.parent = resource;

    return resourceTemplate;
}

//Use this when compiling a sub component with current data scope
export function forkFromResource(
    baseResource: IProcessResource,
    forkedResourceProps: Record<string, any>
): IProcessResource {

    const resourceTemplate: IProcessResource = forkResourceData(baseResource);
    const subResource: IProcessResource = Object.assign(resourceTemplate, forkedResourceProps);
    return subResource;
}
