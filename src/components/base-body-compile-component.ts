import { SsgConfig } from "../config";
import { IProcessResource } from "../pipeline/i-processor";
import { processTreeStages } from "../processing-tree-wrapper";
import { resetDocumentSetInputFormat } from "../processing/i-resource-processor";
import { IInternalComponent } from "./base-component";

/*export function normalizeArgsToDataParsedDocument(dataCtx?: DocumentData | null): DataParsedDocument {
    if (dataCtx?.content && dataCtx?.data) {
        return dataCtx as DataParsedDocument;
    }
    const toCompileResource: DataParsedDocument = {
        content: dataCtx?.content,
        data: dataCtx,
    };
    return toCompileResource;
}

export async function deferContentCompile(resource: DataParsedDocument, config: SsgConfig, inputFormat: string = 'html'): Promise<DataParsedDocument | DocumentData> {
    let compileBodyResource: DataParsedDocument = normalizeArgsToDataParsedDocument(resource);

    //const bodyFormat = this.getContentFormat(config);
    compileBodyResource = resetDocumentSetInputFormat(compileBodyResource, inputFormat);
    compileBodyResource.id = undefined;


    const dataExtractedDocument: FalsyAble<DataParsedDocument> = await processSubPath(compileBodyResource, config);
    if (!dataExtractedDocument) {
        return compileBodyResource;
    }
    return dataExtractedDocument;
}*/

export abstract class BaseCompileContentFormatComponent implements IInternalComponent {
    // TODO: currently this matches the 'inputFormat' as defined in the stages definition,
    // --> make more fine grain control possible to select specific 'processors' to use (html.extractor.ts, md.extractor.ts, .etc)
    //public abstract getContentFormat(config?: SsgConfig): string;
    public abstract contentFormat: string;

    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        resource = resetDocumentSetInputFormat(resource, this.contentFormat);
        resource.id = undefined;

        //TODO: right now the `processResource` call using a document with only `inputFormat` set will result in the
        //data extraction stage being processed, followed by the compiling stage --> should not be the case when doing 'data'
        //return deferContentCompile(resource, config, this.contentFormat);
        //return processConfStage('extractor', resource, config);

        const dataExtractedResource: IProcessResource = await processTreeStages([ 'extractor' ], resource, config);
        return dataExtractedResource;
    }
    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {

        resource = resetDocumentSetInputFormat(resource, this.contentFormat);
        resource.id = undefined;

        //return deferContentCompile(resource, config, this.contentFormat);
        //return processConfStage('compiler', resource, config);

        const compiledResource: IProcessResource = await processTreeStages([ 'compiler' ], resource, config);
        return compiledResource;
    }
}