import { IProcessResource } from "../pipeline/i-processor";
import * as lodash from 'lodash';

export interface IScopeManager {
    combineResources(resource1: IProcessResource, resource2: IProcessResource): IProcessResource;
    combineAllResources(...resources: IProcessResource[]): IProcessResource;
    forkResource(resource: IProcessResource): IProcessResource;
    forkResourceResetControl(resource: IProcessResource): IProcessResource;
    forkChildResource(resource: IProcessResource, childResourceContent?: string, childResourceId?: string): IProcessResource;
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

        forkedResource.control = {
            parent: resource,
            handledProcIds: [],
            pendingChildren: undefined,
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
                pendingChildren: undefined,
            },
            data: lodash.cloneDeep(resource.data),
        };
        return childForkedResource;
    }
}

export const defaultScopeManager: IScopeManager = new DefaultScopeManager();