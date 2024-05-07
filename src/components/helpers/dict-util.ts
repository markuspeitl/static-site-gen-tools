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