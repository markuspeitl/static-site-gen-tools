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



TODO: Revamp component interface (force call with "IProcessResource and config", possibly expose a ctx with helper functions)


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

## Layout content component insertion:

--> name property as `parent` instead of `layout`, as it is more generic, as it does define
a relationship structure instead of naming a visual or semantic arrangement of content.

`parent` for a single parent and
`parents` for multiple parents


#### Options:
1. Insert into parent without compile as plaintext (splitting a document into parts that are assembled)
    --> simple and plain way to build pages
    --> only works if there is no relevant (non structural) data defined in the content document (possibilities are that data is discarded, or 
    that the data is added to the parent context --> basically it is inserted without any scoping of the element/component and
    is effectively equivalent to taking the body and pasting it into the parent)

2. Insert into parent and attach information about how to compile this component/content as a sub component of
the parent. Is inserted as a sub component that needs to be compiled by the parent (maybe compile self to placeholder, and add
compile data to compileAfter and define processing steps to go through for compiling component)
    - Defer compiling of document to parent document
    - Fork scope from parent when compiling

3. Insert into parent and fork subscope. Similar to (2.) but instead of forking the whole scope only request specific properties.
    (Mainly to insulate/isolate contexts only passing the data we need --> this can be used for effective caching later, as we can
    track the requested parent scope properties and only recompile the sub component if they have changed)

Though **Is this even needed** --> why not just inherit instead.
The purpose of defining these relationships in the `parent` -> insert -> `content` way, is to
avoid too much syntax for a common operation.
Blog like SSGs need to be content centric:
1. Create file/document
2. Start writing text & throughts
3. Wire the piece of content into the page and add metadata

Both are needed:
- If we assemble a page and like to keep things compartmentalized by using components for different parts of the page 
then using `parent & content` is unwieldy (we always would need to add the content as a component to some kind of dynamic
collection and then unpacking in the parent or be able to add the component as a variable to the parent scope and the parent
scope just has to `know` the name of the variable using it).
Better is to just import the subcomponent as a component and use it from the parent --> which is more explicit and easier to follow.

- While still providing ways to insert documents as `content` when it makes sense.
Maybe instead of using the content keyword provide more generically `slots` which are ignored if not defined,
and into which content may be inserted if the content defines the `parent` path and the name of the slot to insert into.

When using components, then converting content/component documents to pages becomes an issue, as each piece of content would
need another page component that assembles the html together with the content to form a page.
Which requires either a form a dynamic page creation based on content pieces (eg a component that generates pages out of contents)
or generating one page for each piece of content, utilizing a `parent & content` system, where the page creation is
defined implicitly by the program.


### content-page component
```html
<content-page 
parent="./path/to/parent-frame.html" 
content="./path/to/content.md"
target="content-page.html"
>
</content-page>
```

~~Should provide a `content` slot and read the `slot` property of the content document~~
1. Read `slot` property of content path
2. Insert into the content defined slot in frame component
3. Render assembled frame, set the target file and write to target

The contents of the resources `data` should be irrelevant to the processing pipeline, but
might be relevant to the functionality of specific components, therefore we use
a component `content-page` that reads the data of the target content and
assembles the page based on this data.
If the properties (parents, parent, target, .etc) are passed into the component then those variable are used,
if not then the component attempts to read the properties from the content document.

```html
<data>
   <import path="/content/articlesdir/**.md" as="articles"></import> 
</data>
<article-pages>

    <for it="article" of="articles">
        <content-page>{{article}}</content-page>
    </for>

</article-pages>
```

> How to handle tags?? (a piece of content can have multiple tags)

Need to keep track of compiled resources and their data scopes after compilation.

1. Compile self contained components

``// self == <all-pages></all-pages>``
```html blog-website.html
<data>
   <import path="/article-pages.html" as="article-pages">
        <data>
            <src>./src/content/posts/**.md</src>
        </data>
   </import> 
   <import path="/home-pages.html" as="home-pages"></import> 
   <target>./dist</target>
</data>


<article-pages></article-pages>
<home-pages>
    <data>
        <article-pages>article-pages.pages</article-pages>
    </data>
</home-pages>
```

article-pages.pages === rendered resources/article pages:
```json
[
   {
        "content": "<html><body><h1>I am</h1> a programming article</body></html>",
        "data": {
            "tags": [
                "science",
                "programming",
                "typescript"
            ]
        }
   },
   {
        "content": "<html><body><h1>I think</h1> therefore i am</body></html>",
        "data": {
            "tags": [
                "philosophy",
                "freud",
                "ego"
            ]
        }
   }
]
```

Then we could compile the site by calling:
```
node better-ssg/cli.ts myblog/blog-website.html
node better-ssg/cli.ts default/blog-website.html --src ./myblog
```

This way there is no complete inversion of control to the content document,
as the what happens to it when it is read is not predefined, it simply represents
`data` with which something can be done with (not a page per se).
The page generator is in essence what then reads/compiles and pagifies the piece of content
based on said data.
Though this making a page out of the content is not a program hardcoded operation, but rather
a function of the component that loads and uses the piece of content/data.

That makes the program also easier to follow, as the page document props are not magic
variables that define the control flow.
Instead we can follow the compilation of the whole website incrementally,
where each subcomponent is defined/imported by its parent.


## What can be imported?:
- Components
- Processors??
- Functions in files
- Documents
- Data

Default components should be imported in any case.
(unless a `disableDefaultImports` property is set)

Components should be loaded on demand:
1. Load imported symbols (in that case the file names of detected components in the search dirs)
2. If any of the symbols is detected when compiling resource.content -> detect as subcomponent -> defer compile
3. When compiling components, load any pending/unloaded detected components or get them from cache
4. Compile the subcomponent
5. Replace placeholder with compiled component


## Forking types:
- Full parent fork (while resetting control info):
all data properties of parent are inherited by child and can be use in such.
Problem: Tightly couples parent/child -> when any of the parent data context changes, then the child needs to be recomputed.
(Unless we keep track of what information the child actually accesses of the parent,
like the child is observing some props of the parent and when they change then the child needs to be recomputed)
Probably necessary to manually define the interface of what the child needs of the parent,
as detecting this automatically has many edge cases 
- what happens if the requirements change in code -> incremental compilation
- need to go to deepest child first and recursively collect used parent properties from there, before compiling


### TODO:

Add options for compiling component contents with current syntax and
evaluating the sub subcomponents, BEFORE passing the compiled content
to the component (for example for a frame, as the frame component might not properly
compile subcomponents)

### Navigation compile:
Contains links to compiled pages (based on outpath).
Option:
1. Compile all pages and add template variable for navigation, if applicable
2. Compile navigation based on paths on target directory and its own configuration
3. Replace all pages with pending template variables (in this case navigation) with the compiled pending component

Best to use the navigation component as master component for which source files are compiled and where to.
(If there is no way to reach it there is no need to compile)
Needs partial compile / ping pong compile

1. Start navigation compilation
2. Dispatches compile requests of the sub components/page
3. The pages start compilation, but request a compile of the navigation component (which needs to request the previous instance of the navigation compile request)

Navigation can not be fully compiled, before page input/output paths and meta data are compiled.
And the sub pages can not be fully compiled, before navigation was compiled.

--> Import all subpages into namespaces/arrays/collections, but as `data` which should be evaluated
on import in the navigation data area (during that the input/output paths and meta data of subpages would be initialized),
Then render the navigation entries via the data received from the imports.
```html
<data>
    <import path="./aboutpages/*" as="aboutPagesData" data></import>
    <import path="./eventpages/*" as="eventPagesData" data></import>
</data>

<nav>
    <ul>
        <for it="aboutPageData" of="aboutPagesData">
            <li>
                <img src="{{aboutPageData.image}}" />
                <a href="{{relative(siteRoot, aboutPageData.targetPath)}}">{{aboutPageData.title}}</a>
            </li>
        </for>
    </ul>
    <nav-column>
        {{eventPagesData}}
    </nav-column>

    <nav-column pages="eventPagesData"></nav-column>

</nav>

```


## Component/document data options:
- disableDefaultImports: don't use default imports in document (default import names are not available, or have to be imported explicitly)
- compileContentFirst: compile the content of the page before evaluating components (passing data to component)
- contentFormat: as which format to compile content of the component
- targetPath:
- targetDir: 
- targetRelativeDir:
- targetName:
- outputFormat:
- visible

### Component attr options 
- contentFormat: as which format to compile content of the component


## Iteration/indexing


## Runtime code:
Put through some processors to polyfill component based 
interfaces to the ui.

sample-markdown.style.ts
sample-markdown.style.scss
sample-markdown.style.css
sample-markdown.style.stylus


Imports might need to be resolved.

sample-markdown.control.ts

- Either define through using the same name in the same directory of the component.
- Or define specifically in 'data' the path to the file
- Or when using a ts component add functions marked with a type: (style, .css, .scss) or (.js, .ts) for code behind

Normal .css needs some kind of frontmatter (should be able to import other css sheets)

When compiling a component to be a page, then all style references from the components need to be tracked.
1. Recursively compile all components
2. While compiling a component, locate the style of the component and compile this style
3. Put compiled styles into memory (of the component that targets being a page)
4. When all subcomponents are compiled and are inserted, take all styles and insert
them on top of the page (`<style>` needs to be within the `<head>` tag of the page)

Use same system for adding client side code.
The system should be abstract enough that any additional slots or types of **addon data**
can be defined and compiled.

> The best thing is probably to put a **component** in the head tag of the pages.
This component should then gather access to references to all sub components of the page,
compile their styles and `render` them to a `<style>` tag.
`<collect-style-renderer>`

> The same thing can be done as well when using code behind or component specific client code
`<collect-client-renderer>`

- Might be nice to later move towards migrating the code behind to primarily be isomorphic code.
(we can use platform specific libraries that should be injected into the functions:
like using *cheerio* on node or *jquery* on js, .etc)


Together with the client code we could also define the dependencies, that the code needs
    - in plain ES5 there are no imports everything is global
    - like defining that the code needs *jquery* (automatically insert jquery script tag before the code)
The advantage is that for instance *jquery* would not be loaded of there is no sub component that depends on it.
Often times there is way too much added in the `<head>` tag of a page than actually needed, because seperation can be tedious
and while designing you want all possibilities at your disposal. (for layouts, scripts, .etc)

> Can also be done for meta data (meta data collected from the components frontmatter, or data prop, of the actual article --> title, description, .etc)

`<collect-meta path="">`


## 11ty ts/js template compat to component:
- *layout* property --> Options:
    - Add a virtual wrapper component that assembles layout and content
    - Add a wrapper component which does the assembling operation
    - Automatically import and add the imported component frame around the content, if the layout prop is defined
- *permalink* property: 
    - rewrites the output path: --> just rewrite `resource.data.document.target` to save it to another location
- *tags* property --> mainly for adding rendered results to a collection that is available to other places of the applications
    - leverage the fragment cache to get rendered pages/fragments which can also be filtered based on data
    - the page that is "indexing" the fragments/pages/posts/etc should import and render the sub pages
        1. During data calculation go through all content files/components of a directory
        2. Check the *tags* of every encountered file and select those with the target tag
        3. Render the dependency fragments (or get them from fragment cache if they already exist and did not change)
        4. Add the rendered component `resources`/results to the namespace defined in the dependency definition (`<import>` tag)
        5. Iterate over the list in the namespace and use metadata in the `data` property of the rendered resource to create each index entry (using `<for>`)
- `this` scoped functions
    funtions that are automatically wrapped and information about the current page and content is added to the function when called
    --> simulate through using special components/functions instead

- global data --> general config data in `_data` that is injected globally into every component/template used on the site
(currently -> import data as `global_data`, which should add it to the current scope, which is then inherited by sub components)


## Importing existing rendered

### Programming posts index example
```html
<data>
    <import path="./mydirectory/**" as="programmingposts" rendered>
        <where>
            <i>data.tags.includes('programmingpost')</i>
        </where>
    </import>

    <import path="./post-page-renderer"></import>
</data>

<body>

    <post-page-renderer out="programmingposts" src="{{srcdir}}/that/dir/posts/**" target="{{distdir}}/reldistdir/path/">
        <where>
            <i>data.tags.includes('programmingpost')</i>
        </where>
    </post-page-renderer>

    <tagged-pages tag="programmingpost" out="programmingposts" src="./content" target="./programming/"></tagged-pages>

    <tagged-article-index tag="programmingpost" src="./content" target="./programming/">
        Compiles the pages for target `tag` and 
        renders an index with `for`
    </tagged-article-index>

    <div id="prog-index">
        <for it="programmingpost" of="programmingposts">
            <article>
                <img src="{{programmingpost.data.image}}" />
                <h2>{{programmingpost.data.title}}</h2>
                <p>{{programmingpost.data.description}}</p>
                <summarize>{{programmingpost.content}}</summarize>
                <url root="{{distdir}}" path="{{programmingpost.data.document.target}}">Read more ...</url>
            </article>

            <!-- Alternatively use a component-->
            <index-article data="{{programmingpost}}">

            <!-- Alternatively bind local context-->
            <ctx bind="programmingpost.data">
                <img src="{{image}}" />
                <h2>{{title}}</h2>
                <p>{{description}}</p>
            </ctx>

        </for>
    </div>
</body>
```

`<where>` contains conditions applied to the `resource` that must match in order to be selected for 
the import.

Probably best to only compile the pages at compile time and return a namespaced variable
containing the rendered page resources as a local variable.
Then things like `<where>` can be implemented as a function of the component.

The only advantage of the `data` and `rendered` properties when `<import>`ing 
components, is that a explicit component rendering statement at the top of
the compile body is not necessary then.


Example top level site component/home page:

`home.page.component.html`
```html

<data>
    <import>../../default/html-page-imports.ts</import>
    <import>../../default/nav-page-imports.ts</import>
    <import path="./content/sections/**" as="sections"></import>
</data>

<page-contents target={{distdir}} as="rendered-page-bodies"/>

<!--When we need a component once and that component is not dependant on being loaded in 'data' then
it makes sense to load it in the same instruction where it is needed-->
<some-custom-component importFrom="./path/" />

<html>
    <head>
        <default-viewport />
        <fav src="./assets/myicon.svg">
        <page-style>./home.page.scss</page-style>
        <scripts>./home.scripts.js</scripts>
        <meta data="this"></meta>
    </head>
    <header>
        <top-navigation as="top-navigation"></top-navigation>
    </header>
    <body>
        <sort list="sections" by="data.index"></sort>
        <for it="section" of="sections">
            {{ section.content }}
        </for>
    </body>

    <grid-footer as="bottom-footer">
        <nav-set path="footer-nav-items.json"></nav-set>
        <logo type="large">{{logo_path}}</logo>
        <newsletter-sub></newsletter-sub>
        <social-icons><social-icons/>
        <legal-info-bar><legal-info-bar/>
    </grid-footer>
</html>

<!--Navigation in the sub pages depends on all pages being rendered, when wanting to automatically generate navigation items/urls-->
<!--Therefore we need to insert it later-->
<!--<resolve-navs pages="rendered-page-bodies" nav="top-navigation"><resolve-navs/>-->

<resolve-variable in="rendered-page-bodies">
    <navigation>{{top-navigation.content}}</navigation>
<resolve-variable/>

<resolve-variable in="rendered-page-bodies">
    <footer>{{bottom-footer.content}}</footer>
<resolve-variable/>
```

```bash
# Pass 'data' overrides via CLI
cli.ts -srcDir ./page -targetDir ./dist/page home.page.component.html
#or: src and target dir can be defined within the 'home page component'
cli.ts ./page/home.page.component.html

#'running-shorter' is the name of the specific site
cli.ts -dataPath ./page/home.running-shorter.data.html ./page/home.page.component.html
#While components can be costructed very abstract and reuseable, the specified data might be very different
# depending on the specific data of the page (title, general layout, .etc)
# therefore the parent/caller of a component should be able to override a components data and/or specify a new
# path to load the data from
```

# Themes:
Make assumptions about the data structure of a page,
like in particular a blog/cms like structure, with tags/categories, a navigation to different pages and page indices,
a footer, links, .etc.
As bssg is mostly website structure and purpose agnostic, we can not apply a theme.
To do this we can 
- define/provide mutliple generic components and tools for building a blog from content pages and website data.
- a website creator can then use those components/tools to build a blog by mainly only providing content/media and data
(navigation tags/pages, website author/domain/name/title) and defining the base structure of the site
(defining a main website frame and the home page)
- To define a theme these default components/tools can be overwritten by modified (inherit original) or rewritten versions
(the theme should basically be a script that modifies the startup or initialization config)

The simplest theme would be simply to use the default provided components and override their
styles to have a different visualization.
The most non technical user friendly way to do this would be to style every default theme component with an
*external* styling file and give the user an opportuning to define one (or multiple) *theme* directories,
in which you can place files that 'mask' the original ones.
(Later maybe a way to inherit from the orginal styles).

This directory can then be simply packaged and distributed as an npm package.
This package can then be installed and to use this theme we can
simply add the themes directory to our 'themeDirs' configuration prop.
`typeof themeDirs: local_relative_path | local_absolute_path | node_modules_relative_path`

Node modules theme path and local relative theme path, should be the **same**,
you should be able to easily replace a local with a npm version.

(Though it would also be really cool to be able to define a `remote_git_url`, `remote_theme_json_url` so that if you have built
a page with any bssg theme and you want to try out different looks on YOUR own page, you simply add the *remote url* to your themes
and recompile --> you can rapidly try out the options on your own page/data that you intend to use).
Uninstalling a theme is as simple as removing the `themeDirs` entry from your config.

+ Theme package creation and publishing should be streamlined:
Provide scripts that are as easy as:
`npx bssg init-theme ./path/to/theme` --> interactive polling of package meta data
`npx bssg publish-theme ./path/to/theme`
`npx bssg install-theme somelocalorremotetheme` --> would be nice to add itself automatically to the config


## Minml
A concise way to write common html structures:

```html
?data

?

?meta
    title: hello world
?

#1 Hello one

/p #my-item .this-class .other-class
    /p
        Hello
    /p
/p

/p
$my-item 
.this-class
.other-class
    /p
        Hello
    /p
/p

/=div
    /
        #p
            Hello from nested div
        #p
    /
/

/p 
arrval: one two three
arrval: one,two,three
singval = one two three
singval = test
    > I am the content of /p block
/p

/p 
    > Hello i am a multi line
    > text that contains line breaks
    > and escapes characters like /p ? >
/p

/p 
    > Hello i am a single line broken \
    > into multiple lines \
    > just like you would in programming \
/p

/1 Title of my site:

//h sub title of my site:

Escape identation util block start
()

-   /p 
        > Hello i am a line

        #Comment for some notes

        /p
            sub paragraph
        /p

        /img 
        style=width:100% height:auto
            https://domain.com/img.png
        /img


        > into multiple lines \
        > just like you would in programming \
    /p

/img 
    src> test.png
    > content attribute stored next to text
/img

?script

?

```
- no html and body tag -> .minml extension already says how it is to be interpreted (as html)
- data & visualization:
    - head, script and other tags are interpreted as data and not displayed
    - visualization are displayed or structural elements: div, body, p, .etc
- semantically important whitespace (indentation)
- `"` tokens for denoting start and end of id or class value, are unnecessary (id only single word allwed)
- Different tokens for rendered/structural and data/info/functionality blocks
- Array values are parsed until next semantic token OR untile end of line
- HTML is in XML format which is primarily a data transfer and storage format
and therefore does not fit writing display documents in visual language very well
- Every special token at the start of the line has meaning
- Attributes are essentially named content -> why is there a distinction

```html
/img
    /src test.png
    /style
        width: 100%
        height: 200px
    /p
        hello world
    /p
    > hello text node
/img
```

To really make the dev experience shine, the blocks could be color coded in the editor.


## 11ty compat notes
1. Use dir or glob reader to read all files of an eleventy 'content' dir and send them down the chain
2. Send all detected files/dirs through the data extractors
(extract frontmatter data as clean data to be pretransformed and get unresolved 'content')
    - Data extraction on a dir needs a compat layer or implementations (probably useful to have in normal bssg as well)
3. Compile the rest content to an ehtml format containing the layout components as a wrapper
4. Modify output path by using the permalink data property
5. Send the document back starting again from the compiler stage (should compile just like a usual bssg component)
6. Should compile the component and write like usual

Requirements:
- The IO chain needs to be visible to the component (get the parent directory resources and their properties through the `parent` property)
inject as data.page.inputPath and data.page.outputPath in compat layer
- Global data needs to be available (use reader+extractor stage to get global data and make sure it is merged before handling the 11ty content dir)
-> `_data` dir should be treated like it would be a (virtual) parent of the input directory
- Parse and convert shortcodes/helpers to internal functions (can probably be passed to njk compiler, or be transpiled to bssg components altogether)
- compiled "layout" paths need to be properly resolved -> add 'includesDir' to import resolve paths or, pass variable through config and handle by tranpiler

- templateFormats -> basically use a selection mechanism of what file is sent through the compile chain and what not
- htmlTemplateEngine -> manipulating the compile chain to compile html files with this 'compiler' 
first -> should be more general mechanism to select what is treats as what format or by which compiler type/format chain
- markdownTemplateEngine -> manipulating the compile chain to compile md files with this 'compiler' first

## Auxilirary 11ty fns
- assets -> use bssg platform mechanism for now and exclude during bssg compile run
- plugins -> the only thing i am using additionally is 'eleventy-sass' -> (re)write own .scss compiler
- shortcodes -> most currently defined shortcodes are not worth reusing -> convert to the *functional* component system of bssg
- include/exclude -> just add include + exclude paths to bssg ( = simple)
- (data)-parsers -> essentially handled by 'extractor' stage targets registered in the processing tree
- ~~extensions~~ -> is what file extension 11ty should treat as alias for other extensions -> this might be useful in bssg as well -> trivial to implement
- transforms -> = postprocessing -> in bssg this is essentially inbuilt by adding targets to the format specific compilers
(maybe add some helper fns that simplify that management)
--> todo refactor current 11ty fns to not be dependent on globaldata and not dependent on the `page` variable
and all of this data can be extracted from the result resource chain (with .parent property)