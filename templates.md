

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
