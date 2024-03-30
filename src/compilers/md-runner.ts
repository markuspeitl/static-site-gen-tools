
import { getLibInstance } from "../dependencies/module-instances";
import { FalsyAble } from '../utils/util';
import { CompileRunner, DataParsedDocument, DocumentData } from './runners';
//import matter from "gray-matter";
import type markdownit from "markdown-it/lib";
import type * as matter from "gray-matter";
import { SsgConfig } from "../config";
import { FileRunner } from "./file-runner";
type MatterType = typeof matter;

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

export class MarkdownRunner extends FileRunner {

    public async extractData(fileContent: string, config?: SsgConfig): Promise<DataParsedDocument | DocumentData | null> {

        const matterInstance: any = await getLibInstance('matter', config);
        //const matter = getOverrideOrLocal('matter', config);

        const dataParsedMdFile: matter.GrayMatterFile<string> = matterInstance.default(fileContent);
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        //mdItInstance.render(fileContent);

        //return dataParsedMdFile.data;

        return {
            content: dataParsedMdFile.content,
            data: dataParsedMdFile.data
        };
    }

    public async compile(fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!fileContent) {
            return null;
        }

        if (typeof fileContent === 'object') {
            fileContent = (fileContent as any).content;
        }

        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);

        if (!fileContent) {
            return null;
        }

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

}

export function getInstance(): CompileRunner {
    return new MarkdownRunner();
}
