import dedent from 'ts-dedent';

export function js(strings, ...values) {
    return dedent(strings, ...values);
}
export function ts(strings, ...values) {
    //return String.raw({ raw: strings }, ...values);
    return dedent(strings, ...values);
}
export function css(strings, ...values) {
    return dedent(strings, ...values);
}
export function html(strings, ...values) {
    return dedent(strings, ...values);
}

export function curvyTemplate(templateString: string, variablesDict: Record<string, any>): string {
    //let resultTemplateString: string = dedent(templateString);
    let resultTemplateString: string = templateString;
    const curvyReplacedString: string = detectEnclosedAndReplace(resultTemplateString, variablesDict, curvyVariable);
    const curvyPercentReplacedString: string = detectEnclosedAndReplace(curvyReplacedString, variablesDict, curvyPercentVariableRegex);
    return curvyPercentReplacedString;
}

const validVariableName = escapeRegExp("[a-zA-Z]+[a-zA-Z0-9_$]*");
const anyText = "\w+";
const curvyVariable: RegExp = getSelectWordsBetweenRegex('{{', '}}', 'gi');
const curvyPercentVariableRegex: RegExp = getSelectWordsBetweenRegex('{%', '%}', 'gi');
export function detectEnclosedAndReplace(targetString: string, variablesDict: Record<string, any>, enclosedVarRegex: RegExp): string {
    const varMatches: IterableIterator<RegExpMatchArray> = targetString.matchAll(enclosedVarRegex);
    for (const match of varMatches) {
        const fullMatchWithTokens = match[ 0 ];
        const variableNameGroupMatch = match[ 1 ];

        if (!variablesDict[ variableNameGroupMatch ]) {
            variablesDict[ variableNameGroupMatch ] = '';
        }
        targetString = targetString.replace(fullMatchWithTokens, variablesDict[ variableNameGroupMatch ]);
    }
    return targetString;
}

//const curvyRegex = /\{\{\s*(a-zA-Z)+\s*}\}/;


export function getSelectWordsBetweenRegex(startToken: string, endToken: string, flags?: string): RegExp {
    const startEscaped = escapeRegExp(startToken);
    const endEscaped = escapeRegExp(endToken);
    const wordMatch = String.raw`\s*(\w*)\s*`;
    return new RegExp(`${startEscaped}${wordMatch}${endEscaped}`, flags);
}


function findFirstContentfulLine(array: string[]): number {
    for (let i = 0; i < array.length; i++) {
        const elem = array[ i ];
        if (elem.trim().length > 0) {
            return i;
        }
    }
    return -1;
}


function normalizeTabs(string: string | null | undefined, spacesPerTab: number = 4): string {
    if (!string) {
        return '';
    }

    const whiteSpacesString = string?.replaceAll('\t', '    ');
    return whiteSpacesString;
}

const preWhiteSpaceRegex = /^\s+/;
function findIdentation(string: string, spacePerTab: number = 4): string {
    if (!string) {
        return '';
    }

    const whiteSpace = string.match(preWhiteSpaceRegex)?.at(0);
    const whiteSpacesString = normalizeTabs(whiteSpace);
    return whiteSpacesString;
}

function removeIdentation(string: string,) {

}

//https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/*export function html(strings, ...values) {

    return dedent(strings, ...values);

    const contentLineStart: number = findFirstContentfulLine(strings);
    if (contentLineStart < 0) {
        return;
    }
 
    const startIdentation: string = findIdentation(strings[ contentLineStart ]);
 
    if (startIdentation) {
        const startIdentationRegex: RegExp = RegExp('^' + escapeRegExp(startIdentation));
 
        for (let i = contentLineStart; i < strings.length; i++) {
            strings[ i ] = strings[ i ].replace(startIdentationRegex, '');
        }
    }
 
    return String.raw({ raw: strings }, ...values);
}*/