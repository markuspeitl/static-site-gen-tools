import type { SsgConfig } from "../config";
import type { IProcessResource } from "../pipeline/i-processor";
import { resetDocumentSetInputFormat } from "../processing/i-resource-processor";
import type { IInternalComponent } from "./base-component";

/*export function normalizeArgsToIProcessResource(dataCtx?: DocumentData | null): IProcessResource {
    if (dataCtx?.content && dataCtx?.data) {
        return dataCtx as IProcessResource;
    }
    const toCompileResource: IProcessResource = {
        content: dataCtx?.content,
        data: dataCtx,
    };
    return toCompileResource;
}

export async function deferContentCompile(resource: IProcessResource, config: SsgConfig, inputFormat: string = 'html'): Promise<IProcessResource | DocumentData> {
    let compileBodyResource: IProcessResource = normalizeArgsToIProcessResource(resource);

    //const bodyFormat = this.getContentFormat(config);
    compileBodyResource = resetDocumentSetInputFormat(compileBodyResource, inputFormat);
    compileBodyResource.id = undefined;


    const dataExtractedDocument: FalsyAble<IProcessResource> = await config.processor.processStages(compileBodyResource, config);
    if (!dataExtractedDocument) {
        return compileBodyResource;
    }
    return dataExtractedDocument;
}*/

export abstract class BaseCompileContentFormatComponent implements IInternalComponent {
    // TODO: currently this matches the 'inputFormat' as defined in the stages definition,
    // --> make more fine grain control possible to select specific 'processors' to use (html.extractor.ts, md.extractor.ts, .etc)
    //public abstract getContentFormat(config: SsgConfig): string;
    public abstract contentFormat: string;

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        resource = resetDocumentSetInputFormat(resource, this.contentFormat);
        resource.id = undefined;

        //TODO: right now the `processResource` call using a document with only `inputFormat` set will result in the
        //data extraction stage being processed, followed by the compiling stage --> should not be the case when doing 'data'
        //return deferContentCompile(resource, config, this.contentFormat);
        //return processConfStage('extractor', resource, config);

        const dataExtractedResource: IProcessResource = await config.processor.processFork(
            resource,
            config,
            [ 'extractor' ]
        );
        return dataExtractedResource;
    }
    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {

        resource = resetDocumentSetInputFormat(resource, this.contentFormat);
        resource.id = undefined;

        //return deferContentCompile(resource, config, this.contentFormat);
        //return processConfStage('compiler', resource, config);

        const compiledResource: IProcessResource = await config.processor.processFork(
            resource,
            config,
            [ 'compiler' ]
        );
        return compiledResource;
    }
}