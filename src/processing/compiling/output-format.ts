import { DataParsedDocument } from "../../compilers/runners";
import { addResourceDocProp } from "../i-resource-processor";

export function setOutputFormat(resource: DataParsedDocument, format: string): DataParsedDocument {
    resource = addResourceDocProp(
        resource,
        {
            outputFormat: format,
        }
    );
    return resource;
}

export function setHtmlOutputFormat(resource: DataParsedDocument): DataParsedDocument {
    return setOutputFormat(resource, 'html');
}