import { CompileRunner, DataParsedDocument, DocumentData } from "../compilers/runners";
import { SsgConfig } from "../config";
import { resetDocumentSetInputFormat } from "../processing/i-resource-processor";
import { processConfStage, processResource } from "../processing/process-resource";
import { IInternalComponent } from "./base-component";
import { FalsyAble } from "./helpers/generic-types";

export function normalizeArgsToDataParsedDocument(dataCtx?: DocumentData | null): DataParsedDocument {
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


    const dataExtractedDocument: FalsyAble<DataParsedDocument> = await processResource(compileBodyResource, config);
    if (!dataExtractedDocument) {
        return compileBodyResource;
    }
    return dataExtractedDocument;
}

export abstract class BaseCompileContentFormatComponent implements IInternalComponent {
    // TODO: currently this matches the 'inputFormat' as defined in the stages definition,
    // --> make more fine grain control possible to select specific 'processors' to use (html.extractor.ts, md.extractor.ts, .etc)
    //public abstract getContentFormat(config?: SsgConfig): string;
    public abstract contentFormat: string;

    public async data(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {

        resource = resetDocumentSetInputFormat(resource, this.contentFormat);
        resource.id = undefined;

        //TODO: right now the `processResource` call using a document with only `inputFormat` set will result in the
        //data extraction stage being processed, followed by the compiling stage --> should not be the case when doing 'data'
        //return deferContentCompile(resource, config, this.contentFormat);
        return processConfStage('extractor', resource, config);
    }
    public async render(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {

        resource = resetDocumentSetInputFormat(resource, this.contentFormat);
        resource.id = undefined;

        //return deferContentCompile(resource, config, this.contentFormat);
        return processConfStage('compiler', resource, config);
    }
}