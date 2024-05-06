import { arrayifyFilter, filterFalsy, mergeAsArrays, filterFalsyEmpty } from "./array-util";
import { mergeDicts } from "./dict-util";
import { AttrDict, NullItemArray, StringArrOrSingNull, NullableString, FalseAbleVal } from "./generic-types";

//attr.options items are pasted as is into the html --> not key=value pairs
export function consumeSpecialAttrs(fromAttrs?: AttrDict): string[] {
    if (!fromAttrs) {
        return [];
    }

    const specialAttrStrings: string[] = [];
    if (fromAttrs.options) {
        const options: NullItemArray<string> = arrayifyFilter(fromAttrs.options);
        specialAttrStrings.push(options.join(' '));

        //Side effect on input dict
        delete fromAttrs.options;
    }
    return specialAttrStrings;
}

export function toHtmlAttr(key: string, value: StringArrOrSingNull, spacePrefix: boolean = false): string {
    if (!key || !value) {
        return '';
    }

    let prefix: string = '';
    if (spacePrefix) {
        prefix = ' ';
    }

    let values: NullableString[] = value as NullableString[];
    if (!Array.isArray(value)) {
        values = [ value ];
    }

    const filteredValues = filterFalsy(values);
    const valuesString = filteredValues.join(' ');

    return `${prefix}${key}="${valuesString}"`;
}

export function getAttrsFromDict(attrs?: AttrDict) {
    if (!attrs) {
        return '';
    }

    let specialAttrs: string[] = consumeSpecialAttrs(attrs);
    const attrKeys: string[] = Object.keys(attrs);
    const attrPairs: string[] = attrKeys.map((attrKey) => toHtmlAttr(attrKey, attrs[ attrKey ], false));
    const allAttrs = [ ...attrPairs, ...specialAttrs ];

    if (!allAttrs) {
        return '';
    }

    return ' ' + allAttrs.join(' ');
}

//Array keys where values are merged instead of overwritten
const multiValAttrKeys = [
    'class',
    'rel',
    //'style' -> not supported as it requires a css syntax parser to seperate values
];

export function mergeAttrDicts(...attrDicts: FalseAbleVal<AttrDict>[]): AttrDict {

    const mergeProps = (value1: any, value2: any, key: string) => {

        if (multiValAttrKeys.includes(key)) {
            return mergeAsArrays(value1, value2);
        }
        return value2;
    };

    if (attrDicts.length <= 0) {
        return {};
    }
    //attrDicts = attrDicts.filter((dict: any) => (Boolean(dict) && Object.keys(dict).length > 0));
    attrDicts = filterFalsyEmpty(attrDicts);
    if (attrDicts.length <= 0) {
        return {};
    }
    if (attrDicts.length <= 1) {
        return attrDicts[ 0 ] || {};
    }

    let mergedDict: AttrDict = attrDicts[ 0 ] as AttrDict;
    for (let i = 1; i < attrDicts.length; i++) {
        mergedDict = mergeDicts(mergedDict, attrDicts[ i ], mergeProps) as AttrDict;
    }

    return mergedDict;
}