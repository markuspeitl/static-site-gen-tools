import { IProcessResource } from "../../compilers/runners";
import { SsgConfig } from "../../config";

export async function postProcessReading(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
    return resource;
}