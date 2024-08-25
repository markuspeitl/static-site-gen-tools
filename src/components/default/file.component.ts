import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";
import type { IInternalComponent } from "../base/i-component";
import type { FalsyAble } from "@markus/ts-node-util-mk1";

/*const cachedFileResources: Record<string, IProcessResource> = {};
export async function getFileResource(documentPath: string, config: SsgConfig): Promise<FalsyAble<IProcessResource>> {

    if (cachedFileResources[ documentPath ]) {
        return cachedFileResources[ documentPath ];
    }

    const readResource: IProcessResource = await useReaderStageToRead(documentPath, config);
    if (!readResource.content || !readresource.inputFormat) {
        return null;
    }

    cachedFileResources[ documentPath ] = readResource;

    return readResource;
}*/

export interface IFileResource extends IProcessResource {
    path: string,
}

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
        if (resource.path) {
            return resource.path;
        }
        return this.path;
    }

    private async getFileResource(resource: IProcessResource, config: SsgConfig): Promise<FalsyAble<IProcessResource>> {

        if (this.readFileResource) {
            return this.readFileResource;
        }

        if (!this.path && !resource.path) {
            return null;
        }
        const documentPath: string | null = this.getTargetPath(resource);
        if (!documentPath) {
            return null;
        }

        let readResource: IProcessResource = await config.processor.processDocument([ 'extractor', 'compiler' ], documentPath, config);

        if (!readResource.content || !readresource.inputFormat) {
            return null;
        }

        this.readFileResource = readResource;

        return readResource;
    }*/


    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        const dataPath: string | undefined = this.path || (resource as IFileResource).path;
        if (!dataPath) {
            return resource;
        }
        this.path = dataPath;

        const readResource: FalsyAble<IProcessResource> = await config.processor.processDocument(
            this.path,
            config,
            [ 'reader' ]
        );
        if (!readResource) {
            return resource;
        }

        /*const readResource: FalsyAble<IProcessResource> = await this.getFileResource(resource, config);
        if (!readResource) {
            return resource;
        }*/

        //make sure the resource.document state is reset before establishing pre conditions for extraction
        //resetDocumentSetInputFormat(resource, readresource.inputFormat);

        //resource.content = readResource.content;
        this.dataExtractedResource = await config.processor.processStages(readResource, config, [ 'extractor' ]);

        if (!this.dataExtractedResource) {
            this.dataExtractedResource = readResource;
        }

        return this.dataExtractedResource;
    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        if (!this.dataExtractedResource) {
            this.data(resource, config);
        }

        const resourceToCompile: IProcessResource = this.dataExtractedResource || resource;

        //resourceToCompile.content = resource.content;

        return await config.processor.processStages(resourceToCompile, config, [ 'compiler' ]);
    }

}