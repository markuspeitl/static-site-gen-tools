import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { addResourceDocProp } from "../i-resource-processor";

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