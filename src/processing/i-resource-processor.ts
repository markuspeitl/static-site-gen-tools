import { DataParsedDocument } from "../compilers/runners";
import { SsgConfig } from "../config";
import { IResourceProcessor } from "../pipeline/i-processor";

export function addResourceDocProp(resource: DataParsedDocument, newValuesDict: any): DataParsedDocument {
    if (!resource.data) {
        resource.data = {};
    }
    if (!resource.data.document) {
        resource.data.document = {};
    }
    Object.assign(resource.data.document, newValuesDict);
    return resource;
}

export function addHandlerId(resource: DataParsedDocument, handlerKey: string, extractorInstance: IResourceProcessor): DataParsedDocument {
    const docAdd = {};
    docAdd[ handlerKey ] = extractorInstance.id;

    resource = addResourceDocProp(
        resource,
        docAdd
    );
    return resource;
}

export function addExtractorId(resource: DataParsedDocument, extractorInstance: IResourceProcessor): DataParsedDocument {
    return addHandlerId(resource, 'extractor', extractorInstance);
}

export function resetDocumentSetProp(resource: DataParsedDocument, docPropKey: string, docPropValue: any): DataParsedDocument {
    if (!resource.data) {
        resource.data = {};
    }

    resource.data.document = {};
    resource.data.document[ docPropKey ] = docPropValue;

    return resource;
}

export function resetDocumentSetInputFormat(resource: DataParsedDocument, inputFormat: any): DataParsedDocument {
    return resetDocumentSetProp(resource, 'inputFormat', inputFormat);
}