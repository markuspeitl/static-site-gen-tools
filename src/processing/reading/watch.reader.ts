import type { SsgConfig } from "../../config";
import type { IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { getFsNodeStat } from "@markus/ts-node-util-mk1";
import { isDirPath, isPath } from "@markus/ts-node-util-mk1";
import * as fs from 'fs';
import path from 'path';

export class WatchReader implements IResourceProcessor {

    public id: string = 'watch.reader';

    public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return false;

        /*const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return false;
        }

        //Resource was already read --> nothing to do here
        if (resource.content) {
            return false;
        }

        if (!isPath(resourceId)) {
            return false;
        }
        if (isDirPath(resourceId)) {
            return false;
        }
        const resolvedPath: string = path.resolve(resourceId);

        const stat: fs.Stats | null = await getFsNodeStat(resolvedPath);
        if (!stat) {
            return false;
        }
        if (stat.isFile()) {
            return true;
        }

        return false;*/
    }
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceId: string | undefined = resource.id;
        if (!resourceId) {
            return resource;
        }
        console.log(`Reading ${this.id}: ${resource.data?.document?.src}`);

        // track files or dirs passed to this and reread/recompile/rewrite if necessary
        //https://www.npmjs.com/package/chokidar

        return resource;
    }
}