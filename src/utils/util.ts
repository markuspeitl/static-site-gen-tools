import * as path from 'path';
import * as fs from 'fs';

export type FalseAbleVal<ValueType> = ValueType | null | undefined;
export type Nullable<ValueType> = FalseAbleVal<ValueType>;
export type NullableString = FalseAbleVal<string>;
export type NullItemArray<ItemType> = Array<FalseAbleVal<ItemType>>;
export type NullItemNullArray<ItemType> = Array<FalseAbleVal<ItemType>> | null | undefined;
export type ArrOrSing<ItemType> = ItemType | Array<ItemType>;
export type ArrNullOrSing<ItemType> = ArrOrSing<ItemType> | null | undefined;
export type StringArrOrSingNull = ArrNullOrSing<NullableString>;
export type AttrDict = Record<string, StringArrOrSingNull>;

export type DataDict = Record<string, any>;

export interface AttrInflateMap {
	[ name: string ]: {
		regex: RegExp,
		inflate: (value: any, attrsDict: AttrDict, ...args: any) => string;
	};
}

export interface HtmlElemRenderData {
	id?: string;
	class?: StringArrOrSingNull;
}

export interface LayoutRenderData extends HtmlElemRenderData {
	content: any;
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

/*export function arrayify(item: Stin): any[] {
	if (!item) {
		[];
	}
	if (Array.isArray(item)) {
		return item;
	}
	return [ item ];
}*/

//const nonKeyValuePropKey = 'options';
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

	/*
	let attrsString = '';
	
	for (const key in domInfo) {
		const currentVal = domInfo[ key ];
		if (currentVal) {
			const domAttr = toHtmlAttr(key, currentVal, true);
			attrsString += domAttr;
		}
	}

	return attrsString;*/
}

export function addIdPostFix(attrs: AttrDict, postFix: string): void {
	if (attrs.id) {
		attrs.id = `${attrs.id}-${postFix}`;
	}
}

export function indent(toIndentString?: string): string {
	if (!toIndentString || !toIndentString.split) {
		return '';
	}

	const lines = toIndentString.split('\n');
	const indented = lines.map((line) => `\t${line}`);
	return indented.join('\n');
}

export function fromLines(lines: string[]): string {
	return lines.join('\n');
}

export function wrapContentsIfFilled(wrapTag: NullableString, contentStrings: StringArrOrSingNull, ...attrs: NullItemArray<AttrDict>): string | undefined {

	contentStrings = arrayifyFilter(contentStrings);

	if (!contentStrings || contentStrings.length <= 0) {
		return undefined;
	}

	const joinedContents = contentStrings.join('');
	if (joinedContents.trim() === '') {
		return undefined;
	}

	return wrapContents(wrapTag, contentStrings, ...attrs);
}

export function wrapContents(wrapTag: NullableString, contentStrings: StringArrOrSingNull, ...attrs: NullItemArray<AttrDict>): string {

	contentStrings = arrayifyFilter(contentStrings);

	if (!wrapTag) {
		return contentStrings.join('\n');
	}

	const mergedAttrs = mergeAttrDicts(...attrs);
	const attrsString = getAttrsFromDict(mergedAttrs);

	const wrapperLines: string[] = [];

	wrapperLines.push(`<${wrapTag}${attrsString}>`);
	for (const content of contentStrings) {
		if (content) {
			wrapperLines.push(indent(content));
		}
	}
	wrapperLines.push(`</${wrapTag}>`);

	return wrapperLines.join('\n');
}

export function wrapContent(wrapTag: NullableString, content: StringArrOrSingNull, ...attrs: FalseAbleVal<AttrDict>[]): string {
	/*if (!wrapTag) {
		return content;
	}*/

	return wrapContents(wrapTag, content, ...attrs);
}

/*export function wrapContentAddAttrs(wrapTag: string, content: string, ...attrs: FalseAbleVal<AttrDict>[]) {
	if (!wrapTag) {
		return content;
	}

	const mergedAttrs = mergeAttrDicts(...wrapDomInfo);
	return wrapContents(wrapTag, [ content ], mergedAttrs);
}*/


export function wrapContentsClass(wrapTag: string, contentStrings: Array<string | undefined> | string, className?: string): string {
	let domInfo: any = {};
	if (className) {
		domInfo.class = className;
	}

	if (Array.isArray(contentStrings)) {
		return wrapContents(wrapTag, contentStrings, domInfo);
	}
	return wrapContent(wrapTag, contentStrings, domInfo);
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

export function collectUntil(string: string, startOffset: number, findToken: string | RegExp): string {
	return '';
}

export function parseTagParts(tagString: string) {
	const trimmedTagString = tagString.trim();
	if (trimmedTagString.at(0) !== '<') {
		throw new Error('Invalid tag string for parseTagParts -> must start with an < token ');
	}
	const startTag = trimmedTagString.at(0);
	const tag = collectUntil(trimmedTagString, 1, ' ');
	const attrs = collectUntil(trimmedTagString, 1 + tag.length + 1, '/>');
	const endTag = trimmedTagString.slice(trimmedTagString.length - 2);

	return {
		start: startTag,
		tag: tag,
		attrs: attrs,
		endTag
	};
}

export function parseAttrVal(attributeValueString: string): any {

	let openend = false;
	let startOffset = 0;
	if (attributeValueString.startsWith('"')) {
		openend = true;
		startOffset = 1;
	}
	let closed = false;
	let endOffset = 0;
	if (attributeValueString.endsWith('"')) {
		closed = true;
		endOffset = 1;
	}

	const value = attributeValueString.slice(startOffset, attributeValueString.length - endOffset);

	return {
		open: openend,
		close: closed,
		value: value
	};
}

export function parseAttrsString(attrsString: string) {
	const singleSpacedLine = attrsString.replace(/ +/g, ' ');
	const htmlLineParts = singleSpacedLine.split(' ');

	const parsedAttrs: AttrDict = {};

	for (let i = 1; i < htmlLineParts.length; i++) {
		const currentAttrPart = htmlLineParts[ i ];
		if (currentAttrPart.includes('=')) {
			const attrAssignmentParts = currentAttrPart.split('=');
			pushToProp(parsedAttrs, attrAssignmentParts[ 0 ], null);
			const assignValue = attrAssignmentParts[ 1 ];
		}
		else {
			pushToProp(parsedAttrs, 'options', currentAttrPart);
		}
	}

	return parsedAttrs;
}

export function parseAttrsOf(tagString: string): AttrDict {
	const singleSpacedLine = tagString.replace(/ +/g, ' ');
	const htmlLineParts = singleSpacedLine.split(' ');

	const parsedAttrs: AttrDict = {};

	for (let i = 1; i < htmlLineParts.length; i++) {
		const currentAttrPart = htmlLineParts[ i ];
		if (currentAttrPart.includes('=')) {
			const attrAssignmentParts = currentAttrPart.split('=');
			pushToProp(parsedAttrs, attrAssignmentParts[ 0 ], null);
		}
		else {
			pushToProp(parsedAttrs, 'options', currentAttrPart);
		}
	}

	return parsedAttrs;
}

export function decorateTop(htmlString: string, newAttrs: AttrDict = {}): string {
	if (!htmlString || !newAttrs) {
		return htmlString;
	}

	const htmlLines = htmlString.split('\n');
	const firstLine = htmlLines[ 0 ];

	const { start, tag, attrs, endTag } = parseTagParts(firstLine);

	const parsedAttrs = parseAttrsOf(attrs);
	mergeFlatCollect(parsedAttrs, newAttrs);
	const mergedAttrsString = getAttrsFromDict(parsedAttrs);

	return `${start}${tag} ${mergedAttrsString} ${endTag}`;
}

export function divWrapper(contentStrings: Array<string | undefined> | string | undefined, className?: string) {
	if (!contentStrings) {
		return '';
	}

	return wrapContentsClass('div', contentStrings, className);
}

export function dictValFnCall(dict, arrayFnKey, valCallback) {
	const dictKeys: Array<string> = Object.keys(dict);

	const mapCallback = (dictKey) => {
		const dictVal = dict[ dictKey ];
		return valCallback(dictVal, dictKey);
	};

	return (dictKeys as any)[ arrayFnKey ](mapCallback);
}

export function dictValMap(dict, mapValCallback) {
	if (!dict) {
		return [];
	}

	const dictKeys: string[] = Object.keys(dict);

	const mapCallback = (dictKey) => {
		const dictVal = dict[ dictKey ];
		return mapValCallback(dictVal, dictKey);
	};

	return dictKeys.map(mapCallback);
}

export function emptyIfFalsy(value: string | undefined | null): string {
	if (value) {
		return value;
	}
	return '';
}

export function listify(items: string[], ulClass?: string, liClass?: string) {
	let listWrappedLinks: (string | undefined)[] = items.map((item) => wrapContentsIfFilled('li', item, { class: liClass }));
	listWrappedLinks = filterFalsy(listWrappedLinks);
	return wrapContents('ul', listWrappedLinks, { class: ulClass });
}

export function getIfDef<ItemVal>(variable: ItemVal, truthyValue, falsyValue = ''): ItemVal | any {
	if (variable) {
		return truthyValue;
	}
	return falsyValue;
}

export function prespace(target: string): string {
	if (!target) {
		return '';
	}
	return " " + target;
}

export function getHtml(tag: string, content: string | string[] = '', attrs?: AttrDict, isSelfClosing: boolean = false, ifTruthy: any = true): string {

	if (!ifTruthy) {
		return '';
	}

	if (!tag) {
		throw new Error(`Can not get html from empty tag`);
	}

	if (!content) {
		content = '';
	}

	if (Array.isArray(content)) {
		content = filterFalsy(content);
		content = content.join('\n');
	}


	let attrsString = '';
	if (attrs) {
		attrsString = getAttrsFromDict(attrs);
	}

	const openTagOpenToken = `<${tag}${prespace(attrsString)}`;
	if (isSelfClosing) {
		return `${openTagOpenToken} />`;
	}
	const openTag = `${openTagOpenToken}>`;
	const closeTag = `</${tag}>`;

	return `${openTag}${content}${closeTag}`;
}

export function getClosedHtml(tag: string, attrs?: AttrDict, ifTruthy: any = true): string {
	return getHtml(
		tag,
		'',
		attrs,
		true,
		ifTruthy
	);
}

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



export function mergeAttrsInData(data: DataDict, toMergeKeys: ArrOrSing<string>, dataAttrKeyMaps: ArrOrSing<Record<string, string>>): void {
	if (!data) {
		return;
	}
	toMergeKeys = arrayify(toMergeKeys);
	dataAttrKeyMaps = arrayify(dataAttrKeyMaps);

	for (let i = 0; i < toMergeKeys.length; i++) {
		const attrDictInDataKey = toMergeKeys[ i ];
		const attrDictInData = data[ attrDictInDataKey ];

		const dataAttrKeyMap = dataAttrKeyMaps[ i ];

		const merged = mergeDataAttrs(data, attrDictInData, dataAttrKeyMap);

		data[ attrDictInDataKey ] = merged;
	}
}

export function mergeDataAttrs(data: DataDict, attrs?: AttrDict, dataAttrKeyMap?: Record<string, string>): AttrDict {
	if (!dataAttrKeyMap) {
		return attrs || {};
	}
	if (!attrs) {
		attrs = {};
	}

	if (!data) {
		data = {};
	}

	const dataFrontMatterAttrs = {};
	for (const key in dataAttrKeyMap) {

		if (dataAttrKeyMap[ key ] && data[ key ]) {
			const attrKey = dataAttrKeyMap[ key ];
			dataFrontMatterAttrs[ attrKey ] = data[ key ];
		}
	}
	return mergeAttrDicts(dataFrontMatterAttrs, attrs);
}

export function addAttrVal(attrs: AttrDict | null | undefined, key: string, value: string): AttrDict {
	if (!attrs) {
		return {};
	}

	const toMerge = {};
	toMerge[ key ] = value;

	//return mergeFlatCollect(attrs, toMerge) as AttrDict;
	mergeFlatCollect(attrs, toMerge, false);
	return attrs;
	//return attrs;
}

export function addClass(attrs: Nullable<AttrDict>, newClass: string): Nullable<AttrDict> {
	addAttrVal(attrs, 'class', newClass);
	return attrs;
}

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

export function applyAttrFn(attrs: AttrDict, key: string, fn: (value: any, key?: string) => any): string | string[] {
	if (!attrs || !attrs[ key ]) {
		return '';
	}
	if (Array.isArray(attrs[ key ])) {
		attrs[ key ] = filterFalsy(attrs[ key ] as any[]);
		return (attrs[ key ] as any[]).map((value) => fn(value, key));
	}
	return fn(attrs[ key ], key);
}

export function inflateFromAttr(attrsDict: AttrDict, key: string, attrInflateMapDict: AttrInflateMap, ...passArgs: any): string | string[] {
	return applyAttrFn(attrsDict, key, (value: any) => {
		for (const entryKey in attrInflateMapDict) {
			const entryVal = attrInflateMapDict[ entryKey ];
			if (entryVal.regex.test(value)) {
				return entryVal.inflate(value, attrsDict, ...passArgs);
			}
		}

		throw new Error('Unknown attribute of attrsDict :' + value);
	});
}

export function joinAll(stringsHolderObj, token: string = ""): string {
	if (!stringsHolderObj) {
		return '';
	}

	if (typeof stringsHolderObj === 'string') {
		return stringsHolderObj;
	}
	if (Array.isArray(stringsHolderObj)) {
		const subStrings: string[] = stringsHolderObj.map((item) => joinAll(item, token));
		return subStrings.join(token);
	}
	if (typeof stringsHolderObj === 'object') {
		const keys = Object.keys(stringsHolderObj);
		const subStrings: string[] = keys.map((key) => joinAll(stringsHolderObj[ key ], token));
		return subStrings.join(token);
	}

	return '';
}

export function concatAll(...arrays: (any[] | undefined)[]): any[] {

	if (!arrays) {
		return [];
	}

	return arrays.reduce(
		(collectedArray, currentArray) => {

			if (!collectedArray) {
				collectedArray = [];
			}
			if (currentArray) {
				return collectedArray.concat(currentArray);
			}
			return collectedArray;
		},
		[]
	) as any[];
}

export function isIndexedPath(filePath: string): boolean {
	const filePathParsed = path.parse(filePath);

	const fileDir: string = filePathParsed.dir;
	const fileDirParsed = path.parse(fileDir);

	if (filePathParsed.name === 'index' || filePathParsed.name === fileDirParsed.name) {
		return true;
	}
	return false;
}
export function getPathToLastPageIdentifier(filePath: string): string {
	if (isIndexedPath(filePath)) {
		return path.dirname(filePath);
	}
	return filePath;
}
export function lastPageIdPathName(filePath: string): string {
	const lastPageIdentifierPath = getPathToLastPageIdentifier(filePath);
	return path.parse(lastPageIdentifierPath).name;
}
export function getPageDirPath(filePath: string): string {
	const lastPageIdentifierPath = getPathToLastPageIdentifier(filePath);
	return path.dirname(lastPageIdentifierPath);
}

export function findTokenIndices(string, token = '_') {
	if (typeof string !== 'string') {
		return [];
	}

	if (!string || !string.includes(token)) {
		return [];
	}

	const stringArray = string.split('');
	const tokenIndices = stringArray.reduce((prevVal: number[], curVal: string, index: number) => {
		if (curVal === token) {
			prevVal.push(index);
		}
		return prevVal;
	}, []);

	return tokenIndices;
}

//Applies in place
export function applyFnToArrayIndices(array, indices, applyFn, offset = 0) {
	if (!array || !indices || !applyFn) {
		return array;
	}

	for (const index of indices) {

		const offsetIndex = index + offset;
		if (offsetIndex >= 0 && offsetIndex < array.length) {
			const transformedItem = applyFn(array[ offsetIndex ]);
			array[ offsetIndex ] = transformedItem;
		}
	}

	return array;
}

export function charsAfterTokenToUpper(string: string, token: string): string {
	const stringArray = string.split('');

	const underScoreIndices = findTokenIndices(string, token);

	const charToUpper = (string) => string.toUpperCase();

	const afterUnderscoreUpperArray = applyFnToArrayIndices(stringArray, underScoreIndices, charToUpper, 1);

	const camelCaseArray = afterUnderscoreUpperArray.filter((character) => character !== token);

	return camelCaseArray.join('');
}

export function charsAfterUnderscoreToUpper(string: string): string {

	const delimiterToken = '_';
	return charsAfterTokenToUpper(string, delimiterToken);
}

export function camelCase(string) {

	if (typeof string !== 'string') {
		return string;
	}
	if (!string || !string.includes('_')) {
		return string;
	}

	return charsAfterUnderscoreToUpper(string);

	/*if(upperCasedCamel && upperCasedCamel.length > 0 && typeof upperCasedCamel === 'string'){
		return upperCasedCamel.replaceAll('_', '');
	}*/
}

export function camelCasizeKeys(dict) {

	if (typeof dict !== 'object') {
		return dict;
	}

	for (const key in dict) {
		const currentValue = dict[ key ];

		delete dict[ key ];
		const camelKey = camelCase(key);
		dict[ camelKey ] = camelCasizeKeys(currentValue);
	}

	return dict;
}

export function pushAndGet<ItemType>(array?: ItemType[], item?: ItemType): ItemType[] {
	if (!array) {
		array = [];
	}
	if (!item) {
		return array;
	}
	array.push(item);
	return array;
}

export function pushAndGetCopy<ItemType>(array?: ItemType[], item?: ItemType): ItemType[] {
	if (array) {
		array = new Array(...array);
	}
	return pushAndGet(array, item);
}

export async function waitAsync(msec: number): Promise<void> {
	return new Promise<void>((resolve: (result?: any) => void, reject: (reason?: any) => void) => {
		setTimeout(() => {
			return resolve();
		}, msec);
	});
}
