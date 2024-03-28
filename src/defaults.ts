import matter from "gray-matter";
import markdownit from "markdown-it/lib";
import { DataExtractors } from "./data-extract";
import { DocCompilers, FalsyAble } from "./document-compile";
import { defaultFragmentCache } from "./fragement-cache";
import { defaultTsDocumentCompiler } from "./ts-compile-runner";
import { defaultMarkdownDataExtractor, defaultMarkdownDocumentCompiler } from "./md-compile-runner";

export function getDefaultDataExtractors(): DataExtractors {
    const extractors: DataExtractors = {};
    extractors.md = defaultMarkdownDataExtractor;
    return extractors;
}
export const defaultDataExtractors: DocCompilers = getDefaultDocCompilers();


export function getDefaultDocCompilers(): DocCompilers {
    const docCompilers: DocCompilers = {};
    docCompilers.md = defaultMarkdownDocumentCompiler;
    docCompilers.ts = defaultTsDocumentCompiler;
    return docCompilers;
}
export const defaultDocCompilers: DocCompilers = getDefaultDocCompilers();

export function setDefaultFragmentCache(config: any): void {
    if (!config.fragmentCache) {
        config.fragmentCache = defaultFragmentCache;
    }
}