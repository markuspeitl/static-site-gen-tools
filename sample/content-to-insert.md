---
#parent: './frame-to-wrap.html'
#plainInsert: false
#Insert into frame as plaintext without compiling first
#wrapComponent: null 
# or example 'md' -> wrap with component when inserting -> For instance insert as plainText, BUT wrap with 'md' to basically defer compile of the markdown to
# the sub component compile step of the parent (will inherit variable state of the parent this way)

parents:
    './my-parent.html':
        plainInsert: false
        wrapComponent: 'md'
    './my-parent2.html':
        plainInsert: false
        wrapComponent: 'md'

import: './frame-to-wrap.html'

testprop: Hello world

---

<p>Before frame wrap</p>

<frame-to-wrap root='div' compile-first>
    ### Hello Content

    Hello world from content
    to be inserted into 
    './frame-to-wrap.html'

    - One
    - Two
    - Three

</frame-to-wrap>

<frame-to-wrap>

    <md>
    ### Hello Content

    Hello world from content
    to be inserted into 
    './frame-to-wrap.html'

    - One
    - Two
    - Three
    </md>

</frame-to-wrap>

<p>After frame wrap</p>