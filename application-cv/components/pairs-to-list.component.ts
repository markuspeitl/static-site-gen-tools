import { wrapContent } from "../../src/components/helpers/wrap-html";
import type { SsgConfig } from "../../src/config";
import type { IProcessResource } from "../../src/pipeline/i-processor";
import { splitStringPreserve } from "../../src/utils/string-util";

function renderSpan(content: string): string {
    return `<span>${content}</span>`;
}

export async function render(resouce: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
    let data = resouce.data;
    const content: string = resouce.content;

    if (!data) {
        data = {};
    }

    const itemTag = data.tag || 'span';
    const rootTag = data[ 'root-tag' ];// || 'div';
    const splitToken = data.token || ': ';

    const contentLines: string[] = content.split('\n');
    const allSplitItemsList: string[] = contentLines.map((line) => splitStringPreserve(line, splitToken, false)).flat();
    const htmlItemList = allSplitItemsList.map((textPart: string) => wrapContent(itemTag, textPart));

    const unwrappedContent: string = htmlItemList.join('\n');

    if (!rootTag) {
        resouce.content = unwrappedContent;
    }

    resouce.content = wrapContent(rootTag, unwrappedContent, {
        class: data.class,
    });

    return resouce;
    //return allSplitItemsList.map((textPart: string) => renderSpan(textPart)).join('\n');
};