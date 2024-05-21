import { arrayifyFilter } from "./array-util";
import { ArrNullOrSing, ArrOrSing } from "./generic-types";

export type KeyToSingleOrArrDict = Record<string, any | any[]> | null | undefined;
export function mergeDicts(dict1: KeyToSingleOrArrDict, dict2: KeyToSingleOrArrDict, mergeProps: (value1: any, value2: any, key: string) => any, newDict: boolean = true): KeyToSingleOrArrDict {
    if (!dict1) {
        return dict2;
    }
    if (!dict2) {
        return dict1;
    }

    let mergedDict = dict1;
    if (newDict) {
        mergedDict = Object.assign({}, dict1);
    }


    for (const key in dict2) {
        let toMergeProp = dict2[ key ];
        const targetProp = dict1[ key ];

        if (toMergeProp) {
            if (!targetProp) {
                mergedDict[ key ] = toMergeProp;
            }
            else {
                mergedDict[ key ] = mergeProps(dict1[ key ], toMergeProp, key);
            }
        }
    }

    return mergedDict;
}

export function mergeAsArrays(value1: ArrNullOrSing<any>, value2: ArrNullOrSing<any>): any[] {
    return arrayifyFilter(value1).concat(arrayifyFilter(value2));
}

export function mergeFlatCollect(dict1: Record<string, ArrOrSing<any>>, dict2: Record<string, ArrOrSing<any>>, newDict: boolean = true) {

    /*const mergeProps = (value1: any, value2: any) => {
        return arrayify(value1).concat(arrayify(value2));
    };*/

    return mergeDicts(dict1, dict2, mergeAsArrays, newDict);
}

export function pushToProp(dict: Object, propKey: string, newElem: any) {
    if (!newElem) {
        return;
    }

    if (!dict[ propKey ]) {
        dict[ propKey ] = [];
    }
    dict[ propKey ].push(newElem);
}

const keySeperationToken = '.';
export function getKeyFromDict(dict: Object, key?: string): any | undefined {
    if (!key) {
        return dict;
    }

    const keyParts = key.split(keySeperationToken);
    //const reversedParts = keyParts.reverse();

    let currentLevelDict: Object = dict;
    for (const key of keyParts) {
        currentLevelDict = currentLevelDict[ key ];
        if (currentLevelDict === undefined) {
            return undefined;
        }
    }
    return currentLevelDict;
}

export function ensureKeyAtDict(dict: Object, key: string, setValue: any): any | undefined {
    if (!key) {
        return dict;
    }

    const keyParts = key.split(keySeperationToken);

    let lastLevelDict: Object = dict;
    for (let i = 0; i < keyParts.length - 1; i++) {
        const key = keyParts[ i ];
        if (!lastLevelDict[ key ]) {
            lastLevelDict[ key ] = {};
        }
        lastLevelDict = lastLevelDict[ key ];
    }

    const lastKeyPart = keyParts.at(-1);
    if (lastLevelDict && lastKeyPart) {
        lastLevelDict[ lastKeyPart ] = setValue;
    }

    return dict;
}

export function mapDict(dict: Object, handleItemFn: (key: any, value: any) => { key: any, value: any; }): any | undefined {
    const keys = Object.keys(dict);
    for (let key of keys) {
        const value: any = dict[ key ];
        const remappedKeyValPair = handleItemFn(key, value);
        const newValue = remappedKeyValPair.value;
        const newKey = remappedKeyValPair.key;
        /*if (newValue === undefined) {
            delete dict[ key ];
        }*/
        if (key !== newKey) {
            dict[ newKey ] = newValue;
            delete dict[ key ];
            key = newKey;
        }

        if (newValue) {
            dict[ key ] = newValue;
        }
    }
}

export function dictToArray<ItemType>(dict: Record<any, ItemType>): ItemType[] {
    const keys = Object.keys(dict);
    const items: ItemType[] = [];
    for (const key of keys) {
        items.push(dict[ key ]);
    }
    return items;
}

export function addToDictByProp(targetDict: Object, sourceArray: any[], srcTargetKey: string): void {
    for (const item of sourceArray) {

        const key: string = item[ srcTargetKey ];
        if (key) {
            targetDict[ key ] = item;
        }
    }
}

export function addToDictById(targetDict: Object, sourceArray: any[]): void {
    return addToDictByProp(targetDict, sourceArray, 'id');
}


export function packIntoDataOpt(data: any, packIfMissingObj: any): Record<string, any> {
    if (!data) {
        return {};
    }

    for (const key in packIfMissingObj) {
        const currentElement = packIfMissingObj[ key ];
        if (!data[ key ]) {
            data[ key ] = packIfMissingObj[ key ];
        }
    }

    return data;
}
export function unpackDataProps(data: any, dataToResultKeys: any): any {
    const result = {};
    for (const key in dataToResultKeys) {
        const targetKey = dataToResultKeys[ key ];
        const srcValue = data[ key ];
        result[ targetKey ] = srcValue;
    }
    return result;
}

export function initGetSubDict<PropType>(obj: any, key: string): PropType {
    if (!obj[ key ]) {
        obj[ key ] = {};
    }
    return obj[ key ];
}

export function selectSubset(obj: Record<string, any>, selectedKeys: string[]): Record<string, any> {

    const objKeys: string[] = Object.keys(obj);
    return objKeys.reduce(
        (targetObj, key) => {
            if (selectedKeys.includes(key)) {
                targetObj[ key ] = obj[ key ];
            }
            return targetObj;
        },
        {}
    );
}