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