import { BaseComponent, DataFunction, DataToParsedDocumentOrString, DocumentData, ExtensiveComponent } from "../../src/components/base-component";
import { dataTemplateFn, StaticAssembledFileComponent } from "../../src/components/common-components";
import { SsgConfig } from "../../src/config";
import * as fs from 'fs';
import { IProcessResource } from "../../src/pipeline/i-processor";
import { css, curvyTemplate, html, ts } from "@markus/ts-node-util-mk1/src/html/pre-processors";


export class FileComponent extends StaticAssembledFileComponent {



    /*public data: DocumentData | DataFunction = readFileFn('./data.json');
    public style: DataToParsedDocumentOrString = readFileFn('./style.scss');
    public clientCode: DataToParsedDocumentOrString = readFileFn('./script.js');
    public render: DataToParsedDocumentOrString = readFileFn('./index.html');*/
}

const fileComponent: FileComponent = new FileComponent();

export default fileComponent;

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

