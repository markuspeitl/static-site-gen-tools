//import { mergeAttrDicts, getAttrsFromDict, indent } from "../../utils/util";
import { arrayifyFilter, filterFalsy, filterFalsyEmpty, mergeAsArrays } from "./array-util";
import { mergeDicts } from "./dict-util";
import { NullableString, StringArrOrSingNull, NullItemArray, AttrDict, FalseAbleVal } from "./generic-types";
import { getAttrsFromDict, mergeAttrDicts } from "./html-attrs";

export function indent(toIndentString?: string): string {
    if (!toIndentString || !toIndentString.split) {
        return '';
    }

    const lines = toIndentString.split('\n');
    const indented = lines.map((line) => `\t${line}`);
    return indented.join('\n');
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

export function listify(items: string[], ulClass?: string, liClass?: string) {
    let listWrappedLinks: (string | undefined)[] = items.map((item) => wrapContentsIfFilled('li', item, { class: liClass }));
    listWrappedLinks = filterFalsy(listWrappedLinks);
    return wrapContents('ul', listWrappedLinks, { class: ulClass });
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
