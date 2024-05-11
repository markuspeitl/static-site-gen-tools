import { DataParsedDocument, DocumentData } from "../../src/compilers/runners";
import { wrapContent } from "../../src/components/helpers/wrap-html";
import { SsgConfig } from "../../src/config";
import { splitStringPreserve } from "../../src/utils/string-util";

function renderSpan(content: string): string {
    return `<span>${content}</span>`;
}

export async function render(dataCtx: DocumentData, config: SsgConfig = {}): Promise<DataParsedDocument | string> {
    const data = dataCtx.data;
    const content: string = dataCtx.content;

    const itemTag = data.tag || 'span';
    const rootTag = data[ 'root-tag' ];// || 'div';
    const splitToken = data.token || ': ';

    const contentLines: string[] = content.split('\n');
    const allSplitItemsList: string[] = contentLines.map((line) => splitStringPreserve(line, splitToken, false)).flat();
    const htmlItemList = allSplitItemsList.map((textPart: string) => wrapContent(itemTag, textPart));

    if (!rootTag) {
        return htmlItemList.join('\n');
    }

    return wrapContent(rootTag, htmlItemList, {
        class: data.class,
    });
    //return allSplitItemsList.map((textPart: string) => renderSpan(textPart)).join('\n');
};