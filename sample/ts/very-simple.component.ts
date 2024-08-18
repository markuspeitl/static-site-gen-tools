import { BaseComponent } from "../../src/components/base/i-component";
import { dataTemplateFn } from "../../src/components/base/common-components";

const verySimpleComponentExample: BaseComponent = {
    data: {
        title: 'test title'
    },
    render: dataTemplateFn(
        `<h1>{{ title }}</h1>`
    ),
};
export default verySimpleComponentExample;