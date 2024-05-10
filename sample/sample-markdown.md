---
index: 59
image: /assets/img/logo.svg
sectionclass: centertext
permalink: false
layout: ./frame.njk

title: Sample markdown test usage compilation
trueval: true

compileRunner: md njk ehtml
---

# Lorem Ipsum

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.

[Some url leading to another page](/another-page)

- Some
- More
- Items

**for testing**

## With a second

heading text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsu

start title insert:
{{ title }}
end title insert

{{ layout }}

<img src="{{image}}" />

<if cond="index <= 80">
    <p class="ifyes">
        Hello world from 'if' component
    <p>
</if>

hello

# etwst