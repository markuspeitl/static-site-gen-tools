import { DataParsedDocument } from "./compilers/runners";
import * as lodash from 'lodash';

export function forkDataScope(resource: DataParsedDocument): DataParsedDocument {
    //Inefficient but simple
    return lodash.cloneDeep(resource) as DataParsedDocument;
}

export function forkResourceScope(resource: DataParsedDocument): DataParsedDocument {
    //Inefficient but simple
    return lodash.cloneDeep(resource) as DataParsedDocument;
}


//parentScope: available variables unless shadowed by any component specific data.
//passDataScope: Things like html attributes or data specifically passed to component. (data passed into component)
//extractedScope: Data defined within the component (extractData, or component.data()) --> extractedScope.content should the component body without the data

export function mergeResourceScopes(parentScope: DataParsedDocument, passDataScope: DataParsedDocument, extractedScope: DataParsedDocument): DataParsedDocument {

    const forkedScope = forkDataScope(parentScope);

    //Data in lower level scopes is shadowed/overwritten

    forkedScope.data = Object.assign(forkedScope.data || {}, passDataScope.data || {}, extractedScope.data || {});
    forkedScope.content = extractedScope.content || forkedScope.content;

    //return Object.assign(forkedScope, passDataScope, extractedScope);

    return forkedScope;
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