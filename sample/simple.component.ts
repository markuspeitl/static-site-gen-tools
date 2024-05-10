import { DataParsedDocument, DocumentData } from "../src/compilers/runners";
import { BaseComponent, DataFunction, DataToParsedDocumentOrString, ExtensiveComponent } from "../src/components/base-component";
import { dataTemplateFn, StaticAssembledFileComponent } from "../src/components/common-components";
import { css, curvyTemplate, html, ts } from "../src/components/helpers/pre-process";
import { SsgConfig } from "../src/config";
import * as fs from 'fs';

export class PropStyleComponent implements ExtensiveComponent {

    public data: DocumentData | DataFunction = {
        title: 'prop style test',
        description: 'setting component contents through simplified style'
    };

    public style: DataToParsedDocumentOrString = css`
        body {
            background-color: rgba(125,0, 100, 0.7);
        }
        .elem {
            content: '';
        }
    `;

    public clientCode: DataToParsedDocumentOrString = ts`
        const elem = document.getElementById('somid');
        elem.innerHTML = "<p> I am some element content</p>"
        const tsVar: String = "Some typescript typed variable";

        function testSomething(param: string): Record<string, string> = {
            console.log("Test");
        }
    `;

    public render: DataToParsedDocumentOrString = html`
        <h1><data-title /></h1>
        <p>{{ description }}</p>
        <div>
            {{ content }}
        </div>
    `;
}

export class FileComponent extends StaticAssembledFileComponent {



    /*public data: DocumentData | DataFunction = readFileFn('./data.json');
    public style: DataToParsedDocumentOrString = readFileFn('./style.scss');
    public clientCode: DataToParsedDocumentOrString = readFileFn('./script.js');
    public render: DataToParsedDocumentOrString = readFileFn('./index.html');*/
}

class FunctionStyleDynamicComponent implements BaseComponent {
    async data(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | DocumentData> {
        return {
            title: 'prop style test',
            description: 'setting component contents through simplified style',
            content: '<div><span><img src="assets/test.png" /></span></div>'
        };
    }
    async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {

        if (!dataCtx) {
            dataCtx = {};
        }

        /*const htmlContent: string = html`
            <h1>${dataCtx.title}</h1>
            <p>${dataCtx.description}</p>
            <div>
                ${dataCtx.content}
            </div>
        `;*/

        let htmlContent: string = curvyTemplate(html`
            <h1>{{title}}</h1>
            <p>{{description}}</p>
            <div>
                {{content}}
            </div>

<md>
# Markdown test
        
- lets
- try
- some
- bulletpoints
</md>

        `, dataCtx);

        htmlContent = htmlContent + "\n\n Try njk compile: {{ description }}";
        htmlContent = htmlContent + `\n\n beforenjk <njk> {{ title }} {{ description }} </njk> afternjk`;

        return {
            content: htmlContent,
            data: dataCtx
        };
    }

}

const propComponent: PropStyleComponent = new PropStyleComponent();
const fileComponent: FileComponent = new FileComponent();
const fnComponent: FunctionStyleDynamicComponent = new FunctionStyleDynamicComponent();


//export default fnComponent;

// For defining multiple components in a single file
/*export default {
    'PropComponent': propComponent,
    'FunctionComponent': fnComponent,
    'FileComponent': fileComponent,
};
export default {
    'prop-component': propComponent,
    'function-component': fnComponent,
    'file-component': fileComponent,
};
*/

const verySimpleComponentExample: BaseComponent = {
    data: {
        title: 'test title'
    },
    render: dataTemplateFn(
        `<h1>{{ title }}</h1>`
    ),
};
//export default verySimpleComponentExample;
export default fnComponent;