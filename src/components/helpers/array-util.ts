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

//Call function on each item of the targetArg array, passing all options following these, for every call (common args)
export async function multiplyFnIfArray(fn, targetArg: any | any[], ...options: any[]) {

    if (!fn) {
        return undefined;
    }

    if (Array.isArray(targetArg)) {
        return targetArg.map((arg: any) => fn(arg, ...options));
        //return targetArg.map(async (arg: any) => await fn(arg, ...options));
    }

    return fn(targetArg, ...options);
    //fn.apply(null, targetArg)
}

export async function multiplyFnIfArrayAsync(fn, targetArg: any | any[], ...options: any[]) {

    if (!fn) {
        return undefined;
    }

    if (Array.isArray(targetArg)) {

        const promises = targetArg.map((arg: any) => fn(arg, ...options));

        return Promise.allSettled(promises);
        //return targetArg.map(async (arg: any) => await fn(arg, ...options));
    }

    return fn(targetArg, ...options);
    //fn.apply(null, targetArg)
}

export function getArrayFrom<ItemType>(item?: ItemType | ItemType[] | null): ItemType[] {
    if (!item) {
        return [];
    }

    if (!Array.isArray(item)) {
        return [ item ];
    }

    return item;
}

export function addItemMakeArray(dict, key, item) {
    if (!dict[ key ]) {
        dict[ key ] = [];
    }

    if (!Array.isArray(dict[ key ])) {
        dict[ key ] = [];
    }

    dict[ key ].push(item);
}


export function removeArrayItem<ItemType>(array: ItemType[] | undefined, itemToRemove: ItemType): ItemType[] | undefined {

    if (!array) {
        return undefined;
    }

    if (!itemToRemove) {
        return array || [];
    }

    if (!array) {
        return [];
    }

    const index = array.indexOf(itemToRemove);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}