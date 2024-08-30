import { BaseComponent, DataFunction, DataToParsedDocumentOrString, DocumentData, ExtensiveComponent } from "../../src/components/base/i-component";
import { css, curvyTemplate, html, ts } from "@markus/ts-node-util-mk1/src/html/pre-processors";

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
            {{ inner }}
        </div>
    `;
}

const propComponent: PropStyleComponent = new PropStyleComponent();
export default propComponent;