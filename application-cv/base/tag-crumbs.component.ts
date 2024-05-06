import { filterFalsy } from "../../src/components/helpers/array-util";
import { curvyTemplate, renderArraySelf } from "../../src/components/helpers/pre-process";
import { wrapContent } from "../../src/components/helpers/wrap-html";

export function render(data: any) {

    const titleHtml = curvyTemplate(
        `<h1>{{ title }}</h1>`,
        data
    );

    const tagsHtml = renderArraySelf(
        `<span>{{content}}</span>`,
        data.tagList
    );

    const tagItems = [ titleHtml, ...filterFalsy(tagsHtml) ];

    return wrapContent(
        'section',
        tagItems
    );

    /*mkHtml`
    <section>
        ${titleHtml}
        ${tagsHtml}
    </section>`;*/
}

/*
const data = {
    title: Expertice
    tagList: [
        'TypeScript'
        'Node.js'
        'Angular'
        'HTML5'
        'CSS3'
    ]
}

<section>
    <h1>Expertice:</h1>
    <span>TypeScript</span>
    <span>Node.js</span>
    <span>Angular</span>
    <span>HTML5</span>
    <span>CSS3</span>
</section>
*/