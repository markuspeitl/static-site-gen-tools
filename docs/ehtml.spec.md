## Ehtml spec

Its valid html :O

## ECss spec

# Goals
Goal is to provide valid css and html (or rather xml if not quite up to html spec) that can be processed by common parsers,
that do not need any extension to do ehtml or ecss processing.

eHtml is easy as we can use custom html `<app-text></app-text>` tags,
and custom attributes just fine without breaking the spec.
We also could add pseudo elements for structural directives.

```html


<collection-list type="component">
<!-- alternative:-->
<e-component name="collection-list">

    <ehtml-for><ehtml-for/>
    <e-for data-it="item-data" data-map="my-collection">
        <h1>
            <item-data title />
        </h1>
        <p>
            <item-data description />
        </p>
        <p>
            <item-data content />
        </p>
        <my-collection 0 appendix />
    </e-for>

</collection-list>
```

Might be a bit more work to define than vanilla html, but it is valid html
and provides data binding.
As it is perfectly valid html it is easy to parse and not bound to any specific platform.
Only the structural directive define extended behaviour.

The compiler/inflater can be made really easy and depend on a html parser.
The simpler and extensibler it is the better.

### Compared to react/angular complex logic in the html is not allowed.
Only simple getting and setting of data in the code behind
(Should be non interactive for now -> code executes and prepares the data -> ehtml accesses the state/variables of the data script
and implodes/inflates elements based on this data)
(It is not supposed to be a client side language where iteractivity between gui and data is needed, this functionality can still
be provided by other client scripts or frameworks)

--> when the data changes the whole frament/defined ehtml for that data updates instead of granular changes.
(It can however be made more reactive to data changes, by abstracting the more dynamic parts of the page that require
frequent updates into their own respective components)

Operations necessary in view:
- `if`
- `for` - iterating an array or iterating the keys of an object
- data access + property access + array item access
- (optional) `walk` - walk the object and create elements on each fork or each leaf based on some conditions
- binding - some kind of component binding based on conditions,
binding is almost always superior to explicit branching, and sub elements can be added and removed
without modifying the template itself (only some "data -> component" associations need to be defined)

```html
    <e-for data-it="item-data" data-map="my-collection">
        <item-data bind="getComponent(itemData)" />
        <item-data bind="rich-item-component" />
    </e-for>

    <e-for data-it="item-data" data-map="my-collection">
        <e-bind bind-prop="item-data.type" bind-map="typeToComponentNameDict" data="item-data"></e-bind>
        <e-bind bind="typeToComponentNameDict[item-data.type]" data="item-data"></e-bind>
    </e-for>

```

`bind="null"` or `bind="undefined"` would leave the component removed
the `data` property defines which data is passed into the component that was bound to.
The better the data binding capabilities the less `if-else` directives are needed.

