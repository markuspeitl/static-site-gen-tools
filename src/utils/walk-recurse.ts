export function isPrimitive(value: any): boolean {
    if (typeof value === 'undefined' || value === null) {
        return true;
    }

    if (Array.isArray(value)) {
        return false;
    }
    if (typeof value === 'object') {
        return false;
    }
    return true;
}

export function recurseObject(
    objectToRecurse: Object,
    processPrimitive: (value: any, keyPathStack: (string | number)[], isArrayChild: boolean) => void,
    processFork: (value: any, keyPathStack: (string | number)[], isArray: boolean) => void,
    keyPathStack: (string | number)[] = [],
    isArrayChild: boolean = false
): void {

    if (isPrimitive(objectToRecurse)) {
        processPrimitive(objectToRecurse, keyPathStack, isArrayChild);
        return;
    }

    for (const key in objectToRecurse) {

        const subKeyPathStack: (string | number)[] = new Array(...keyPathStack);
        subKeyPathStack.push(key);

        const keyValue = objectToRecurse[ key ];

        if (Array.isArray(keyValue)) {

            processFork(keyValue, subKeyPathStack, true);

            let cnt: number = 0;
            for (const arrayItem of keyValue) {

                const arraySubKeyPathStack: (string | number)[] = new Array(...subKeyPathStack);
                arraySubKeyPathStack.push(cnt);
                recurseObject(arrayItem, processPrimitive, processFork, arraySubKeyPathStack, true);

                cnt++;
            }
            return;
        }

        processFork(keyValue, subKeyPathStack, false);
        recurseObject(keyValue, processPrimitive, processFork, subKeyPathStack, false);
        /*if (typeof keyValue === 'object') {
            recurseObject(keyValue, processPrimitive);
        }*/
    }
}

export function resolvePrimitiveLeaves(dict: any, resolveFn: (primitive: any) => any): any {
    if (Array.isArray(dict)) {

        for (let i = 0; i < dict.length; i++) {
            const currentValue = dict[ i ];

            const resolvedVal: any = resolvePrimitiveLeaves(currentValue, resolveFn);
            if (resolvedVal !== undefined) {
                dict[ i ] = resolvedVal;
            }
        }
    }
    if (typeof dict === 'object') {
        for (const key in dict) {
            const currentValue = dict[ key ];
            const resolvedVal: any = resolvePrimitiveLeaves(currentValue, resolveFn);
            if (resolvedVal !== undefined) {
                dict[ key ] = resolvedVal;
            }
        }
    }

    if (isPrimitive(dict)) {
        const resolvedVal: any = resolveFn(dict);
        if (resolvedVal !== undefined) {
            return resolvedVal;
        }
    }

    return dict;
}
