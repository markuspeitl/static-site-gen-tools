
//function component(componentId: string);


`
<for it="test" of "tags">
# Markdown test
</for>
`;
//vs

export async function component(componentName: string, args: any): Promise<(data: any) => string> {
    return (data: any) => {
        return 'hello world';
    };
}


function assemble(strings, ...values) {
    console.log(strings, values);
    return assemble;
}


export async function render(data: any, config: any, component: Function) {

    const forResult1 = (await component(
        'for', {
        it: 'test',
        of: 'tags',
        content: `
                <h3>This is the tag:</h3>
                <p>{{ test }}</p>
            `
    }
    ))(data);

    const forFns = component(
        'for', {
        it: 'test',
        of: 'tags',
        content: `\
        <h3>This is the tag:</h3>
        <p>{{ test }}</p>)}`
    });

    const forFn = prepareComponent();

    forFn(
        'test',
        'tags',
        `<h3>This is the tag:</h3>
        <p>{{ test }}</p>)}`
    );

    const forC = component('for')
        .data(
            data,
            {
                it: 'test',
                of: 'tags',
            }
        );
        .content(
            `<h3>This is the tag:</h3>
            <p>{{ test }}</p>)}`
        )
        .call();

    createComponent('for-tag')
        .data(
            data,
            {
                it: 'test',
                of: 'tags',
            }
        );

    const usefor = `
        <for-tag>
            Hello fortag
        </for-tag>
    `;


    assemble`
        <h1>${data.text}</h1>
        <p>${data.topClass}</p>

        <div class="for-wrapper">
        ${forFn}`;


    const forResult2 = await component(
        'for', {
        it: 'test',
        of: 'tags',
        content: `
                    <h3>This is the tag:</h3>
                    <p>{{ test }}</p>
                `
    }
    );


    return `
        <h1>{{data.text}}</h1>
        <p>{{data.topClass}}</p>

        <for it="test" of "tags">
        # Markdown test
        </for>
        
        - lets
        - try
        - some
        - bulletpoints
    `;
}

