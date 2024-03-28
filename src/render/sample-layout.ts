
export const meta = {

    layoutStatic: "../example/generate-site.ts",
    layoutModule: await import("../example/generate-site.ts"),
    layoutModule: async () => await import("../example/generate-site.ts"),
    layoutModule: async () => {
        render: () => 'hello';
        data: () => { mydata: 'hellodata'; };
    },
    layoutModule: async (content) => {
        return `
            <html></html>
        `;
    },
    subrenderers: {

    }

    hooks: {
        prerender: "",
        postrender: "",
        premeta: "",
        postmeta: "",
        predata: "",
        postdata: "",
        globalavailable: ""
    },


    evaluate: {
        layout: "build", //static, used, dynamic
        data: "build"
    }
};


export function data(dataProviders?: any) {
    const favicon = dataProviders.get('global.favicon');
}

export interface RenderContent {
    renderers: string[]; //Renderer with which the content has already been processed
    compiled: any[]; //Intermediate representation of all used renderers (eg parsed markdown/html --> AST tree)
    data: any; //the data that was passed during the compile step //note data should be static once it gets passed into render (no data modification in render)
    inputData: string; //Input content in unmodified form
    toString(); //content as compiled string (eg html)
}

function compileTemplate(template, data) {

}

export function render(content: any, data: any) {

    const renderer = content.renderer;

    compileTemplate(`
        {{}}
    `, data);
}