export interface MatchedAndExpression {
    match: any,
    expression: string,
}

export function getKeyMatches<ValueType>(toMatchString: string | null, matchMapDict?: Record<string, ValueType>): MatchedAndExpression[] | null {
    if (!toMatchString) {
        return null;
    }
    if (!matchMapDict) {
        return null;
    }

    const matchesValues: MatchedAndExpression[] = [];
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
                expression: key.toString(),
                match: currentMatchMapValue,
            });
        }
    }

    return matchesValues;
}