import { arrayify } from "./components/helpers/array-util";
import { FalsyAble } from "./components/helpers/generic-types";
import { SsgConfig } from "./config";
import { DocumentData } from "./data-extract";
import { CompilerModule } from "./defaults";
import { compileDocument, DocumentCompileData } from "./document-compile";
import { getResolveTsModuleWithConfig } from "./module-loading/util";
import * as shlex from 'shlex';

export function getCompileDataProp(doc: DocumentCompileData, key: string, ctxPriority: boolean = false): any {

    let lowPriorityData: FalsyAble<DocumentData> = doc.dataCtx;
    let highPriorityData: FalsyAble<DocumentData> = doc.data;

    if (ctxPriority) {
        lowPriorityData = doc.data;
        lowPriorityData = doc.dataCtx;
    }

    if (!lowPriorityData) {
        lowPriorityData = {};
    }
    if (!highPriorityData) {
        highPriorityData = {};
    }

    return lowPriorityData[ key ] || highPriorityData[ key ];
}

export async function walkLayoutCompileChain(content: DocumentCompileData, layoutStack: DocumentCompileData[], config: SsgConfig): DocumentCompileData {

    layoutStack.push(content);

    //In order to treat the current data output context (after compilation) with higher priority as the
    //input document data
    const ctxDataPriority: boolean = Boolean(config.ctxDataPriority);

    const layoutProp: string = getCompileDataProp(content, 'layout', ctxDataPriority);
    const layoutsProp: string[] = getCompileDataProp(content, 'layouts', ctxDataPriority);

    const layouts: string[] = arrayify(layoutProp).concat(arrayify(layoutsProp));

    const reversedLayouts: string[] = layouts.reverse();

    let layoutRenderCmd: string | undefined = reversedLayouts.pop();
    let lastRenderedDoc: DocumentCompileData | null = content;
    while (layoutRenderCmd) {

        const compiledLayoutDoc: DocumentCompileData | null = await compileLayout(layoutRenderCmd, content, config);
        if (compiledLayoutDoc) {
            layoutStack.push(compiledLayoutDoc);
            lastRenderedDoc = compiledLayoutDoc;
        }

        layoutRenderCmd = reversedLayouts.pop();
    }

    //Layouts that fail to render are skipped, and only the last valid one is returned
    return lastRenderedDoc;
}

export async function compileLayout(layoutRenderCmd: string, childDocCompiled: DocumentCompileData, config?: SsgConfig): Promise<DocumentCompileData | null> {
    const layoutRenderCmdParts: string[] = shlex.split(layoutRenderCmd);

    if (layoutRenderCmdParts.length <= 0) {
        return null;
    }

    let selectedLayoutFile: string | null = null;
    let layoutRunnner: string | null = null;
    if (layoutRenderCmdParts.length <= 1) {
        selectedLayoutFile = layoutRenderCmdParts[ 0 ];
    } else {
        layoutRunnner = layoutRenderCmdParts[ 0 ];
        selectedLayoutFile = layoutRenderCmdParts[ 1 ];
    }

    const childDocPath: string = childDocCompiled.dataCtx?.inputPath;

    const resolvedLayoutRunner: CompilerModule = getResolveTsModuleWithConfig<CompilerModule>(layoutRunnner, [ childDocPath ], config?.tsModulesCache, config, 'compilerResolvePaths');
    //const resolvedComponentModule = getResolveTsModuleWithConfig(selectedLayoutFile, [ childDocPath ], config?.tsModulesCache, config, 'componentResolvePaths');

    //1. path to layout runner -> use layout runner without fileContent (in theory can be used to render custom code alternatively)
    //2. path to layout or id of layout -> auto detect runner and use runner to compile layout content
    //3. layout runner + layout -> use the selected layout runner to run the selected layout




}