import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from '../../processors/shared/i-processor-resource';
import type { IResourceProcessor } from "../../processing-tree/i-processor";
import { getReadableResource, IReadResource } from "../shared/document-helpers";
export class PassPathReader implements IResourceProcessor {

    public id: string = 'pass-path.reader';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }
        const resolvedPath: string = path.resolve(resourceId);

        const stat: fs.Stats | null = await getFsNodeStat(resolvedPath);
        if (!stat) {
            return false;
        }
        return true;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        /*const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }*/
        const readResource: IReadResource | null = getReadableResource(resource);
        if (!readResource) {
            return resource;
        }
        console.log(`Reading ${this.id}: ${readResource.src}`);
        //const resolvedPath: string = path.resolve(readResource.src);
        readResource.content = readResource.src;
        return readResource;
    }
}