import markdownit from "markdown-it/lib";
import { DataExtractor, DocumentData } from "./data-extract";
import { DataParsedDocument, DocumentCompiler } from "./document-compile";
import matter from "gray-matter";

const mdItInstance = markdownit();
export const defaultMarkdownDocumentCompiler: DocumentCompiler = {
    compile: async (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any) => {

        if (!fileContent) {
            return null;
        }
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);

        const compiledOutput: DataParsedDocument = {
            content: mdItInstance.render(fileContent),

            //If any from outside accessible data properties or functions get defined within the component evaluated from 
            //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
            data: dataCtx
        };

        return compiledOutput;
    }
};

export const defaultMarkdownDataExtractor: DataExtractor = {
    extractData: async (fileContent: string, config?: any) => {
        const dataParsedMdFile: matter.GrayMatterFile<string> = matter(fileContent);
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        //mdItInstance.render(fileContent);

        return dataParsedMdFile.data;
    }
};