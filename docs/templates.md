

# Main types of templates:
- Typescript, Javascript (basically the same as typescript)
- HTML (basically static html framents, as html itself does not have templating capabilities)
- Extended HTML (basically HTML but using custom tags for templating representing components and layouts)
- Nunchucks, Handlebars, Ejs, .etc
- JSON: (basically represents an html document with its dom tree as json) (useful as an exchange format)
- YAML: same as JSON

Each type has its own handler:

When specifying a layout of a content piece we can select 
non typescript templates by using the respective handler.
The layout property denotes a function call instead of a static layout reference

Example:
---
layout: njk.ts ./my-nunchucks-layout
layout: njk.ts resolveLayoutPath("some-layout")

layout: ehtml.ts

compiler: ehtml
compiler: njk
compiler: ejs
compiler: ts
---

> There also should be the option to use multiple layouts:
> Example: Use a piece of content to compile a section that can be inserted somewhere else + 
> make a full page out of the content

Specifying the extension should be optional.
Ideally every layout is unique.
And there is not redundancy

---
tags:
- page
- section
---


Handlers / template compilers should be typescript/javascript scripts at their core

## Hierarchy

Hierarchy of dependencies is important:

- Dependency tree hierarchy:
Each component might have sub components and one or several parent layouts.
    - Denotes how they are connected, when one component changes each piece of compiled content that depends on any component up the hierarchy needs to be updated (sub components do not need to be).
    - Content changes -> recompile this piece of content
    - Layout changes -> recompile any piece of content that uses this layout directly or indirectly

- Data dependency:
    - When a piece of data changes then all contents that depend on that data directly or indirectly need to be recompiled
    - 

### Recursive recompilation:
- It should be possible to do incremental compilations that continue until there is nothing left to resolve.

So if we render a component and resolve the sub components, the rendered component might contain more 
variables of components to resolve, meaning these newly created vars/components need to resolve as well in
order for the full render to finish.

- In the same way resolving a sub component might be delayed until it was compiled.
Keep track of pending compilations and their dependencies.

### Data
It should be possible to finely define dependant data:
example: a *navigation* component might depend depend on
a certain 'menu' keyvalue pair in a main a "global" config json file.

Therefore this component ONLY needs to be recompiled when the data in this key changes
(instead of recompiling any component that accesses anything from the global config)

We need to keep track of what data a component needs.
In its simplest form ALL data is passed in when rendering, in this case we do no need to track dependant data as its state does
not "change".

Dependecies could also be detected by scanning the component and figuring out where that data is located,
how to obtain it.
Then at runtime the render can emerge when all dependant data (and that needed to render sub components) becomes available.

Better way of data propagation (compared to "eleventyComputed" which makes the content file incompatible with normal style data passing, and
introduces unnecessary boilerplate, much better would be to just use template syntax, which would be more natural:
template syntax marks data to be "inserted" so it would make sense to "insert" data into the frontmatter in the same manner)

### Automatic html customization:
When using ts/js it should be easy to inject modifications into the layout or into sub components
(through frontmatter or passed arguments),

like: 
- tags used
- attributes of any html elements
- removal (white out) of certain attributes
- wrapping contents

this way reusing more of the components becomes possible

### Proper data encapsulation

Data should be encapsulated and local (having all data available globally causes
several issues, example: 11ty data cascade)
If it is needed it should be passed down from its source through the top level layout.

### Component encapsulation

A component always transforming into html should be able to hold any data or properties
that relate closely to its data, behaviour, style, structure.

It should be possible to define component related style, scripts and data through additional
render functions for these parts.

Then they can be combined if needed.
This way we can make sure to not have data, assets, style and scripts on a page that would not even have
that component.
Further through this we can much easier only recompile what was changed.

### Fragment cache
Every component that gets compiled is written to disk, and can be
read in order to use it in other components.
The pages are essentially assembled from these fragments in a way while keeping track of when they become available.

To only recompile a component when it changed we keep track of the state of the renderer iteself by hashing
the rendering code, and at the same time keep track of the data that was used by the renderer to render
the component.
This way we can simply sort and hash passed parameters or variables passed into the component 
and store this information as well when writing the fragment.
Then we can skip rerendering the component and read straight from disk.
This way only components that have really changed are rerendered.

We can easily apply the same principal to pages as well, only moving them to the sites dist when they have changed.

In order for this to work efficiently the data interface to the component renderer needs the be well defined and
ideally only unpack/set as dependency the data needed.
(Otherwise we may unpack a global config json, only really need 1 value from there, but because the dependency is not well defined
the component is rerendered each time there is any update to the config file)


### Single page render

The architecture should be good enough so we could theoretically call rendering on every single page or content file seperately
and still not need a lot more time to finish rendering.

### Dynamic rendering

Then when 'single page render' or 'single fragment' render works we can easily dynamically render pages and
update contents on client request (not "really" supported by 11ty as it is rather inefficient and does not fare well with small changes
because of aggressive usage of global state, making optimizations very difficult to implement).

With this pages can also be rendered on demand only, effectively reducing development time manyfold.

### Specific
11ty "reserves" the full directories you give it.
Much better would be only to pass into the SSG what you really want to be compiled and leave the rest alone.
This way you can also exclude test files or different things without having to explicitly 
exclude them (and therefore match them somehow)
This way does not go well when using other tools and sharing responsibility for manipulating the input files.

### Deferance
Some rendering or manipulation should be able to be deferred to different tools or script,
while still taking advantage of the internal state and internal transformations of the
SSG: like fragment cache, file watching, data dependency, component dependencies

### Using as library
This way there is a reference to the instance which can be directly manipulated
(not possible with programs that have configuration only and are not "supposed" to be modified directly
-> only gives access to functionalities for which there is a configuration option for -> you are at the mercy
of the developer of whether you can change, modify or fix something -> or you have to straight out fork the project yourself
and install you modified version afterwards, which takes a lot of maintenance)



## Why?
Because hexo and 11ty lied to me about the simplicity, performance and customizability of their software,
causing me spending many many hours fixing bugs, creating workarounds, reading their code and patching functions
in order to use functionalities which i would expect from nodejs SSGs.

In particular 11ty says its very fast and customizable, but i found that to be untrue.
11ty does tons of unnecessary operations, as it can not figure out data flow and cross dependencies, because of the focus global data in its design.
(From what i heard the philosophy is just import/pull the functionality you need in, its just javascript, which creates a mess of an dependancy graph,
which might be fine if only 11ty would have a primary functional architecture, which makes customization easy and has a clear flow of data, which for 11ty is not the case)
It also mostly rebuilds almost everything on a change which can take dozens of seconds for around on or two hundred pages.
When trying to do live development and using for instance sass as a means to styling the page, this is simply unacceptable, as margins paddings, .etc
needs frequent small changes for optimization of the layout and waiting 15seconds each time for the build to finish is infeasable.

It also copies all assets on each build, regardless if they have changed or not.
It just is quite heavy on resources. It is not hard to check if a file has changed before overwriting it and abusing the disk with unnecessary
write cycles and write time (which on good machines is slower than reading and hashing it + comparing the hashes).

I know that in software you often trade performance for the simiplicity and stableness of a program,
but 11ty is not simple, as these are bad tradeoffs that were made.

Regardless of this 11ty also does a lot of things right, but for me personally it is not worth the trouble as
for me as a developer, it is mostly painful to use, especially when comparing it to existing and much more bloated
frameworks like angular or when considering that what eleventy does is not very complex and if
i knew beforehand that i would have to invest so much time in patching and finding specific solutions for 11ty then i would
have started a custom solution, or used Svelte/Vue, etc straight away.

Pure javascript kind of sucks as a framework language, as it does not provide much in terms of documentation itself
and code is very frequently very messy.
Its not bad per se, but in most cases it is used very badly, because you CAN use it very messy, with lots of 
shorthands, chaining, lacking variable names, excessive nesting, .etc
especially if the dev in question has no experience in statically typed programming languages.
Compared to that well written typescript with lots of functions and good long names is almost self documenting.

The callbacks and functions for Custom Templates are so minimal that plugin authors have to resort to
monkey patching functionality and patches into 11ty in order to make their plugin work,
which creates several problems:
- Using multiple plugins that patch 11ty might cause inconsistencies and incompatibilities
- Interface Changes in 11ty can trigger plugins to cease working, as such changes are not sure to be backwards compatible (and much less likely at that than specific configuration
and determined/interfaced functionality)
- Monkey patches are generally hard to read and can only be really understood functionality wise when digging the related code in the tool (11ty)

There also is insufficient state management in 11ty that would determine when and after what template/layout another template/layout is rendered.


## Minimal implementation:
- Compilers: md, html, ts
- Frontmatter: layout
- Data: input data

Layout:
Going up and down the dep tree



## Content centric authoring:
1. Create a file
2. Start writing text straight away
3. Add meta data and context on where on the page the content should be inserted and how it should be prepared/compiled

Advantages:
- Minimal time from idea to writing content
- More "natural" - free thought flow
- Meta and context data in terms of the page (layout, context) can be added later and does not have to be considered straight away

Disadvantages:
- Can get a bit tricky:
Example: Navigation can depend on many pages and when dynamically generating the navigation based on the created pieces of content/pages
and the navigation is inserted on all pages -> then we need to recompile all pages once the navigation changes
(performance can be mitigated with a fragement cache and proper data encapsulation though -> only navigation needs to be recompiled and the
pages need to be reassembled from existing fragments)
- Data flow annoying to deal with in programming context. (data defined in content is sent through the layout chain and ends back in the content piece,
while data is collected with too big scope -> problem with optimizing and automatizing steps)

## Layout centric authoring
1. Create a document
2. Create the structure of the component
3. Add text while also creating structure and controlling/specifically passing data flow through the layout/component chain

Advantages:
- Data is passed from parent to child -> content pieces can be as lean as possible, the parent is responsible for controlling the
data flow and deciding when to update the child (and when to reuse the fragment cache)
- Easier to optimize, as it follows the abstract and hierarchical nature how code is usually structured

Disadvantages:
- Takes longer until you can start writing text
- Data always flows from the top level layout to deepest child component (where a lot of semi global data would accumulate if not properly filtered and scoped
and encapsulated)

### Conculsion
To properly encapsulate functionality into small units you need a layout centric approach, and the
content based approach becomes insufficient.
(When looping over compiled elements and inserting them into a page, this needs to be able to reference the compiled components as an element in the layout
document)

11ty hacks around this by using collections -> these collections are available globally in all layouts and documents and hold compiled
elements based on content tags.
Therefore abusing global data to simulate a layout like content iterative inflation.
However this is not done properly as in the way it is implemented there is not way to wait for the correct inflation of the content.
Example: you can not reference the 'template' in the collection in a certain stage/state which causes many problems.
You see the layouts are not treated separately from the deepest content piece from which it originated from.
Therefore you can not make sure that the last layout of the layout chain was inflated before inserting
the component in another layout -> therefore you can not encapsulate properly.
The data and content of a document is treated to same as the data and content of the layouts, there is not seperation,
instead the data and content is simply merged or overwritten when the layout inflates.
(a gift of the so called data cascade -> which is a trendy term for saying -> global state that collects everything on the way and provides it everywhere)


### The question
is how to reference and insert fragments, and how to make sure that each of the fragments exists and was compiled to the correct state before inserting.

#### Angular
- Make inserting content components easy by using a `<router-outlet></router-outlet>` tag to hold dynamic sub components
- Each component provides a custom tag `<app-navigation></app-navigation>` that represents specific sub components,
the data for which is either passed through the html document or through the associated code (after getting a reference to the view component)
- Multiple sub components are created using the `*ngFor=` directive or through component code, iterating over the data needed for
rendering and handling the component and passing it to the respective specific component, through html.
As `ngFor` iterates over a collection, the data passed to the component is very specific.
- Styles and other assets may be component encapsulated and bundled after compilation (11ty is anti bundling, preventing it from accessing any of the
possible optimizations and ssg conveniences of such functionality)

The resulting software should not be as extensive as angular and not provide a way of doing things that is *that* generic, SSG
is a specific solution domain after all, in which using angular would result in way too much bloat and boilerplate
(it is a generic dynamic web application framework after all, which is not static compilation and needs to implement complex
bindings and change detection/handling only updating the components that change and nothing else.
In SSG we do not need to same granularity and extensive feature set)

#### Angular features for SSG
- Router outlets are a great idea (not need to string concatenate the passed content) = shorthand for concatenation
- Specific custom components are a must
- Some kind of `for` loop is necessary: maybe refer to a collection of items in the fragment cache 
and filter by compilation state/stage level and filter by certain data properties and
just insert all the fragements that fit the criteria
(Each compiled fragment should have data associated with it that can be accessed from a parent)
- `if` statements are easy to do, evaluate based on local state, or based on state of the sub fragment


# Properties:
- All content pieces have a path ( = fragment cache )
- Some pieces have a specific public facing path (those with routes that are supposed to be accessed)
- Content first approach (each content leaf document defines how it is assembled from itself and from other layouts/components)
- Each layout defines how it is assembled from itself and from other layouts/components
- Content docs naturally inherit dependencies from its layout and can add more or change assembling information
- Layouts and Components are the same -> the only difference is that the layout uses its content, so if we do not use
the content -> it is a component -> if we would pass content this content would be swallowed (treated exactly the same)
- Contained change/updates: Only affected fragments should be updated and already fully compiled parts should be reused,
detect exactly which data affects which views and update only these parts.
- Components are a chance to define data scope and when they update.
- Components are updated/rerendered fully if the associated data changes. (Most granular change/recompile/update level)
to optimize performance -> create more components for cohesive units


# What to store in fragment cache and what not:
- When the input path changes --> recompile ( we can add the input path into the `dataCtx` or maybe making it an automatic
property of the document frontmatter data)

- When the output path changes we still want to cache to be effective (output path should not be stored in fragment cache,
do we even need it during compilation??)

# Dependency loops
There might be loops in dependencies that need to be iterated looped through until they are resolved.
example:
1. collect all leaf documents in a dir without subdependencies
2. walk the layout up rendering the base layout head and header and navigation
3. Write each compiled document to output path
4. The navigation items might depend on those output paths


# In place development server:
As our tool can do dynamic html creation, we can always use local
relative paths in the SRC directory.
Then we can dynamically create pages based on those src paths, while
in development mode, without writing the actual target pages.

- Then in the production build we can copy the file to the target directory.
- Another option for production would be to dynamically build on demand and keep everything in memory
(compiled pages, reduced and pre processed assets)
- A cache dir would also be possible in order to reduce memory footprint and delay


# Data flow:
From where does the data flow to what destination and in what order.

Idea: treating the content file as something like the data portal where all data
for rendering this fragment comes from.

Question: in which direction should the data flow first?
1. Option: flow to layouts first and then continue at sub components:
if any important additional data is created fetched or otherwise in the
content file's layout, which would be relevant for the 
content file itself or its sub components.
(for a simulated top -> down approach injecting the data first at the top element letting it bubble down to the content file and sub components)
-> when the layouts are rendered, the content does not exist yet
    - pending content
    - data flow needs to work just the same even if nothing was rendered (no dependency on sub components data and on rendering is necessary)

2. flow to sub components first
data defined in the content piece is used to render sub components.
This can become an issue if sub components depend on any state of the layout in the same chain.

3. Option: portal
the content document explicitly defines what data it needs and where it comes from and there are not
other data fetches or pulls or injections into the data in the layouts or other components that
affect the state of data, or the rendering.
Through that definition we can select the input data in a way that it is encapsulated to that
single page itself.

# Data pre parsing:
parse data recursively before doing any amount of rendering.
This way rendering decisions can be made before rendering.
(pages that have a disable flag are not rendered, dynamic navigation data can be created
from the source content files, before rendering all the pages with such data/ a navigation on each page)

In order for this to work, data manipulation and rendering have to be strictly
seperated.
compiling -> is readonly
data -> read and write

(data is not allowed to be changed while rendering in this case)


# Race conditions:
in some cases it would be possible that on aspects of a component depends on a partial state of itself.
Then document compilation can not be resolved as there is a cyclic dependence resulting in no document being able to be compiled.
Example:
A piece of content, has the page as a layout, which has a navigation subcomponent.
We only add pages to the navigation that have been successfully created/rendered, but as this navigation
is inserted one every 'page' even on the current one to be created from the component,
this creates a cyclic condition.

# Dynamic static hybrid:
1. Prerender all fragments/component unit, but no pages
2. Render the semi dynamic components flagged as last and in the order in which they are flagged (navigation, sidebar)
3. When there is a request for a site -> assemble the parts to a page
4. Save the assembled page


# Content piece IDs:
for inserting the content piece in another page and
making a dependency to that content piece explicit (A depends on B to be rendered).

+ Add way to reference different stages/layouts of the render (reference the fragments)




# Ehtml, Ecss, component-manifest, edata and ts controllers

Clear seperation of concern (server rendering):
- ehtml: Providing view and markup and being generally read only on the data
- edata: providers for models and source data from various locations (local files, apis, databases)
- ts controllers: translate data to a viewable format and apply data transformations/merging/etc
- component-manifest: assets sources and meta data
(maybe where an asset will be stored and where it is acquired from -> like which url the associated component resolves the
asset to on the output site)

ecomponents: Combine all these concepts the view dom is written in ehtml, which
get the data to be displayes from the ts controller which transforms the data into a
viewable or evaluateable format.
The controller can define ehtml, ecss and data dependencies.


# Data types:
- objects: serializable and encapsulated data units containing data for a complex element or complex operations
- assets: images, video, audio and other media - usually binary files that however are displayed:
eg. anything that can not be serialized or deserialized in *readable* format by nature.
(the associated view depends on them)
Assets often require additional meta information in order to be displayed in html as a unit:
alternative text, style, resolutions


# TODO:
- On demand loading of modules, layouts, runners:
they should only be loaded into the cache the very first time they are needed.
Also only load the defaults the first time they are needed.
In order for this to work we need to hardcode the default associations between
a runner activate condition and the location of the associated default runner for files matching this condition
