import type { SsgConfig } from "../config";
import type { IProcessResource } from "../pipeline/i-processor";
import type { IInternalComponent } from "./base-component";
import { registerCompileArgsResource, type DeferCompileArgs } from "./deferred-component-compiling";
import { cheerioDfsWalkFirstTop, CheerioNodeFn, loadHtml, TaggedCheerioNodeFn, unparseHtml } from "../utils/cheerio-util";
import { getResourceImportsCache, resolveImportsFromDocDir } from "./component-imports";


export async function processTopLevelNodesOfSymbols(html: string, symbolsToDetect: string[], processNodeFn: TaggedCheerioNodeFn<any>): Promise<string> {

    const $ = loadHtml(html);
    const currentNode = $.root();

    const handleNode: CheerioNodeFn<DeferCompileArgs> = ($: cheerio.Root, currentCursor: cheerio.Cheerio) => {

        const tagSel = $(currentCursor).prop('tagName');

        if (!tagSel) {
            return undefined;
        }

        const currentTag = tagSel.toLowerCase();

        if (currentTag && symbolsToDetect.includes(currentTag)) {

            const processingResult = processNodeFn($, currentTag, currentCursor);
            return processingResult;
        }
        return undefined;
    };

    cheerioDfsWalkFirstTop<DeferCompileArgs>($, currentNode, handleNode, handleNode);

    const processedHtml: string = unparseHtml($);
    return processedHtml;
}

export async function findReplaceTopLevelDetectedComponents(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    const importScopeSymbols: string[] = Object.keys(selectedDependencies);

    const processComponentHtmlNode: TaggedCheerioNodeFn<DeferCompileArgs> = ($: cheerio.Root, currentTag: string, currentCursor: cheerio.Cheerio) => {
        const body = $(currentCursor).html();
        const attrs = $(currentCursor).attr();

        const deferCompileArgs = registerCompileArgsResource(resource, currentTag, body, attrs);

        if (deferCompileArgs && deferCompileArgs.placeholder) {
            $(currentCursor).replaceWith(deferCompileArgs.placeholder);
            $(currentCursor).remove();
        }
        return deferCompileArgs;
    };

    resource.content = await processTopLevelNodesOfSymbols(resource.content, importScopeSymbols, processComponentHtmlNode);
    return resource;
}

export async function detectReplaceComponentsToPlaceholders(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {
    const resourceContent: string | undefined = resource.content?.trim();
    if (!resourceContent) {
        return resource;
    }
    resource.content = resourceContent;
    resource = await resolveImportsFromDocDir(resource, config);
    return findReplaceTopLevelDetectedComponents(resource, config);
}