import { ensureKeyAtDict } from "../components/helpers/dict-util";
import type { SsgConfig } from "../config";
import type { IProcessResource, IResourceProcessor } from "../pipeline/i-processor";

export function addResourceDocProp(resource: IProcessResource, newValuesDict: any): IProcessResource {
    if (!resource.data) {
        resource.data = {};
    }
    if (!resource.data.document) {
        resource.data.document = {};
    }
    Object.assign(resource.data.document, newValuesDict);
    return resource;
}

export function addHandlerId(resource: IProcessResource, handlerKey: string, extractorInstance: IResourceProcessor): IProcessResource {
    const docAdd = {};
    docAdd[ handlerKey ] = extractorInstance.id;

    resource = addResourceDocProp(
        resource,
        docAdd
    );
    return resource;
}

export function addExtractorId(resource: IProcessResource, extractorInstance: IResourceProcessor): IProcessResource {
    return addHandlerId(resource, 'extractor', extractorInstance);
}

export function resetDocumentSetProp(resource: IProcessResource, docPropKey: string, docPropValue: any): IProcessResource {
    if (!resource.data) {
        resource.data = {};
    }

    resource.data.document = {};
    resource.data.document[ docPropKey ] = docPropValue;

    return resource;
}

export function resetDocumentSetInputFormat(resource: IProcessResource, inputFormat: any): IProcessResource {
    return resetDocumentSetProp(resource, 'inputFormat', inputFormat);
}

export function setOutputFormat(resource: IProcessResource, format: string): IProcessResource {
    resource = addResourceDocProp(
        resource,
        {
            outputFormat: format,
        }
    );
    return resource;
}

export function setHtmlOutputFormat(resource: IProcessResource): IProcessResource {
    return setOutputFormat(resource, 'html');
}