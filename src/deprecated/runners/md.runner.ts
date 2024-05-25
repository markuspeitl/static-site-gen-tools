
import { getLibInstance } from "../dependencies/module-instances";
import { CompileRunner, DataParsedDocument, DocumentData } from './runners';
//import matter from "gray-matter";
import type markdownit from "markdown-it/lib";
import type * as matter from "gray-matter";
import { SsgConfig } from "../config";
import { FileRunner } from "./file.runner";
import { FalsyAble } from "../components/helpers/generic-types";
import { ResolveSubHtmlRunner } from "./resolve-sub-html.runner";
type MatterType = typeof matter;


async function parseMarkdownData(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    const matterInstance: any = await getLibInstance('matter', config);
    //const matter = getOverrideOrLocal('matter', config);

    const dataParsedMdFile: matter.GrayMatterFile<string> = matterInstance.default(resource.content);
    //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
    //mdItInstance.render(fileContent);

    //return dataParsedMdFile.data;

    return {
        content: dataParsedMdFile.content,
        data: dataParsedMdFile.data,
    };
}

async function compileMarkdownResource(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    const markdownRendererInstance: markdownit = await getLibInstance('markdown', config, {
        html: true,
        linkify: true,
        typographer: true
    });

    const compiledOutput: DataParsedDocument = {
        content: markdownRendererInstance.render(resource.content),

        //If any from outside accessible data properties or functions get defined within the component evaluated from 
        //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
        data: resource.data
    };
    return compiledOutput;
}


export class MarkdownRunner extends ResolveSubHtmlRunner {
    public async parseDocumentData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        return parseMarkdownData(resource, config);
    }
    public async compileRootDocument(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource.content) {
            return resource;
        }
        if (!resource.data) {
            const extractedDataDoc: FalsyAble<DataParsedDocument> = await this.extractData(resource.content, config);
            if (!extractedDataDoc) {
                return resource;
            }
            resource = extractedDataDoc;
        }

        return compileMarkdownResource(resource, config);
    }
}


/*export class MarkdownRunner extends FileRunner {

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        const matterInstance: any = await getLibInstance('matter', config);
        //const matter = getOverrideOrLocal('matter', config);

        const dataParsedMdFile: matter.GrayMatterFile<string> = matterInstance.default(resource.content);
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        //mdItInstance.render(fileContent);

        //return dataParsedMdFile.data;

        return {
            content: dataParsedMdFile.content,
            data: dataParsedMdFile.data,
        };
    }

    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.content) {
            return null;
        }
        if (!resource.data) {
            resource.data = await this.extractData(resource.content, config);
        }

        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);

        //const markdownRendererInstance: markdownit = getOverrideOrLocal('markdown', config);
        const markdownRendererInstance: markdownit = await getLibInstance('markdown', config, {
            html: true,
            linkify: true,
            typographer: true
        });

        const compiledOutput: DataParsedDocument = {
            content: markdownRendererInstance.render(resource.content),

            //If any from outside accessible data properties or functions get defined within the component evaluated from 
            //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
            data: resource.data
        };

        return compiledOutput;
    }

}*/

export function getInstance(): CompileRunner {
    return new MarkdownRunner();
}



/*export function getCompiler(): DocumentCompiler {
    const defaultMarkdownDocumentCompiler: DocumentCompiler = {
        compile: async (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig) => {

            if (!fileContent) {
                return null;
            }
            //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);

            //const markdownRendererInstance: markdownit = getOverrideOrLocal('markdown', config);
            const markdownRendererInstance: markdownit = await getLibInstance('markdown', config);

            const compiledOutput: DataParsedDocument = {
                content: markdownRendererInstance.render(fileContent),

                //If any from outside accessible data properties or functions get defined within the component evaluated from 
                //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
                data: dataCtx
            };

            return compiledOutput;
        }
    };

    return defaultMarkdownDocumentCompiler;
}


export function getExtractor(): DataExtractor {
    const defaultMarkdownDataExtractor: DataExtractor = {
        extractData: async (fileContent: string, config?: SsgConfig) => {

            const matterInstance: any = await getLibInstance('matter', config);
            //const matter = getOverrideOrLocal('matter', config);

            const dataParsedMdFile: matter.GrayMatterFile<string> = matterInstance(fileContent);
            //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
            //mdItInstance.render(fileContent);

            return dataParsedMdFile.data;
        }
    };

    return defaultMarkdownDataExtractor;
}*/
