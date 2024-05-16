import { resolveDataFromSrc } from "../../compilers/resolve-sub-html.runner";
import { DataParsedDocument } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { resetDocumentSetInputFormat } from "../../processing/i-resource-processor";
import { processConfStage, useReaderStageToRead } from "../../processing/process-resource";
import { IInternalComponent } from "../base-component";
import { FalsyAble } from "../helpers/generic-types";


/*const cachedFileResources: Record<string, DataParsedDocument> = {};
export async function getFileResource(documentPath: string, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

    if (cachedFileResources[ documentPath ]) {
        return cachedFileResources[ documentPath ];
    }

    const readResource: DataParsedDocument = await useReaderStageToRead(documentPath, config);
    if (!readResource.content || !readResource.data?.document?.inputFormat) {
        return null;
    }

    cachedFileResources[ documentPath ] = readResource;

    return readResource;
}*/

export class FileComponent implements IInternalComponent {
    protected path: string | null = null;

    protected readFileResource: DataParsedDocument | null = null;
    protected dataExtractedResource: DataParsedDocument | null = null;

    constructor (path?: string) {
        if (path) {
            this.path = path;
        }
    }

    private getTargetPath(resource?: DataParsedDocument): string | null {
        if (resource?.data?.path) {
            return resource.data.path;
        }
        return this.path;
    }

    private async getFileResource(resource?: DataParsedDocument, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

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

        let readResource: DataParsedDocument = await useReaderStageToRead(documentPath, config);

        if (!readResource.content || !readResource.data?.document?.inputFormat) {
            return null;
        }

        this.readFileResource = readResource;

        return readResource;
    }


    public async data(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {
        const readResource: FalsyAble<DataParsedDocument> = await this.getFileResource(resource, config);
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
    public async render(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {

        if (!this.dataExtractedResource) {
            this.data(resource, config);
        }

        /*resource = await resolveDataFromSrc(resource, config);

        const readResource: FalsyAble<DataParsedDocument> = await this.getFileResource(resource, config);
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