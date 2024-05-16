---
tags:
- test
- apple
- peach
- markdown
somevalue: hello from somevalue
---

<file path="./subdir/hello-file-comp-md.md"></file>

{{somevalue}}

<for it="tag" of="tags">
    
    {{somevalue}}

    The fruit:
    <span>{{tag}}</span>
    was eaten.

    <if cond="this.tag">
        Tag NAME is defined
    </if>
    <if cond="!this.tag">
        Tag NAME is not defined
    </if>

    <if cond="this.tag === 'apple'">
        IF CONDITION MATCHED: I am a fruit: APPLE
    </if>

    <if cond="false">
        <data>
            <somevalue>Trying to shadow somevalue --> does not work as placeholder would need to be replaced before doing data extraction</somevalue>
        </data>
        IF CONDITION MATCHED: This should not be shown (falsy value test)
        {{somevalue}}
    </if>

    <if cond="this.tag === 'peach'">
        IF CONDITION MATCHED: I am a fruit: PEACH
    </if>

    {{somevalue}}

</for>

{{somevalue}}

# Some markdown

- text to be compiled to
- html outputFormat