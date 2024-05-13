---

import: 
- ./components/*

---
<data>
    <import path="./components/*" />
</data>


![Portrait of Markus smiling](./assets/profile.jpg)

# Markus Peitl, BSC.

<!-- app-pairs-to-list-placeholder -->

<pairs-to-list tag='span' token=': ' root-tag='div' class='card-info-grid'>

Email: office@markuspeitl.com  
Mobile: +436602094318  
LinkedIn: https://www.linkedin.com/in/markuspeitl/  
Birthday: 01.04.1995  
Address: Rienößlgasse 16/2/1, 1040 Wien
Some other: Property

</pairs-to-list>

<no-render>

How to remove components from document before rendering with runner and adding them 
back afterwards.
The runner selected for the file should not render the component
(that should be done by the component itself)
Some compile backends might heavily modify the body of the components (markdown-it escapes html characters),
which results in teh components not getting the correct data as written in the document.

To fix this:
1. When compiling a document, scan the document for components (which are **always** in html tag format, apart from 'ts' which can render components directly))
2. Then save the subDocument/component body/representation to memory and replace detected components by placeholder strings that should
be unaffected by the current document compiler
- Option 1 -- comment
```html
<!-- app-pairs-to-list-placeholder -->
```
- Option 2 -- curvy
```html
{{ app-pairs-to-list-placeholder }}
```
- Option 3 -- html tag
```html
<pairs-to-list-placeholder />
```
3. Render the document (might do data state updates)
4. Render the sub components from memory
5. Replace the placeholders in the document
6. Finish compile run (write, pass through, .etc)

Detection and removal needs to happen after every compile run in order to handle dynamically created or deferred components.
(Can be implemented by either adding functionality to the generic runner, or by adding an abstract base class
for the runners, that can snapshot and resolve html denoted components)

An abstract component would also be useful for data and import prep.
As currently the importCache is only created in html-runner.

Later maybe generalize components: Currently it is assumed that components always return html formatted data.

Issue:
When using multiple instances of certain components, we need to be able to identify the
component usage/call from the placeholder.
(Maybe hash content and attributes and use as id)

</no-render>