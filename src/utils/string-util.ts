export function splitStringPreserve(text: string, token: string, before: boolean = false): string[] {

    if (!text) {
        return [];
    }

    const splitTextParts: string[] = text.split(token);

    for (let i = 0; i < splitTextParts.length - 1; i++) {
        const currentTextPart = splitTextParts[ i ];
        if (before) {
            splitTextParts[ i ] = token + currentTextPart;
        }
        else {
            splitTextParts[ i ] = currentTextPart + token;
        }
    }

    return splitTextParts;
}

function normalizeTabsToSpaces(string: string | null | undefined, spacesPerTab: number = 4): string {
    if (!string) {
        return '';
    }

    let spacesString = Array.from({ length: spacesPerTab }, (x, i) => ' ').join('');

    const whiteSpacesString = string?.replaceAll('\t', spacesString);
    return whiteSpacesString;
}

export function findFirstFilledLine(lines: string[]): string | null {
    for (const line of lines) {
        if (line && line.trim().length > 0) {
            return line;
        }
    }
    return null;
}

export function replaceAtStart(strings: string[], searchString: string, replaceString: string): void {
    for (let i = 0; i < strings.length; i++) {
        const string = strings[ i ];

        if (string.startsWith(searchString)) {
            strings[ i ] = replaceString + string.substring(searchString.length);
        }
    }
}

export function removeBaseBlockIndent(blockText: string): string {
    if (!blockText) {
        return '';
    }

    blockText = normalizeTabsToSpaces(blockText);

    const lines = blockText.split('\n');

    if (lines.length <= 0) {
        return '';
    }
    let selectedLine: string | null = findFirstFilledLine(lines);
    if (!selectedLine) {
        return blockText;
    }

    const whiteSpacePrefixMatch: RegExpMatchArray | null = selectedLine.match(/^\s+/);
    if (!whiteSpacePrefixMatch) {
        return blockText;
    }

    const whiteSpacePrefixText: string | undefined = whiteSpacePrefixMatch.at(0);

    if (!whiteSpacePrefixText) {
        return blockText;
    }

    //const whiteSpaceIdentLength = whiteSpacePrefix.length;

    replaceAtStart(lines, whiteSpacePrefixText, '');

    return lines.join('\n');

}