import { wrapContents } from "@markus/ts-node-util-mk1";

export interface PageLayoutRenderData {
    base?: any;
    content?: any;
    this?: any;
    page?: any;
}

export async function render(data: PageLayoutRenderData) {
    if (!data) {
        return '';
    }

    if (!data.base) {
        data.base = {};
    }

    const slugId: string = data?.page?.fileSlug;

    const pageArticle = wrapContents('article', data.content, {
        id: slugId,
        class: [
            'content-box',
            'page-content'
        ]
    });

    const pageMain = wrapContents('main', pageArticle, {
        class: 'sections-strip'
    });

    const pageBodyParts = [
        `<div class="navspacer"></div>`,
        `${pageMain}`
    ];

    data.base.content = pageBodyParts.join('\n');

    return `
    <html>
        <body>
            ${data.base.content}
        </body>
    </html>`;
}