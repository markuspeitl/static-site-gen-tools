## IO types:
- In file --> Out Processed file (1/1 relationship)
- In multiple files -> Out processed file  (n/1 relationship)
- One file -> multiple processed files (1/n relationship)

Simplification: Only provide n/1 relationships through hierarchical means
-> there needs to be a parent -> converts it to 1/1 or 1/n relationships

## Processing levels/types:
- Application level 
    (perform all processing operations on a configured input)
- Directory level
    process a directory to output
- File level
    process a file to one or more output files
- Content/Data level
    process input content or data to output content
- Partial level
    process a part of the input content

Every processing type can be considered a pipeline!

## Templating:
typescript templates only.

### Types:
- Standalone: Can be combined with data and rendered as is:
```
<sample-component>
    <h1>My sample content of component</h1>
</sample-component>
```

```
<stack-view>
    <div class="container">
        <img></img>
        <div class="overlay"></div>
    </div>
</stack-view>
```
**stack-view** is a pseudo container that can modify
child contents (reverse elements, add class, permutate contents, add local style)


```
<mark-down>
    
    # This is a heading

    Lorem ipsum color aposf
    spdogp sodgkü

</mark-down>
```

The markdown renderer is not something special but an actual template component
-> can be used with custom tag from <html>

Combination:
Can return template from template:
Resolve/Inflate template until no template is found anymore

```
render(){
    return `
        <mark-down>
            #something
        <mark-down>
    `
}
```

```njk
{{markdown}}

{{/markdown}}
```

```
<tags select="section">
    {{section}}
</tags>
```
Reference to rendered elements (multiple)

```
<tag-section>
    <mark-down>
        # Section title
    <mark-down>
    <tag-section-content />
</tag-section>
```
dynamic keyword renderers
In this case applies the

**Explicitly**
```html
    <each data="getRenderedTagCollection('section')">
        <mark-down>
            # Section title
        <mark-down>
        <section-component content="data" />
    </each>
```

``getRenderedTagCollection('section')`` is passed as data to the
'each' component (the data property should be for special cases only -> what we really want is to pass raw content into the components
can the parse/select the data we want need)

#### Example expandable FAQ list:
```
<listify>
    # What is SSP?
        Static site piplines is a simple site generator that can be adapted to any of your needs
        and follows as use as library, ultilitarian and modular approach, instead of being opinionated.
    # What else?
        Second list item expandable content
</listify>
```

#### The each component
```javascript
render(data, scope, dataProvider){
    const sectionList = []
    for (cont section of scope.data){

        render(data.content, scope = {
            'data': section
        })
    }
    return sectionList.join('\n')
}
```


```javascript
render(data, dataProvider){

    const renderedSections = dataProvider.getRenderedTagCollection('section')

    const sectionList = []
    for (cont renderedSection of renderedSections){
        sectionList.push(
            `
                <mark-down>
                    # Section title
                <mark-down>
                <section-component>
                    {{renderedSection}}
                </section-component>
            `
        )
    }
    return sectionList.join('\n')
}
```

HTML + component centric


``{{tag-content}}`` syntax is irrelevant when using
custom html tags, because writing ``<tag-content />`` is just the same amount of work


Components can have:
- No content (everything is inflated from explicitly passed data, or statically)
- Content that is placed within the component


## Should be isomorphic javascript:
- Static build time render 'nodejs'
- Default render on nodejs server (uses 'fs', 'chokidar', .etc)
- Renderer on client/browser (use cache or http requests to fetch templates/contents)

On demand renderer should be enabled by default, when not debugging (build page on request).
Dynamic rendering -> use it like a template engine with mutable data. (cache n page permutations or disable cache).


## Typescript template rendering should be portable
(move runtime + templates to different project/platform and start inflating)




# Render interface

Option1:
``render(data, scope, dataProvider)``
scope - contains current context:
- content - what is within the tag (if the content contains variables then this data should be passed in scope as well)
- dataProvider - service for side chaining data (example for global data that is not passed)
should this even be in render??

What does a component need in order to render:
- Content - optional what is passed between open and close tags
- Data scope - explicitly passed variables and data
- Sub renderers - renderers of any elements that are passed as content OR used in th render function.

#### Incremental rendering:
The main way to render subcomponents is to add the elements in the
resulting html.
Then the caller detects that there are unresolved components in the result,
finds the corresponding renderer and renders that partial.
Effectively the rendering is flip-flopping between the renderers and the caller and 
elements are incrementally refined.
-> the renderers do not need to know anything about other renderers apart from their tag name.
+ good for dynamic loading

``render(scope, content?)``

## Resolving urls, paths, .etc?

Options:

```html
<img src="{{ url-for /assets/img/testimg.jpg }}">

<img src="<url-for>/assets/img/testimg.jpg</url-for>">

<url-for>/assets/img/testimg.jpg</url-for>
<img src="url-for">

<url-for data-id='imgid'>/assets/img/testimg.jpg</url-for>
<img src="imgid">
```

I like the idea of having pseudo elements in the attributes for processing. (handlebars syntax looks a bit cleaner though)

2nd option is to locally bind the last pseudo element to a local scope variable that can be referenced.


### Even better
define a global attribute transformer function that maps all detected and existing input paths to output urls
that are not escaped in some way.

```
//Might contain components (as soon as it is encountered)
addAttributeTransformer(tag, attribute, (attributeValue, scope) => {
    if(hasRenderable(attributeValue)){
        render(attributeValue, scope)
    }
});

//Fully evaluated attribute (as soon as value is evaluated)
addRenderedAttributeTransformer(tag, attribute, (attributeValue, scope) => {
    return mapInputToOutputPath(attributeValue)
});

//Add pseudo component <url-for> to all
addAttributeTransformer('img,source,href', 'src', (attributeValue, scope) => {
    return wrapContent('url-for', attributeValue)
});
```

### 2. Incremental rendering
Inline data in html.
Each render pass creates a valid html.
- The first pass populates data
- The rest of the passes 




## Inplace site:
Paths to static resources are relative to the input directories
-> we could for development render the site in place with a dev server and not dynamically
resolve the output.
-> then in production map input dirs to output

Advantage: Site can be rendered without requiring global content (input and output dirs)


## Components
are somewhat similar to https://kinsta.com/blog/web-components/ ,
but have less features.
The reason for this is that web-components have quite a bit of boilerplate as they
also support dynamic features on the dom element itself (attribute watching)
Adding (template) content passed from the parent also has a lot of additional information.
(slots, slot names, templates, slotting in of content)

Transpiling nunchucks, liquid, or other templating languages to these component
is possible


# Processing graph
1. Input
    - directories to process
    - files to process
    - contents to process


Examples:
1. directories to process
2. Merge directories = single input directory
3. 



# Rendering features:
- Inheritance (extend and modify existing templates)
Implement njk, ejs, markdown, html or other renderers through inheritance (all treated as inherited renderers,
but are typescript layouts internally)
- Dynamic component
- Layout chain specification (specify the layout chain in content frontmatter -> img-gallery <- floating-box <- info-section )


### Rendering flow:
1. Markdown content
2. Parse to html
3. Decorate transform content 1:1 (bind content to proper structure and attributes) 'documentTransform'
Adding additional values into existing elements, adding containers for parts of the document.
Essentially merging two pieces together "content + structure/decoration"
4. Insert into any number of 'frames' or 'containers'

## Types of containers:
- leaf: self encapsulated container with no dependency on other layouts
- frames/containers: encapsulate the content
- child holder: encapsulate multiple children (list of sections, list of urls, .etc)
- content inflator: build multiple pieces of content from a single container (necessary??)


### What can be done with content:
- Wrap content into container
- parse and transform content
- decorate content with other content
- split content into multiple pieces of content
- merge multiple pieces of content and containers, .etc

### Prevent parseland:
If the content has been parsed before that structure should be reusable.
Parsing is a means to split content pieces and map into a larger work, however
it is somewhat error prone and unnecessary if the application has to parse the content anyway.

Parsing really should not be in the renderer at all, as it analyses semantic information to create
new partials.
If it is not in the render function, then it should be part of the toolset.

For some things parseland is necessary:
Example: When maintaining an FAQ:
Maintaining question and answer mappings in data is cumbersome,
because of additional syntax and not that good human readability.

The best solution would be to put questions and answers into a markdown
file (medium sized file with titles for questions and paragraphs between for answers)
and to parse titles and paragraphs and make them 'question-answer' containers.

Though instead of considering them content - parse - reorder,
we can instead say that a **data extraction** is performed on the content
and if we create a component renderer **question-answer** we could use this DATA
to inflate the component through a normal renderer.

What we need?
- What we want to extract and how?
- Where we want the extracted data to go (component renderer)
- Which component is chosed for which data (how is the data bound and selected)
- Where do we want to fully rendered components to appear

FAQ:
- What: titles and paragraphs -> 



### Prevent branching logic
Instead go for mappings/bindings


### Content centric
Ideally every piece of data can be defined through content
in markdown (reduced rich text format)


#### Structured data:
Data should be readable structured and you should make out how it is defined.
With minimal decoration for data transformation


#### Navigation
---
subrender: 
    urlcomponent: ../example/myurlrenderer.ts
    mdbullet: ../example/markdown-bullet-point-renderer.ts
#nav: filter((item, index) => index < 5 &&  )
---

- ayakraft
    - Über uns >> furl >> navlink
    - Team  >> furl >> navlink
    - overview >> get-all-items >> sort date >> get-items(5) >> urlcomponent

- articles
    - articles >> get-all >> sort date asc >> get-items(8) >> mdbullet

- music
    - Instrumente dec(url="/instrumente") bind('urlcomponent')
    

{{ get('music') | filter(n = 5, date = asc) | bind('urlcomponent') }}
{{ get('overview') | filter(n = 5, date = asc) | bind('urlcomponent') }}

`other layout.ts:`
content >> filter html titles >> select-decendants(level=1) >> furlget >> decorate-with-url

Another example:

- ayakraft
    - Über uns `findurl(this)`
    - [Über uns](`findurl(img.label)`)
    - Über uns `define navtext | mdlink | findurl(navtext)`
    - Team `findurl(this) | create('navlink')`
    - overview `md(this) | create('navlink')`    >> get-all-items >> sort date >> get-items(5) >> urlcomponent
    - overview ``get-tag-items | sort('date') | slice(0,5) | create('navlink') | passprint(`rendered navlink: ${mydefinedvar}`) ``
    - Overview
        - ``get-tag-items('overview') | sort('date') | slice(0,5) | create('navlink') | passprint(`rendered navlink: ${mydefinedvar}`) ``

`yml`
- ayakraft
    - Über uns
    - Team
    - Overview
        tag: 'overview'
        sort: 'date'
        items: [0, 5]
`/yml`




    Evaluate this as pure markdown (no evaluated code just passing the wrapped text to markdown)
    `md`
        ```bash
            echo "I am some markdown code block"
        ```
    `/md`

    `print``[someurl](http://some.com)`

    `tem('mdurl')`
        - [item.name](item.url)
    `/tem`


    `each sortedItems`
        - [`item.name`](`item.url`)
    `/each`

    `import('somelib.ts')`


    `templateEach(sortedItems, mdurl, 'item')`
    `mdurl(sortedItems)`


    `js`
        `print('[someurl](http://some.com)')`
    `/js`


    - Overview
        ```
        function mdTagLinks(tag, amount){
            const tagItems = get-tag-items(tag);
            const sortedItems = sort('date').slice(0,amount || 5);

            sortedItems.map((item) => create('navlink'))
            

            printEach(sortedItems, 
                (item) => {
                    print('-');
                    print(create('navlink', item));
                }
            )

            templateEach('- `create('navlink', item)`', sortedItems)
            templateEach(sortedItems)
                (create('navlink', item))
                ('- item')

            //For small things like this a component is a bit overkill ->
            const outTemplate = compile('- [name](url)')

            '- [name](url)'.compile().mapFor(sortedItems)

            sortedItems.map(outTemplate)

            '- [name](url)'.inflate(sortedItems).io(item, { name, url })

        }

        get-tag-items('overview') | sort('date') | slice(0,5) | create('navlink') | passprint(`rendered navlink: ${mydefinedvar}`) 
        ```

`code`

`endcode`


Even better: Don't bind to 'urlcomponent' yet -> only insert markdown and add calculated data 
and collection data as md decoration.
Through this we can print the compiled markdown formatted content, 
in very human readable form (html is less readable and contains lots of meta information - types of elements/tags - display properties,attributes)
Html is not a pure data format + has lots of explicit semantics that decorate the data without being dependant on it
and would be better added when actually creating the html document (markdown to html render step).



## Generic language decorator ('enhancer'/ inflator)

The markup language (or config or style, etc.) to javascript interface should not be dependant on
the structure and syntax of the markup language.
Through this we can use it for different syntax (yml, json, css, html, markdown, xml)

Plugin for each language, but the runner and scope manager stays the same.
Each plugin adds the way in which inline js is specified (javascript context start/end tokens).
And the specific interface between language syntax and the javascript code.






## Configuration system:

1. Run application
2. Parse arguments
3. Set up configuration defaults (not instantiation yet)
4. Run custom config
5. Instantiate configuration
6. Run 2nd stage config (online Instances can be modified -> prevent monkey patching for non configurable params)
7. Perform target operation

## Runner chain:

At the end of the runner chain the input component should represent html.

Example markdown:
1. Compile to html
2. Resolve html based extended template syntax (njk, ehtml, liquid)
3. Check if there are unresolved features that identify a certain syntax / template language/system
4. If there are repeat at 2. until everything is done

Maybe add a data property:
```
runnerChain: 
compileRunners: md njk ehtml
```

for a file type it should be possible to define a default set of compile chains to use.
maybe don't allow jumping around to different syntax types willfully and instead
enforce usage of pseudo runner components (\<\njk><\md><\yml>) for these uses
(the component/template has to indicate the runner to evaluate a block in, instead of the runners detecting unresolved syntax)


## Imports:
- Enforce import referencing by file name  no matter the platform (ehtml, njk, md, ts)

```
const for = getComponent('for')
for.render(Object.assign({{}, data, it: 'tag', of: 'tagList'}))

renderComponent('for', {it: 'tag', of: 'tagList'} , data)
# should be universal components, that can be used from any platform


```


## Compile Stages:
1. Read in data chain.
    - input = resource identity
    - output = resource, with a buffer to be compiled in resource.content, document type
        (-> info about the extract data chain to use after)
2. Extract data chain. 
    - input = resource with filled content, (possibly explicitly passed input data)
    - output = resource with filled content (any parsed data was removed), data where the parsed properties were added
        (-> info about the compile chain to use after)
3. Compile resource chain:
    - input: resource with filled content and final merged data
    - output: resource with filled content (transformed into different representation) and new data
    (-> info about the chain to use after)
4. Write data chain:
    - input: compiled and rendered resource with filled content, and the data state after full rendering
    - output: send the content buffer or buffer + data to output.

Example: fragment cache --> file writer

- Readers are selected by resource identity match (they store the buffer format in data), or passed specifically
- Extractors are selected based on buffer format match, or passed specifically
- Compilers are selected based on buffer format match, or passed specifically
- Writers: are selected based on compiler format output and data???? 

readers, extractors, compilers and writers should be modifyable by the
resource to be compiled itself by modifying its data.
also should be able to be accessed while compiling (print the data reader, original document, input format, output format, .etc)

```js
{
    content: `
        <data>
            <tags></tags>
        </data>
        <html> i am an html document</html>
    `,
    data: {
        document: {
            src: '/path/to/doc || resourceId'
            inputFormat: 'md'
            outputFormat: 'html'
            target: '/path/to/doc || targetResourceId'
        }
        reader: 'network file',
        extractor: 'md html', //auto selection based on default for a given inputFormat, or based on content (check for '---'/'---', check for '<data>'/'<data>', check for 'export data()'  )
        compiler: 'md html njk', //--> should be inherited by sub components (unless overwritten)
        writers: 'dir file'
    }
}
```

Multi stage detection chain:
{
    canHandle(resource, config)
    process(resource, config): resource;
}

read: 'dir file'
extract: 'multi'


Handling multiplication:
If there is a manager that passes the resource through the chain, 
there needs to be a specific instruction for multiplication, or merging of the resource (at manage level).
Or the control is given to the stages themselves to where to continue (call process detect on each contained document in the case of a directory reader)

Fork data and store the whole resource list in 'content'
the caller can then unpack



TODO: Revamp component interface (force call with "DataParsedDocument and config", possibly expose a ctx with helper functions)


## Component compile flow:

Example:
```
<html>I am a text</html>

<md>
    # Some stuff
    in Markdown

    <njk>
        {{ somevar }}
    </njk>

</md>


```
1. After extracting the data for the document and loading the imports Compiling starts for the html input format
2. Detect that <md> is a top level component and replace with placeholder
```
<html>I am a text</html>
<md-placeholder id="sdiosdgisdgiosdg">
```
3. Render with placeholder (components should not be able to affect the data context of the parent so this should be fine)
4. After this we can look onto "pending compiles" and see that the <md> component was detected but still not rendered
5. Render the body of the md component (with a context/data forked from parent --> "pending compiles" should not be forked
or other properties that are exclusive to the parent)
6. Detect that <njk> is a top level component and replace with placeholder
7. Render <md> body (component should select the 'md' compiler chain for rendering:
`[ 'placeholder', 'md', 'component', 'njk' ]`
- placeholder: should passthrough resource to md without doing anything
- md: should use document with placeholder and transform `md --> html`



1. Render document (after removing sub components)
2. Render placeholders


## High level operation (working on dirs)
When reading a resource the program goes through all the
resource matching options and checks if the 'processing-chain' should handle this resource.
As many paths may be a directory, more specific handlers (files, specific names for resources .etc)
should be first in the list of handler options in the processing stage.

1. When no other things match we can check if the input resource may be a directory. (canHandle)
2. If it is we can read the directorys contents, which would be files and directories.
3. These files and directories can be sent back through the *reader* stage for processing.
(note this would be recursive)
4. More specifically we would also set the 'input' and 'output' paths for those spawned subresources,
based on settings and location of the 'dir' resource


- Read Image
- Compress + rescale + multiply (extract + compile)
- Write images


## Processor attached info
should not be inherited from parent to child!
Needs better scope seperation

# Generic document components:
Add ways to define different component syntaxes
(inflate components in scss, css, ts, client-ts, .etc, xml==html)

```css
@import(./custom-components/*);

@for(it: color, of: colors){
    @if(color === 'blue'){
        body: blue;
        text-style: bold;
    }
}
@placeholder-for();
```
CSS returns css code which is a text format, therefore css components return a string that already evaluated the data to css.

```ts
    function render() {
        () => `Hello world inline from outer typescript component`;

        component('for')(it=color, of=colors)(
            () => component('if')(cond=`color === 'blue'`)(
                () => 'blue'
            )
        )
    }

    component('ts')(
        () => {
            return `Hello world inline nested from typescript nested`;
        }
    )
```
TS should return *ts code to eval* or a *string*??

```json
{
    for: {
        it: "color",
        of: "colors",
        content: {
            0: "Hello World",
            if: {
                cond: "color === 'blue'"
                content: {
                    myResultKey: "myValue"
                }
            },
            if: {
                cond: "color === 'blue'"
                content: {
                    myResultKey: "myValue"
                }
            }
            1: {
                content: {
                    someMore: "data"
                }
            }
        }
    }
}
```
JSON should return *data objects* or a *string*??


## 11ty compat layer

- 11ty merges data by overwriting singular frontmatter variables and merging array variables together
- 11ty provides helper functions and shortcodes everywhere
    --> implement shortcodes and filters (compat needs to provide this.page info to use without changing them)
- Sass compile: not an 11ty feature per se
- Loading *global_data* into the data ctx passed to the renderers
- Load .layout .component 11ty.ts 11ty.js as components with the compat layer
- Asset copy paths --> migrate
- Data parsers = just merge data files/components into *global_data*
- Url postprocessing /Css postprocessing: might be easily convertable, BUT should not be used anyway as it has bad performance
(--> do while compiling the component): or maybe add in highest level parent component the transformer fn
- TS implemented components can be easily converted by just changing the data format, providing global fns, inserting merged data

## Combinatoric functionality
- Components should be easily reuseable (--> provide npm package 'node_modules' search paths for components)
- Make components from 'data' that are injected in the components. any dependencies should be specifically importable
--> which provides the option of only tracking the selected dependencies/data/components and only rebuild if they change.
(as 11ty imports all data as a global item/dependency much of the application is updated when some data/dependency changes)
- Define isomorphic client code: Write code for component inside component or in included file, but add a
browser -> nodejs compat layer, so the client code can be executed on the server and client alike
- Localization Options: 
    - Text sets that are inserted into the document at the correct location,
        - works well for auto translate
        - does not look too good
    - Abstracting structure and wrappings using components and passing in 1 document for each
    language that use that component and pass the local texts to it.
    + **inherit shared data/component functionality** (if only localization changes -> a lot of functionality is shared) (abstract document component)
    + Abstract document: base class components that expose slots to child components to insert data into

- Multi content: provide object for content (with key-value pairs), provide array of strings as content
- Variable defining in html
- Input directory scoped data (should not really be needed --> inherit from defined data = 1 Line more and makes the relationship explicit)
- Rerouting rules -> processors that modify output directory when matching certain conditions

- Blog STD lib:
    - post-index component/grid (example for blog articles)
    - post-table (example for events)
