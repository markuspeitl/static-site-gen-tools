import { BaseComponent } from "../../src/components/base-component";
import { dataTemplateFn } from "../../src/components/common-components";

const verySimpleComponentExample: BaseComponent = {
    data: {
        title: 'test title'
    },
    render: dataTemplateFn(
        `<h1>{{ title }}</h1>`
    ),
};
export default verySimpleComponentExample;