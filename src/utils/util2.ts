;


//async function processPipeLineStages()

export function mergePropsToArray(dict: Object, keys: string[]): any[] {
    let collectedArray: any[] = [];

    for (const key of keys) {

        let selectedProp: any | null = null;
        if (!key) {
            selectedProp = dict;
        }
        else {
            selectedProp = dict[ key ];
        }

        if (selectedProp) {
            if (Array.isArray(selectedProp)) {
                collectedArray = collectedArray.concat(selectedProp);
            }
            else {
                collectedArray.push(selectedProp);
            }
        }
    }

    return collectedArray;
}

export function findArrayChildValueType(array: any[], matchType: string): any {
    if (!Array.isArray(array)) {
        return array;
    }

    for (const item of array) {
        if (item !== undefined) {
            return item;
        }
        if (matchType === 'undefined') {
            return undefined;
        }
    }

    return null;
}

//Find first valid item (self, or child of array) and check if it is of the target match type
export function isTypeOrItemType(valueOrArray: any | any[], matchType: string): boolean {
    let foundDefinedItemValue = findArrayChildValueType(valueOrArray, matchType);

    if (foundDefinedItemValue && typeof foundDefinedItemValue === matchType) {
        return true;
    }

    return false;
}