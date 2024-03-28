export function cleanUpExt(fileExtension: string): string {

    if (!fileExtension) {
        return '';
    }

    fileExtension = fileExtension.trim();
    if (!fileExtension.startsWith('.')) {
        return fileExtension;
    }

    if (!fileExtension || fileExtension.length <= 0) {
        return '';
    }

    return fileExtension.slice(1);
}

export function setDefaults(dict: any, defaultDict: any, setIfNull: boolean = false): any {

    if (!dict) {
        return defaultDict;
    }
    if (!defaultDict) {
        return dict;
    }

    for (const key in defaultDict) {

        if (dict[ key ] === undefined || (setIfNull && dict[ key ] === null)) {
            dict[ key ] = defaultDict[ key ];
        }
    }
    return dict;
}


