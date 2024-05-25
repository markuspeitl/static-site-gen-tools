import * as lodash from 'lodash';
import type { IProcessResource } from './pipeline/i-processor';

export function forkDataScope(resource: any): any {
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
    const childForkedResource: IProcessResource = {
        id: childResourceId || resource.id,
        content: childResourceContent,
        control: {
            parent: resource,
            handledProcIds: [],
        },
        data: lodash.cloneDeep(resource.data),
    };
    return childForkedResource;
}


//Some props would need to be merged in the sub component instead:
//data.import + data.importCache: should be available is sub component, but additional imports might be added (if the component depends on this)

//data.compileAfter: Needs to be scoped + shadowed

//data.src ??? (maybe give sub scopes access to some parent scope info but through different props) 
//data.src-- > data.document.src;
//data.target-- > data.document.target;

//data.compileRunner: should be scoped and shadowed (sub components should have to define their own compile chain/ format)
//data.extractRunner: should be scoped and shadowed (sub components should have to define their own data extract chain/ format)
//When to fork??