import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import { AttrDict, isEmpty, type FalsyAble } from "@markus/ts-node-util-mk1";


export function loadHtml(html: string, noHtmlEntities: boolean = true): cheerio.Root {

    //For some reasom loading the document with 'null, false' completely discards html and body elements from the 
    //resulting document
    //if (html.includes('<html')) {
    //    return cheerio.load(html);
    //}


    //return cheerio.load(html, null, false);


    //https://cheerio.js.org/docs/api/interfaces/HTMLParser2Options
    //Using xmlMode prevents it from adding or removing html/body elements when parsing

    return cheerio.load(html, {
        xmlMode: true,
        decodeEntities: !noHtmlEntities,
        selfClosingTags: false, //forces all self closing tags to be closed --> disables parsing of self closing!
        //Self closing tags being closed without content is allowed for HTML5, but not for XHTML
        //https://github.com/cheeriojs/cheerio/issues/1235
        //https://github.com/lesjoursfr/html-to-epub/issues/50
        // @ts-ignore
    }, false);
}

export function unparseHtml($: cheerio.Root): string {
    //const docHtml: string = $.root().prop('outerHTML');
    const rootElem = $.root();
    const docHtml: string | null = rootElem.html();

    if (!docHtml) {
        return '';
    }

    return docHtml;
}

export function unwrapHtml(html?: string): string {
    if (!html) {
        return '';
    }
    const $: cheerio.Root = loadHtml(html);
    return $(':root').html() || '';
}

export function selectHtmlItemsBetween(html: string, startTag: string, endTag: string, selectInclude: 'both' | 'start' | 'end' | null = 'both'): string[] {

    // @ts-ignore
    const $: cheerio.Root = loadHtml(html);

    const selectedHtmlRanges: string[] = [];

    $(startTag).each((index: number, element: cheerio.Element) => {

        const endTagOpts = `${startTag},${endTag}`;

        let betweenSelection = $(element).nextUntil(endTagOpts);

        /*const thishtml = $(element).html();
        let toNextTitle = $(element).nextUntil(startTag);
        toNextTitle = $(element).nextUntil(startTag).addBack();
        const toNextTitleHtml = toNextTitle.html();*/

        if (selectInclude) {
            if (selectInclude === 'both' || selectInclude === 'start') {
                betweenSelection.addBack();
            }
            if (selectInclude === 'both' || selectInclude === 'end') {
                betweenSelection.add(endTag);
            }
        }

        //const selectionHtml: string | null = betweenSelection.html();
        const selectionHtml: string | null = htmlOfQueryElem(betweenSelection, $);

        if (selectionHtml) {
            selectedHtmlRanges.push(selectionHtml);
        }

    });

    return selectedHtmlRanges;
}


export interface SplitToken {
    selector: string,
    close: boolean;
}

function splitTokenOf(elem: cheerio.Cheerio, splitTokens: SplitToken[]): SplitToken | null {
    for (const splitToken of splitTokens) {
        if (elem.is(splitToken.selector)) {
            return splitToken;
        }
    }
    return null;
}


export interface SelectionResult {
    start: SplitToken | null;
    end: SplitToken | null;
    selection: cheerio.Cheerio | null;
}


//Select inclusive the first and exclusive the next matched element
export function selectUntilTokens(currentElem: cheerio.Cheerio, splitTokens: SplitToken[]): SelectionResult {

    const splitTokenSelectors = splitTokens.map((token: SplitToken) => token.selector);
    const joinedSplitSelector = splitTokenSelectors.join(',');

    let selection = currentElem.nextUntil(joinedSplitSelector).addBack();

    //let selection;
    /*if (betweenSelection.length > 0) {
        selection = betweenSelection;

        const detectedEnd = selection.next();

        const splitTokenOfEnd = splitTokenOf(detectedEnd, splitTokens)

        if (splitTokenOfEnd && splitTokenOfEnd.close) {
            betweenSelection.add(detectedEnd);
        }

    }*/
    if (!selection || selection.length <= 0) {
        selection = currentElem.nextAll().addBack();
    }

    /*if (betweenSelection.length) {
        betweenSelection.addBack();
        const lastSelectedElem = betweenSelection.last()
        const lastRangeElem = lastSelectedElem.next()

        const splitToken = splitTokenOf(lastRangeElem, splitTokens)
        if (!splitToken || !splitToken?.open) {
            betweenSelection.add(lastRangeElem);    
        }
    }*/

    const startToken = splitTokenOf(currentElem, splitTokens);
    const endToken = splitTokenOf(selection.last(), splitTokens);
    return {
        start: startToken,
        end: endToken,
        selection: selection,
    };
}

export function splitRanges(html: string, splitTokens: SplitToken[]): string[] {
    // @ts-ignore
    const $: cheerio.Root = loadHtml(html);

    //const splitSelector = splitTokens.join(',');

    const openingTokens: SplitToken[] = splitTokens.filter((token: SplitToken) => !token.close);
    const openingTokenFirstSelectors: string[] = openingTokens.map((token: SplitToken) => `${token.selector}:first`);
    const firstOpenSelector = openingTokenFirstSelectors.join(',');

    //let lastSelectedChild = $(':first-child');
    //let lastSelectedChild = $('h3:first');

    let lastSelectedChild = $(firstOpenSelector);

    const rangesHtml: string[] = [];

    while (lastSelectedChild.length > 0) {
        const selectionObj = selectUntilTokens(lastSelectedChild, splitTokens);

        if (selectionObj && selectionObj.selection) {
            const selection = selectionObj.selection;

            const nextAfterSelectionEnd = selection.last().next();

            let endChild;

            if (nextAfterSelectionEnd) {
                const splitTokenOfEnd = splitTokenOf(nextAfterSelectionEnd, splitTokens);
                if (splitTokenOfEnd?.close) {
                    selection.add(nextAfterSelectionEnd);

                    endChild = nextAfterSelectionEnd;
                }
            }

            if (!endChild) {
                endChild = selection.last().next();
            }

            /*if (selectionObj.end === null || selectionObj.end?.close) {
                lastSelectedChild = selection.next();
            }
            else {
                //Must be at an opening tag, because no next closing tag was found
                lastSelectedChild = selection.last();
            }*/

            let fullHtml = "";
            selection.each((index: number, element) => {
                const currentHtml = $(element).prop('outerHTML');
                fullHtml += currentHtml + "\n";
            });
            if (fullHtml) {
                rangesHtml.push(fullHtml);
            }

            lastSelectedChild = $(endChild);
        }
    }

    return rangesHtml;
}


export function extractImgs(html: string): any {
    const $: cheerio.Root = loadHtml(html);
    const imgs: cheerio.Cheerio = $('img');

    const extractedImgs: any[] = [];

    imgs.each((index: number, element: cheerio.Element) => {
        const imgSrc = $(element).attr('src');
        const alt = $(element).attr('alt');
        extractedImgs.push(
            {
                src: imgSrc,
                alt: alt,
            }
        );
        $(element).remove();
    });

    const imgsExtractedResult = {
        extractImagesAttrs: extractedImgs,
        restHtml: $.html()
    };

    return imgsExtractedResult;

    //return extractImgs;
}

export function orSelector(selectors?: string[], postfix?: string): string {

    if (!selectors) {
        return '';
    }

    if (!postfix) {
        postfix = '';
    }

    const postFixedSelectors = selectors.map((selector) => selector + postfix);
    return postFixedSelectors.join(',');
}

export type ComponentParser = (html: string, data: any) => string;
export type ComponentParsers = { [ tag: string ]: ComponentParser; };

/*const defaultComponentParsersDict: ComponentParsers = {
    'parse-expand': parseExpandable
};*/

//componentsToParse: string[] = defaultComponentTags,

export function performHtmlModification(html: string, modificationFn: ($: cheerio.Root) => void): string {
    if (!html) {
        return '';
    }
    const $: cheerio.Root = loadHtml(html);

    modificationFn($);

    return unparseHtml($);

    /*const htmlElem = $('html');
    if (htmlElem.length > 0) {
        return $(htmlElem).prop('outerHtml');
    }*/
}
export async function performHtmlModificationAsync(html: string, modificationFn: ($: cheerio.Root) => void): Promise<string> {
    if (!html) {
        return '';
    }
    const $: cheerio.Root = loadHtml(html);

    await modificationFn($);

    return unparseHtml($);
}

export function replaceSelected(html: string, selector: string, replacerFunction: (tag: string, element: cheerio.Element, $: cheerio.Root) => string): string {

    const modificationFn = ($: cheerio.Root) => {
        const parseAbleComponents = $(selector);

        parseAbleComponents.each((index: number, element: cheerio.Element) => {

            const toParseElemTag = $(element).prop('tagName').toLowerCase();

            const newOuterHtml = replacerFunction(toParseElemTag, element, $);

            $(element).replaceWith(newOuterHtml);
        });
    };

    return performHtmlModification(html, modificationFn);
}
export async function replaceSelectedAsync(html: string, selector: string, replacerFunction: (tag: string, element: cheerio.Element, $: cheerio.Root) => Promise<string>): Promise<string> {

    const modificationFn = async ($: cheerio.Root) => {
        const parseAbleComponents = $(selector);

        const replaceArgs: any[] = [];
        parseAbleComponents.each((index: number, element: cheerio.Element) => {
            const toParseElemTag = $(element).prop('tagName').toLowerCase();
            replaceArgs.push(
                {
                    toParseElemTag,
                    element,
                    $
                }
            );
        });

        const renderReplacePromises: Promise<string>[] = replaceArgs.map(({ toParseElemTag, element, $ }) => replacerFunction(toParseElemTag, element, $));

        const replaceValues: string[] = await Promise.all(renderReplacePromises);

        for (let i = 0; i < replaceValues.length; i++) {
            const { toParseElemTag, element, $ } = replaceArgs[ i ];
            const replaceHtml: string = replaceValues[ i ];
            $(element).replaceWith(replaceHtml);
        }

        /*parseAbleComponents.each(async (index: number, element: cheerio.Element) => {

            const toParseElemTag = $(element).prop('tagName').toLowerCase();

            const newOuterHtml = await replacerFunction(toParseElemTag, element, $);

            $(element).replaceWith(newOuterHtml);
        });*/
    };

    return performHtmlModificationAsync(html, modificationFn);
}



export function parseComponents(html: string, componentParsersDict: ComponentParsers, frontMatterData: any = {}): string {
    if (!componentParsersDict || isEmpty(componentParsersDict)) {
        return html;
    }

    const parseAbleComponentTags: string[] = Object.keys(componentParsersDict);
    const anyParsableCompSelector = orSelector(parseAbleComponentTags);

    const replacerFunction = (tag: string, element: cheerio.Element, $: cheerio.Root) => {
        const componentHtml = $(element).html() || '';
        const componentData = $(element).data() || {};
        const inflatedHtml = componentParsersDict[ tag ](componentHtml, componentData);
        return inflatedHtml;
    };

    return replaceSelected(html, anyParsableCompSelector, replacerFunction);
}

export function removeComponentWrappers(html: string, componentParsersDict: ComponentParsers): string {
    if (!componentParsersDict || isEmpty(componentParsersDict)) {
        return html;
    }
    const parseAbleComponentTags: string[] = Object.keys(componentParsersDict);
    const anyParsableCompSelector = orSelector(parseAbleComponentTags);

    const replacerFunction = (tag: string, element: cheerio.Element, $: cheerio.Root) => {
        const componentHtml = $(element).html() || '';
        return componentHtml;
    };

    return replaceSelected(html, anyParsableCompSelector, replacerFunction);
}

export function translateTextNodes(html: string, translatorFn: (text: string) => string): string {
    if (!html) {
        return '';
    }
    const replacerFunction = (tag: string, element: cheerio.Element, $: cheerio.Root) => {

        /*$(element).contents().filter((index: number, element: cheerio.Element) => {
            return Boolean($(element)[0].nodeType === 3)
        })*/
        const isTextNode: boolean = Boolean($(element).get(0).nodeType === 3);

        if (isTextNode) {
            //const innerHtml = $(element).html() || '';
            const previousText = $(element).text();
            const translatedText = translatorFn(previousText);
            $(element).text(translatedText);
        }

        let nodeHtml = outerHtmlOfQueryElem(element, $);
        return nodeHtml;
    };

    const leafNodesSelector: string = '*:not(:has(*))';
    return replaceSelected(html, leafNodesSelector, replacerFunction);
}

/*const defaultComponentTags: string[] = [
    'parse-expand' //attrs: data-category-selector="h2" data-section-selector="h3"
];*/

export function htmlOfQueryElem(elem: cheerio.Cheerio | cheerio.Element, $: cheerio.Root, outer: boolean = false, joinToken: string = '\n'): string {

    let targetProp = 'innerHTML';
    if (outer) {
        targetProp = 'outerHTML';
    }

    if ((elem as cheerio.Cheerio).length > 0) {
        const cheerioSel = (elem as cheerio.Cheerio);
        const subHtmls = cheerioSel
            .map((index: number, element: cheerio.Element) => {
                return htmlOfQueryElem(element, $, outer, joinToken);
            })
            .get();

        return subHtmls.join(joinToken);
    }

    return $(elem).prop(targetProp);
}
export function outerHtmlOfQueryElem(elem: cheerio.Cheerio | cheerio.Element, $: cheerio.Root, joinToken: string = '\n'): string {
    return htmlOfQueryElem(elem, $, true, joinToken);
}

export function htmlOfSelector(contentHtml: string, selector: string, outer: boolean = false): string {
    const $: cheerio.Root = loadHtml(contentHtml);
    return htmlOfQueryElem($(selector), $, outer);
}

export function outerHtmlOfSelector(contentHtml: string, selector: string): string {
    return htmlOfSelector(contentHtml, selector, true);
}

/*export function htmlFromQueryArray(array: cheerio.Cheerio, outer: string, joinToken: string = '\n'): string {

}*/

export function isExternalUrl(url: string): boolean {
    if (!url) {
        return false;
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.')) {
        return true;
    }
    return false;
}

export function isLocalUrl(url: string): boolean {
    return !isExternalUrl(url);
}

export function isValidLinkUrl(url: string, absRootDir: string, relRootDir?: string): boolean {
    if (!url || url.length <= 0) {
        return false;
    }

    if (isExternalUrl(url)) {
        return true;
    }

    let localUrlPath: string | null = null;

    if (path.isAbsolute(url) || !relRootDir) {
        localUrlPath = path.join(absRootDir, url);
    }
    else {
        localUrlPath = path.join(relRootDir, url);
    }

    if (fs.existsSync(localUrlPath)) {
        return true;
    }

    return false;
}

export function isExcluded($: cheerio.Root, element: cheerio.Element, excludeBranchSelectors: string | string[]): boolean {
    if (!excludeBranchSelectors || excludeBranchSelectors === '' || excludeBranchSelectors.length === 0) {
        return false;
    }

    let combinedExcludedSelectors: string = excludeBranchSelectors as string;
    if (Array.isArray(excludeBranchSelectors)) {
        combinedExcludedSelectors = orSelector(excludeBranchSelectors);
    }

    if ($(element).parents().is(combinedExcludedSelectors)) {
        return true;
    }

    /*for (const selector of excludeBranchSelectors) {
        if ($(element).parents().is(selector)) {
            return true;
        }
    }*/
    return false;

}

export function removeElementAndEmptyParents($: cheerio.Root, element: cheerio.Cheerio, removeEmptyParents: boolean = true): void {

    if (!element || (element.hasOwnProperty('length') && element.length <= 0)) {
        return;
    }

    const elementParent = $(element).parent();

    $(element).remove();

    if (!removeEmptyParents) {
        return;
    }

    if (!elementParent) {
        return;
    }

    let parentText = elementParent.html();
    if (!parentText) {
        parentText = '';
    }
    const cleanParentText = parentText.replace(/\s+/g, '');

    if (cleanParentText.length <= 0) {
        return removeElementAndEmptyParents($, elementParent);
    }
    return;
}

/*export function cleanInvalidDocumentElemAttrUrl($: cheerio.Root, attrKey: string, absRootDir: string, relRootDir?: string, excludeBranchSelectors: string[] = []): void {
    const excludeSelectors: string = orSelector(excludeBranchSelectors);

    $(`*[${attrKey}]`).each((index: number, element: cheerio.Element) => {

        const url: string | undefined = $(element).attr(attrKey);


        //let elementParent = $(element).parent();
        if (!isExcluded($, element, excludeBranchSelectors) && url && !isValidLinkUrl(url, absRootDir, relRootDir)) {
            //$(element).remove();

            removeElementAndEmptyParents($, $(element));
        }
    });
}

export function removeNonExistantLocalUrls(html: string, absRootDir: string, relRootDir: string, excludeBranchSelectors: string[] = []): string {
    const $: cheerio.Root = loadHtml(html);

    cleanInvalidDocumentElemAttrUrl($, 'src', absRootDir, relRootDir, excludeBranchSelectors);
    cleanInvalidDocumentElemAttrUrl($, 'href', absRootDir, relRootDir, excludeBranchSelectors);

    const docHtml: string = $.html();
    return docHtml;
}*/

const urlTargetAttrs: string[] = [
    'src',
    'href'
];


export interface AttrTransformOptions {
    excludedAncestors?: string[];
    removeOnEmptyAttr?: boolean;
    removeEmptyParents?: boolean;
    processElem?: ($: cheerio.Root, element: cheerio.Element) => void;
}

export function performAttrTransform($: cheerio.Root, targetAttrKey: string, processAttr: (value: string, options: any) => string | null, options?: AttrTransformOptions): void {
    if (!options) {
        options = {};
    }

    let excludeSelectors: string = orSelector(options?.excludedAncestors);

    $(`*[${targetAttrKey}]`).each((index: number, element: cheerio.Element) => {

        const attrValue: string | undefined = $(element).attr(targetAttrKey);

        if (!isExcluded($, element, excludeSelectors) && attrValue) {

            if (options?.processElem) {
                options?.processElem($, element);
            }
            else if (processAttr) {
                const attrProcessResult: string | null = processAttr(attrValue, options);

                if (attrProcessResult !== null) {
                    $(element).attr(targetAttrKey, attrProcessResult);
                }
                else {
                    if (options?.removeOnEmptyAttr) {
                        if (options?.removeEmptyParents === undefined) {
                            options.removeEmptyParents = true;
                        }
                        removeElementAndEmptyParents($, $(element), options?.removeEmptyParents);
                    }
                }
            }
        }
    });
}

export interface UrlTransformOptions extends AttrTransformOptions {
    rootDir: string;
    docDir: string;
}

export function performHtmlUrlTransform(html: string, processUrl: (url: string, options: any) => string | null, options?: UrlTransformOptions): string {

    const modificationFn = ($: cheerio.Root) => {
        for (const attr of urlTargetAttrs) {
            performAttrTransform($, attr, processUrl, options);
        }
    };

    return performHtmlModification(html, modificationFn);
}

export function cleanInvalidLinkElems(html: string, options: UrlTransformOptions): string {
    options.removeOnEmptyAttr = true;
    options.removeEmptyParents = true;

    function processUrl(url: string, options?: any): string | null {
        if (url && options && !isValidLinkUrl(url, options.rootDir, options.docDir)) {
            return null;
        }
        return url;
    }

    return performHtmlUrlTransform(html, processUrl, options);
}

export function localizeUrl(url: string, lang: string): string {
    if (path.isAbsolute(url)) {
        return "/" + path.join(lang, url);
    }
    return url;
}

export interface ResolvePathOptions {
    rootDir: string;
    docDir: string;
}

export function findValidLocalizedUrl(url: string, langs: string[], options: ResolvePathOptions): string | null {
    if (!options) {
        return url;
    }

    if (isValidLinkUrl(url, options.rootDir, options.docDir)) {
        return url;
    }

    for (const lang of langs) {
        const localizedUrl: string = localizeUrl(url, lang);
        if (isValidLinkUrl(localizedUrl, options.rootDir, options.docDir)) {
            return localizedUrl;
        }
    }

    return null;
}

export function localizeInvalidLinkAttrs(html: string, langOptions: string[], options: UrlTransformOptions): string {
    options.removeOnEmptyAttr = false;
    options.removeEmptyParents = false;

    function processUrl(url: string, options?: any): string | null {

        const firstLocalizedValidUrl: string | null = findValidLocalizedUrl(url, langOptions, options);
        if (!firstLocalizedValidUrl) {
            return url;
        }
        return firstLocalizedValidUrl;

        /*if (url && options && !isValidLinkUrl(url, options.rootDir, options.docDir)) {

            if (path.isAbsolute(url)) {
                return "/" + path.join(currentLanguage, url);
            }
        }
        return url;*/
    }

    return performHtmlUrlTransform(html, processUrl, options);
}


export interface ContentExtraction {
    selected?: string | null,
    content: string,
}

export function extractElement(html: string, elemSelector: string): ContentExtraction {

    let selectedElementHtml: string | null = null;

    const modificationFn = ($: cheerio.Root) => {
        const selectedElems = $(elemSelector);
        selectedElementHtml = outerHtmlOfQueryElem(selectedElems, $);
        $(selectedElems).remove();
    };

    const contentExtractedHtml: string = performHtmlModification(html, modificationFn);

    return {
        selected: selectedElementHtml,
        content: contentExtractedHtml
    };
}

export function extractAttrs(elemHtml: string, elemSelector?: string): AttrDict {

    if (!elemSelector) {
        elemSelector = ':root';
    }

    const $: cheerio.Root = loadHtml(elemHtml);

    return $(elemSelector).attr() as AttrDict;
}


export function cheerioReplaceElem(html: string, id: string, replaceHtml: string): string {

    if (!id) {
        return html;
    }
    const $: cheerio.Root = loadHtml(html);
    $(`#${id}`).replaceWith(replaceHtml);
    return unparseHtml($);
}

export function cheerioReplaceIdsWithUpdatesHtml(html: string, idToUpdatedHtmls: Record<string, string>): string {
    if (!idToUpdatedHtmls) {
        return html;
    }
    /*if (!ids || !replaceHtmls || ids.length !== replaceHtmls.length) {
        console.error(`Can not replace empty ids, replaceHtmls or arrays of mismatching lengths: ${ids} -- ${replaceHtmls}`);
        return html;
    }*/
    const $: cheerio.Root = loadHtml(html);

    const ids: string[] = Object.keys(idToUpdatedHtmls);
    if (ids.length <= 0) {
        return html;
    }

    const idSelectors: string[] = ids.map((id: string) => '#' + id);
    const allIdsSelector: string = orSelector(idSelectors);

    $(allIdsSelector).each((index: number, element: cheerio.Element) => {

        const currentId: string = $(element).prop('id');

        const selectedReplaceHtml: string = idToUpdatedHtmls[ currentId ];
        if (selectedReplaceHtml !== undefined && selectedReplaceHtml !== null) {
            $(element).replaceWith(selectedReplaceHtml);
        }
    });

    return unparseHtml($);
}


export type CheerioNodeFn<ReturnType> = ($: cheerio.Root, element: cheerio.Cheerio) => FalsyAble<ReturnType>;
export type TaggedCheerioNodeFn<ReturnType> = ($: cheerio.Root, currentTag: string, element: cheerio.Cheerio) => FalsyAble<ReturnType>;
export function cheerioDfsWalkFirstTop<ReturnType>($: cheerio.Root, currentCursor: cheerio.Cheerio, handleFork: CheerioNodeFn<ReturnType>, handleLeaf: CheerioNodeFn<ReturnType>): ReturnType[] {

    const currentElement = $(currentCursor);
    let currentChildren: cheerio.Cheerio = currentElement.children();
    if (currentChildren.length <= 0) {
        const leafProcessingResult: FalsyAble<ReturnType> = handleLeaf($, $(currentCursor));
        if (!leafProcessingResult) {
            return [];
        }

        return [ leafProcessingResult ];
    }
    const forkProcessResult: FalsyAble<ReturnType> = handleFork($, currentCursor);

    //NON standard control flow! --> early exit branch if fork was successfully processed
    if (forkProcessResult) {
        return [ forkProcessResult ];
    }

    currentChildren = $(currentCursor).children();

    const flatDescendantResults: ReturnType[] = [];

    if (currentChildren.length > 0) {
        for (const child of currentChildren) {
            const processingResults: ReturnType[] = cheerioDfsWalkFirstTop($, $(child), handleFork, handleLeaf);

            flatDescendantResults.push(...processingResults);
        }
    }

    return flatDescendantResults;
}