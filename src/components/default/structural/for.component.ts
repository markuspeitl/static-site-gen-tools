import { HtmlRunner } from "../../../compilers/html.runner";
import { DocumentData, DataParsedDocument } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { getScopedEvalFn } from "../../../utils/fn-apply";
import { BaseComponent, FnBaseComponent } from "../../base-component";
import { getKeyFromDict } from "../../helpers/dict-util";
import { FalsyAble } from "../../helpers/generic-types";

export abstract class ForComponent implements BaseComponent, FnBaseComponent {

    private getCompileDocumentFromDataCtx(dataCtx?: DocumentData | null): DataParsedDocument {
        const toCompileResource: DataParsedDocument = {
            content: dataCtx?.content,
            data: dataCtx,
        };
        return toCompileResource;
    }
    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | DocumentData> {
        return dataCtx || {};
    }
    public async render(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | string> {
        if (!dataCtx) {
            return '';
        }
        const toCompileResource: DataParsedDocument = this.getCompileDocumentFromDataCtx(dataCtx);

        if (!dataCtx.cond) {
            console.log("Invalid 'for' component -> needs to have 'item' and 'of attribute");
        }
        const iteratorItemName: string = dataCtx.item || dataCtx.it;
        const listItemName: string = dataCtx.of;
        const loopBody: string = dataCtx.content;


        const selectedArray: Array<any> = getKeyFromDict(dataCtx, listItemName);
        const renderedIterations: string[] = [];
        for (const itemValue of selectedArray) {
            const subDataCtx = Object.assign(
                {},
                dataCtx
            );
            subDataCtx[ iteratorItemName ] = itemValue;

            subDataCtx.compileRunner = 'html';
            const renderedLoopDocument: FalsyAble<DataParsedDocument> = await config.masterCompileRunner?.compile(
                {
                    content: loopBody,
                    data: subDataCtx
                },
                config
            );

            const renderedBody = renderedLoopDocument?.content || '';
            renderedIterations.push(renderedBody);

            //const htmlComponent: BaseComponent = getComponent('html', config);
            //TODO improve + update
            /*const htmlRunner: HtmlRunner = new HtmlRunner();
            htmlRunner.extractData(
                {
                    content: loopBody,
                    data: subDataCtx
                },
                config
            );*/
        }

        const combinedIterRenderBody = renderedIterations.join('\n');

        return {
            content: combinedIterRenderBody,
            data: dataCtx
        };
    }
}

`
<e-for item="tag" of="tags">
    <tag bind="tag-component"></tag>
    <tag-component>{ tag }</tag-component>

    <e-if of="item-data" is="education">
        Condition that item tag is 'education' was met
    </e-if>

</e-for>
`;