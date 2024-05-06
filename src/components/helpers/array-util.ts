import { ArrNullOrSing, ArrOrSing, NullItemNullArray } from "./generic-types";

export function isEmpty(obj) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }
    return true;
}

export function filterFalsy(array: NullItemNullArray<any>): any[] {
    if (!array) {
        return [];
    }
    return array.filter((value) => Boolean(value));
}

export function filterFalsyEmpty(array: NullItemNullArray<any>): any[] {
    if (!array) {
        return [];
    }
    return array.filter((value) => Boolean(value) && !isEmpty(value)) as Object[];
}

export function arrayify<ItemType>(value: ArrOrSing<ItemType>): ItemType[] {
    if (!value) {
        return [];
    }
    if (!Array.isArray(value)) {
        return [ value ];
    }
    return value;
}

export function arrayifyFilter<ItemType>(value: ArrOrSing<ItemType>): ItemType[] {
    const valueAsArray = arrayify(value);
    return filterFalsyEmpty(valueAsArray);
}

export function concatAsArray<ItemType>(value1: ArrOrSing<ItemType>, value2: ArrOrSing<ItemType>): ItemType[] {
    const array1 = arrayify(value1);
    const array2 = arrayify(value2);

    return array1.concat(array2);
}

export function mergeAsArrays(value1: ArrNullOrSing<any>, value2: ArrNullOrSing<any>): any[] {
    return arrayifyFilter(value1).concat(arrayifyFilter(value2));
}