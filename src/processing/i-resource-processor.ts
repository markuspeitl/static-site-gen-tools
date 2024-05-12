import { DataParsedDocument } from "../compilers/runners";
import { SsgConfig } from "../config";

export interface IResourceProcessor {
    id: string;
    canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean>;
    process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument>;
}

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

