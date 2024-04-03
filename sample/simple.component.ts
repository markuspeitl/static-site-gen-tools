import { DataParsedDocument, DocumentData } from "../src/compilers/runners";
import { BaseComponent, DataFunction, DataToParsedDocumentOrString, ExtensiveComponent } from "../src/components/base-component";
import { SsgConfig } from "../src/config";
import * as fs from 'fs';
import dedent from 'ts-dedent';

function js(strings, ...values) {
    return dedent(strings, ...values);
}

function ts(strings, ...values) {
    //return String.raw({ raw: strings }, ...values);
    return dedent(strings, ...values);
}

function css(strings, ...values) {
    return dedent(strings, ...values);
}

function findFirstContentfulLine(array: string[]): number {
    for (let i = 0; i < array.length; i++) {
        const elem = array[ i ];
        if (elem.trim().length > 0) {
            return i;
        }
    }
    return -1;
}


function normalizeTabs(string: string | null | undefined, spacesPerTab: number = 4): string {
    if (!string) {
        return '';
    }

    const whiteSpacesString = string?.replaceAll('\t', '    ');
    return whiteSpacesString;
}

const preWhiteSpaceRegex = /^\s+/;
function findIdentation(string: string, spacePerTab: number = 4): string {
    if (!string) {
        return '';
    }

    const whiteSpace = string.match(preWhiteSpaceRegex)?.at(0);
    const whiteSpacesString = normalizeTabs(whiteSpace);
    return whiteSpacesString;
}

function removeIdentation(string: string,) {

}

//https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function html(strings, ...values) {

    return dedent(strings, ...values);

    /*const contentLineStart: number = findFirstContentfulLine(strings);
    if (contentLineStart < 0) {
        return;
    }

    const startIdentation: string = findIdentation(strings[ contentLineStart ]);

    if (startIdentation) {
        const startIdentationRegex: RegExp = RegExp('^' + escapeRegExp(startIdentation));

        for (let i = contentLineStart; i < strings.length; i++) {
            strings[ i ] = strings[ i ].replace(startIdentationRegex, '');
        }
    }

    return String.raw({ raw: strings }, ...values);*/
}

function readFileFn(filePath: string): () => Promise<string> {
    return async () => {
        const fileContents: Buffer = await fs.promises.readFile(filePath);
        return fileContents.toString();
    };
}


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

export class StaticAssembledFileComponent implements ExtensiveComponent {
    public data: DocumentData | DataFunction = readFileFn('./data.json');
    public style: DataToParsedDocumentOrString = readFileFn('./style.scss');
    public clientCode: DataToParsedDocumentOrString = readFileFn('./script.js');
    public render: DataToParsedDocumentOrString = readFileFn('./index.html');
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

        const htmlContent: string = html`
            <h1>${dataCtx.title}</h1>
            <p>${dataCtx.description}</p>
            <div>
                ${dataCtx.content}
            </div>
        `;

        return {
            content: htmlContent,
            data: dataCtx
        };
    }

}

const propComponent: PropStyleComponent = new PropStyleComponent();
const fileComponent: StaticAssembledFileComponent = new StaticAssembledFileComponent();
const fnComponent: FunctionStyleDynamicComponent = new FunctionStyleDynamicComponent();


export default fnComponent;