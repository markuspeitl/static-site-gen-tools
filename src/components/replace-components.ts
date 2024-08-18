import type { SsgConfig } from "../config/ssg-config";
import type { IProcessResource } from "../processors/shared/i-processor-resource";
import { getDeferCompileArgs, registerCompileArgsInResource, type DeferCompileArgs } from "./compile-placeholders";
import { recurseProcessSelectedTagNodes } from "@markus/ts-node-util-mk1";
import { getFlatResourceImportSymbols } from "./resolve-imports";


export function replaceDetectedImportPlaceholder(
    $: cheerio.Root,
    currentTag: string,
    currentCursor: cheerio.Cheerio,
    resource: IProcessResource,
    config: SsgConfig
): any {
    const body = $(currentCursor).html();
    const attrs = $(currentCursor).attr();

    const deferCompileArgs: DeferCompileArgs = getDeferCompileArgs(
        currentTag,
        body,
        attrs,
        config
    );

    registerCompileArgsInResource(
        deferCompileArgs,
        resource,
    );

    if (deferCompileArgs && deferCompileArgs.placeholder) {
        $(currentCursor).replaceWith(deferCompileArgs.placeholder);
        $(currentCursor).remove();
    }
    return deferCompileArgs;
}

export async function findReplaceRootClosestComponents(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    const availableImportSymbolsInScope: string[] = await getFlatResourceImportSymbols(resource, config);

    resource.content = await recurseProcessSelectedTagNodes(
        resource.content,
        availableImportSymbolsInScope,
        replaceDetectedImportPlaceholder,
        resource,
        config
    );
    return resource;
}

export async function replaceHtmlComponentsPlaceholders(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {
    const resourceContent: string | undefined = resource.content?.trim();
    if (!resourceContent) {
        return resource;
    }
    resource.content = resourceContent;
    //resource = await resolveImportsFromDocDir(resource, config);
    return findReplaceRootClosestComponents(resource, config);
}


/*const processComponentHtmlNode: TaggedCheerioNodeFn<DeferCompileArgs> = ($: cheerio.Root, currentTag: string, currentCursor: cheerio.Cheerio) => {
        const body = $(currentCursor).html();
        const attrs = $(currentCursor).attr();

        const deferCompileArgs: DeferCompileArgs = getDeferCompileArgs(
            currentTag,
            body,
            attrs,
            config
        );

        registerCompileArgsInResource(
            deferCompileArgs,
            resource,
        );

        if (deferCompileArgs && deferCompileArgs.placeholder) {
            $(currentCursor).replaceWith(deferCompileArgs.placeholder);
            $(currentCursor).remove();
        }
        return deferCompileArgs;
    };*/