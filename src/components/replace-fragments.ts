import type { SsgConfig } from "../config/ssg-config";
import type { IProcessResource } from "../processors/shared/i-processor-resource";
import { FalsyAble, getSimpleCharsHashId, recurseProcessSelectedTagNodes } from "@markus/ts-node-util-mk1";
import { getFlatResourceImportSymbols } from "./resolve-imports";
import { IFragmentCompile } from "./compile-fragments";

const placeHolderTagPostfix = 'frag';

export function registerPendingFragmentInResource(
    fragmentCompileArgs: IFragmentCompile,
    resource: IProcessResource,
): void {

    if (!fragmentCompileArgs) {
        return;
    }

    if (!resource) {
        resource = {};
    }
    if (!resource) {
        resource = {};
    }
    if (!resource.pendingFragments) {
        resource.pendingFragments = [];
    }

    resource.pendingFragments.push(fragmentCompileArgs);
}

export function getFragmentCompileArgs(
    componentName: string,
    componentBody: FalsyAble<string>,
    attrs: FalsyAble<any>,
    config: FalsyAble<SsgConfig>
): IFragmentCompile {

    //const componentName: string = tag;
    const content: FalsyAble<string> = componentBody;

    const fragmentCompileArgs: IFragmentCompile = {
        name: componentName,
        placeholder: '',
        content: content || '',
        attrs: attrs
    };
    const componentArgsId = getSimpleCharsHashId(
        fragmentCompileArgs,
        config?.placeholderChars
    );
    fragmentCompileArgs.id = componentArgsId;

    const placeholderTagName: string = `${componentName}-${placeHolderTagPostfix}`;
    const placeholderFullTagHtml = `<${placeholderTagName} id="${fragmentCompileArgs.id}"/>`;
    fragmentCompileArgs.placeholder = placeholderFullTagHtml;
    return fragmentCompileArgs;
}


export function replaceDetectedHtmlFragment(
    $: cheerio.Root,
    currentTag: string,
    currentCursor: cheerio.Cheerio,
    resource: IProcessResource,
    config: SsgConfig
): any {
    const body = $(currentCursor).html();
    const attrs = $(currentCursor).attr();

    const deferCompileArgs: IFragmentCompile = getFragmentCompileArgs(
        currentTag,
        body,
        attrs,
        config
    );

    registerPendingFragmentInResource(
        deferCompileArgs,
        resource,
    );

    if (deferCompileArgs && deferCompileArgs.placeholder) {
        $(currentCursor).replaceWith(deferCompileArgs.placeholder);
        $(currentCursor).remove();
    }
    return deferCompileArgs;
}

export async function findReplaceRootClosestFragments(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    const availableImportSymbolsInScope: string[] = await getFlatResourceImportSymbols(resource, config);

    resource.content = await recurseProcessSelectedTagNodes(
        resource.content,
        availableImportSymbolsInScope,
        replaceDetectedHtmlFragment,
        resource,
        config
    );
    return resource;
}

export async function replaceHtmlFragments(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {
    const resourceContent: string | undefined = resource.content?.trim();
    if (!resourceContent) {
        return resource;
    }
    resource.content = resourceContent;
    //resource = await resolveImportsFromDocDir(resource, config);
    return findReplaceRootClosestFragments(resource, config);
}