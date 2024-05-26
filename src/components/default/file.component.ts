import type { SsgConfig } from "../../config";
import type { IProcessResource } from "../../pipeline/i-processor";
import type { IInternalComponent } from "../base-component";
import type { FalsyAble } from "../helpers/generic-types";
import { resetDocumentSetInputFormat } from "../../processing/i-resource-processor";
import { processStagesOnInputPath, processSubPath } from "../../processing-tree-wrapper";

/*const cachedFileResources: Record<string, IProcessResource> = {};
export async function getFileResource(documentPath: string, config?: SsgConfig): Promise<FalsyAble<IProcessResource>> {

    if (cachedFileResources[ documentPath ]) {
        return cachedFileResources[ documentPath ];
    }

    const readResource: IProcessResource = await useReaderStageToRead(documentPath, config);
    if (!readResource.content || !readResource.data?.document?.inputFormat) {
        return null;
    }

    cachedFileResources[ documentPath ] = readResource;

    return readResource;
}*/

export class FileComponent implements IInternalComponent {
    protected path: string | null = null;

    protected readFileResource: IProcessResource | null = null;
    protected dataExtractedResource: IProcessResource | null = null;

    constructor (path: string) {
        if (path) {
            this.path = path;
        }
    }

    /*private getTargetPath(resource?: IProcessResource): string | null {
        if (resource?.data?.path) {
            return resource.data.path;
        }
        return this.path;
    }

    private async getFileResource(resource: IProcessResource, config: SsgConfig): Promise<FalsyAble<IProcessResource>> {

        if (this.readFileResource) {
            return this.readFileResource;
        }

        if (!this.path && !resource?.data?.path) {
            return null;
        }
        const documentPath: string | null = this.getTargetPath(resource);
        if (!documentPath) {
            return null;
        }

        let readResource: IProcessResource = await processStagesOnInputPath([ 'extractor', 'compiler' ], documentPath, config);

        if (!readResource.content || !readResource.data?.document?.inputFormat) {
            return null;
        }

        this.readFileResource = readResource;

        return readResource;
    }*/


    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        const dataPath: string | undefined = this.path || resource.data?.path;
        if (!dataPath) {
            return resource;
        }
        this.path = dataPath;

        const readResource: FalsyAble<IProcessResource> = await processStagesOnInputPath([ 'reader' ], this.path, config);
        if (!readResource) {
            return resource;
        }

        /*const readResource: FalsyAble<IProcessResource> = await this.getFileResource(resource, config);
        if (!readResource) {
            return resource;
        }*/

        //make sure the resource.data.document state is reset before establishing pre conditions for extraction
        //resetDocumentSetInputFormat(resource, readResource.data?.document?.inputFormat);

        //resource.content = readResource.content;
        this.dataExtractedResource = await processSubPath(readResource, config, [ 'extractor' ]);

        if (!this.dataExtractedResource) {
            this.dataExtractedResource = readResource;
        }

        return {
            data: this.dataExtractedResource.data
        };
    }
    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        if (!this.dataExtractedResource) {
            this.data(resource, config);
        }

        const resourceToCompile: IProcessResource = this.dataExtractedResource || resource;

        resourceToCompile.data.content = resource.content;

        return await processSubPath(resourceToCompile, config, [ 'compiler' ]);
    }

}