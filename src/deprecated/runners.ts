
//function parsedXmlToDict(parsedXml: any): 

//function xml2JsToJsDict(parsedXml: any): any {}

export function getHtmlTagRegex(tagName: string): string {
    //const validRegexPartial = `<\\s*${tagName}\\s*>|<\\s*${tagName}\\s*/\\s*>`;
    const validRegexPartial = `<\\s*/\\s*${tagName}\\s*>`;
    return validRegexPartial;
}

export function isComponentTagInHtml(html: string, tag: string): boolean {
    const regexPattern: string = getHtmlTagRegex(tag);
    const regExp: RegExp = new RegExp(regexPattern, 'gi');
    const isMatch: boolean = regExp.test(html);
    return isMatch;
}

export async function compileSubComponents(html: string, componentsToCompile: Record<string, IInternalComponent>, dataCtx: any, config: SsgConfig): Promise<string> {

    const toCompileComponentIds: string[] = Object.keys(componentsToCompile);
    const anyComponentSelector = orSelector(toCompileComponentIds);

    const replacerFunction = async (tag: string, element: cheerio.Element, $: cheerio.Root) => {
        const componentHtml = $(element).html() || '';
        const componentData = $(element).data() || {};

        const selectedComponentInstance: IInternalComponent = componentsToCompile[ tag ];

        const attrDict: { [ attr: string ]: string; } = $(element).attr();

        const subDocToCompile: DataParsedDocument = {
            content: unescape(componentHtml),
            data: Object.assign({}, componentData, dataCtx, attrDict),
        };

        const dataParseDoc: FalsyAble<DataParsedDocument> = await selectedComponentInstance.data(subDocToCompile, config);
        const subCompiledDoc: FalsyAble<DataParsedDocument> = normalizeToDataParsedDoc(await selectedComponentInstance.render(dataParseDoc, config));

        //const subCompiledDoc: FalsyAble<DataParsedDocument> = await config.masterCompileRunner?.compileWith('ts', subDocToCompile, config);

        /*const subComponentDoc: FalsyAble<DataParsedDocument> = await compileComponent(
            {
                content: componentHtml,
                data: Object.assign({}, componentData, dataCtx)
            },
            selectedComponentInstance,
            config
        );*/

        if (!subCompiledDoc) {
            return componentHtml;
        }
        return subCompiledDoc?.content;
    };

    return replaceSelectedAsync(html, anyComponentSelector, replacerFunction);
}

export function findUsedComponents(html: string, importCache: Record<string, IInternalComponent>): Record<string, IInternalComponent> {

    //Assume html is valid and not malformed (every opening/closing tag represents a valid full html item)

    const validSubComponentIds: string[] = Object.keys(importCache);
    const foundComponentIds: string[] = validSubComponentIds.filter((id: string) => isComponentTagInHtml(html, id));
    return selectSubset(importCache, foundComponentIds);

    //return foundComponentIds;

    /*const regexPatterns: string[] = validSubComponentIds.map((componentId: string) => getHtmlTagRegex(componentId));
    const regExps: RegExp = regexPatterns.map((pattern: string) => new RegExp(pattern, 'gi'));*/

    //const combinedRegexPattern: string = regexPatterns.join('|');
    //const anyComponentMatchExp
}

export async function findCompileSubComponents(html: string, importedComponents: Record<string, IInternalComponent>, dataCtx: any, config: SsgConfig): Promise<string> {

    const usedComponents: Record<string, IInternalComponent> = findUsedComponents(html, importedComponents);
    return compileSubComponents(html, usedComponents, dataCtx, config);
}

export async function compileResourceSubComponents(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<DataParsedDocument> {

    if (!resource) {
        return {
            content: '',
            data: {}
        };
    }

    const htmlContent: string = resource.content;
    let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
    const compiledContent: string = await findCompileSubComponents(htmlContent, selectedDependencies, resource.data, config);
    return normalizeToDataParsedDoc(compiledContent, resource);
}