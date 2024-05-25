import type { SsgConfig } from "../../config";
import type { IProcessResource } from "../../pipeline/i-processor";
import type { IInternalComponent } from "../base-component";
import type { FalsyAble } from "../helpers/generic-types";
import { processConfStage, useReaderStageToRead } from "../../processing/process-resource";
import { resetDocumentSetInputFormat } from "../../processing/i-resource-processor";

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

    constructor (path?: string) {
        if (path) {
            this.path = path;
        }
    }

    private getTargetPath(resource?: IProcessResource): string | null {
        if (resource?.data?.path) {
            return resource.data.path;
        }
        return this.path;
    }

    private async getFileResource(resource?: IProcessResource, config?: SsgConfig): Promise<FalsyAble<IProcessResource>> {

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

        let readResource: IProcessResource = await useReaderStageToRead(documentPath, config);

        if (!readResource.content || !readResource.data?.document?.inputFormat) {
            return null;
        }

        this.readFileResource = readResource;

        return readResource;
    }


    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
        const readResource: FalsyAble<IProcessResource> = await this.getFileResource(resource, config);
        if (!readResource) {
            return resource;
        }

        //make sure the resource.data.document state is reset before establishing pre conditions for extraction
        resetDocumentSetInputFormat(resource, readResource.data?.document?.inputFormat);

        resource.content = readResource.content;
        this.dataExtractedResource = await processConfStage('extractor', resource, config);
        //dataExtractedContent = dataExtractedResource.content;

        if (!this.dataExtractedResource) {
            this.dataExtractedResource = readResource;
        }

        return this.dataExtractedResource;
    }
    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        if (!this.dataExtractedResource) {
            this.data(resource, config);
        }

        /*resource = await resolveDataFromSrc(resource, config);

        const readResource: FalsyAble<IProcessResource> = await this.getFileResource(resource, config);
        if (!readResource) {
            return resource;
        }*/

        //resource.data.document.src = componentPath;
        //resource.content = readResource.content;
        //resource.content = dataExtractedContent || readResource.content || resource.content;
        return processConfStage('compiler', this.dataExtractedResource || resource, config);

        //return processConfStage('compiler', resource, config);
    }

}