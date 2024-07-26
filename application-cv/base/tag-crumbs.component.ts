import { filterFalsy } from "@markus/ts-node-util-mk1";
import { curvyTemplate, renderArraySelf } from "@markus/ts-node-util-mk1";
import { wrapContent } from "@markus/ts-node-util-mk1";

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