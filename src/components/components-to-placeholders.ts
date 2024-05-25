import type { SsgConfig } from "../config";
import type { IProcessResource } from "../pipeline/i-processor";
import type { IInternalComponent } from "./base-component";
import type { FalsyAble } from "./helpers/generic-types";
import { registerCompileArgsResource, type DeferCompileArgs } from "./deferred-component-compiling";
import { cheerioDfsWalkFirstTop, CheerioNodeFn, loadHtml, TaggedCheerioNodeFn, unparseHtml } from "../utils/cheerio-util";
import { getResourceImportsCache } from "./component-imports";


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

            /*const body = $(currentCursor).html();
            const attrs = $(currentCursor).attr();

            const deferCompileArgs = registerCompileArgsResource(resource, currentTag, body, attrs);

            if (deferCompileArgs && deferCompileArgs.placeholder) {
                $(currentCursor).replaceWith(deferCompileArgs.placeholder);
                $(currentCursor).remove();
            }
            return deferCompileArgs;*/
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

/*export async function substituteComponentsPlaceholder(
    resource: IProcessResource,
    config: SsgConfig,
): Promise<FalsyAble<IProcessResource>> {

    //let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    //const importScopeSymbols: string[] = Object.keys(selectedDependencies);
    //Find component entry points (first/top-level components, nodes that are components in the syntax tree)

    //Note: Must do a BFS search to properly work -> otherwise components under a component might be replaced as well
    //(though that should be the component's responsibility that holds this component)
    //resource = await detectReplaceComponents(resource, config, (tag: string, body: string, attrs: any) => registerCompileArgsResource(resource, tag, body, attrs));

    return findReplaceTopLevelDetectedComponents(resource, config);

    //return resource;
}*/