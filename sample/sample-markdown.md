---
index: 59
image: /assets/img/logo.svg
sectionclass: centertext
permalink: false
layout: ./frame.njk

title: Sample markdown test usage compilation
trueval: true

#compileRunner: md njk ehtml
compileRunner: html

tags:
- test
- apple
- peach
- markdown

---

# Lorem Ipsum

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.

[Some url leading to another page](/another-page)

- Some
- More
- Items

**for testing**

## With a second

<hello>
    Hello world from hello world component
</hello>

Heading text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsu

start title insert:
{{ title }}
end title insert

{{ layout }}

<img src="{{image}}" />

<if cond="this.index <= 100">
    <p class="ifyes">
        Hello world from 'if' component
    <p>
</if>

hello

# etwst

<ehtml>
    Test ehtml sub component
</ehtml>

<for it="tag" of="tags">
    <hello>{{tag}}</hello>

    Anything tabbed is treated as a code block in markdown ( -> markdown it escapes the following)
    <if cond="this.tag === 'peach'">
        I am a fruit: PEACH
    </if>

</for>


<ts>
export default () => {
    const typescript: string[] = ["one"];

    return `Complex ts test: ` + typescript[0];
}
</ts>

<ts>
export default () => {
    return `Hellor world from typescript component`;
}
</ts>

=> code
    console.log("test)
<=

Maybe option for parsing top level special blocks

! code
  console.log("test")  
!

