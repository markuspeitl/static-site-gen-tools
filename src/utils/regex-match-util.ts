export interface MatchedDictKeyRes<ValueType> {
    pattern: string,
    dictValue: ValueType,
}

export function getKeyMatches<ValueType>(toMatchString: string | null, matchMapDict?: Record<string, ValueType>): MatchedDictKeyRes<ValueType>[] | null {
    if (!toMatchString) {
        return null;
    }
    if (!matchMapDict) {
        return null;
    }

    const matchesValues: MatchedDictKeyRes<ValueType>[] = [];
    for (const key in matchMapDict) {
        const currentMatchMapValue: ValueType = matchMapDict[ key ];

        let expression: RegExp;
        if (typeof key === 'string') {
            expression = new RegExp(key, 'gi');
        }
        else {
            expression = key;
        }

        if (toMatchString.match(expression)) {
            matchesValues.push({
                pattern: key.toString(),
                dictValue: currentMatchMapValue,
            });
        }
    }

    return matchesValues;
}

export function getKeyMatchValues<ValueType>(toMatchString: string | null, matchMapDict?: Record<string, ValueType>): ValueType[] | null {
    const matchesValues: MatchedDictKeyRes<ValueType>[] | null = getKeyMatches(toMatchString, matchMapDict);
    if (!matchesValues) {
        return null;
    }
    return matchesValues.map((matchedValue: MatchedDictKeyRes<ValueType>) => matchedValue.dictValue);
}