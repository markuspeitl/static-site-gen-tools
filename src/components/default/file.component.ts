import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource } from "../../processors/shared/i-processor-resource";
import type { IInternalComponent } from "../base/i-component";
import type { FalsyAble, FalsyString } from "@markus/ts-node-util-mk1";

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

export function getPathFromResource(resource: IProcessResource): string | null {
    if (resource.path) {
        return resource.path;
    }

    const fragmentTag = resource.fragmentTag;
    if (fragmentTag) {

        if (resource.localImportSymbols) {
            const fragmentImportPath: string = resource.localImportSymbols[ fragmentTag ];
            if (fragmentImportPath) {
                return fragmentImportPath;
            }
        }
        if (resource.currentImportSymbols) {
            const allImportsFragmentImportPath: string = resource.currentImportSymbols[ fragmentTag ];
            if (allImportsFragmentImportPath) {
                return allImportsFragmentImportPath;
            }
        }
    }

    return null;
}

export class FileComponent implements IInternalComponent {
    protected path: string | null = null;
    //protected renderString: string | null = null;

    //protected readFileResource: IProcessResource | null = null;
    //protected dataExtractedResource: IProcessResource | null = null;

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

        let dataPath: FalsyString = getPathFromResource(resource);
        if (!dataPath) {
            dataPath = this.path;
        }
        let path = dataPath;
        if (!path) {
            return resource;
        }

        const readResource: FalsyAble<IProcessResource> = await config.processor.processDocument(
            path,
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
        const fileDataExtractedResource: IProcessResource = await config.processor.processStages(readResource, config, [ 'extractor' ]);

        /*if (!this.dataExtractedResource) {
            this.dataExtractedResource = readResource;
        }*/

        //this.renderString = fileDataExtractedResource.content;
        //this.srcFormat = fileDataExtractedResource.content;

        const data: any = config.scopes.dataFromResource(fileDataExtractedResource);
        //data.srcFormat = fileDataExtractedResource.srcFormat;

        const dataExtractedResource = Object.assign(
            {},
            data,
            {
                frameContent: fileDataExtractedResource.content,
                srcFormat: fileDataExtractedResource.srcFormat,
                src: path,
                path: path
            }
        ) as IProcessResource;

        return {
            fileDataResource: dataExtractedResource
        };

    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        /*if (this && !this.dataExtractedResource) {
            this.dataExtractedResource = await this.data(resource, config);
        }*/

        let dataExtractedResource = resource.fileDataResource;

        if (!dataExtractedResource) {
            return resource;
        }

        //const currentDataScope: any = config.scopes.dataFromResource(dataExtractedResource);

        const inputContentResource: IProcessResource = await config.processor.renderFork(
            resource,
            config,
            undefined,
            dataExtractedResource,
            [ 'extractor', 'compiler' ],
        );


        const resourceToCompile: IProcessResource = dataExtractedResource;

        //resourceToCompile.input = inputContentResource.content;
        resourceToCompile.input = inputContentResource.content;
        resourceToCompile.content = resourceToCompile.frameContent;

        /*let currentInputData: any = undefined;
        if (resourceToCompile !== resource) {
            currentInputData = config.scopes.dataFromResource(resource);
        }

        if (this.dataExtractedResource) {
            currentInputData.srcFormat = this.dataExtractedResource.srcFormat;
        }*/

        //resourceToCompile.content = resource.content;

        const fileRenderedResource: IProcessResource = await config.processor.renderFork(
            resourceToCompile,
            config,
            undefined,
            resourceToCompile,
            [ 'extractor', 'compiler' ],
        );

        return fileRenderedResource;

        //return await config.processor.processStages(resourceToCompile, config, [ 'compiler' ]);
    }

}