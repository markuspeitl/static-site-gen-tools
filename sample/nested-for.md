---
tags:
- test
- apple
- peach
- markdown
- test
- apple
- peach
- markdown
- test
somevalue: hello from somevalue
---

<data>
    <testprop>My value</testprop>
</data>

<if cond="false">
    Non Truthy if - before anything else --> if this shows there is something wrong
</if>


{{somevalue}}

<for it="tag" of="tags">
    
    ------------------------S

    Current tag: "<span>{{tag}}</span>"

    <if cond="this.tag">
        <p>Tag NAME is defined</p>
        <if cond="this.tag">
            If nested in if
        </if>
    </if>
    <if cond="!this.tag">
        Tag NAME is not defined
    </if>

    <if cond="this.tag === 'apple'">
        IF CONDITION MATCHED: I am a fruit: APPLE
    </if>

    <if cond="false">
        <ehtml>
            <data>
                <somevalue>Trying to shadow somevalue --> does not work as placeholder would need to be replaced before doing data extraction</somevalue>
            </data>
            IF CONDITION MATCHED: This should not be shown (falsy value test)
            {{somevalue}}
        </ehtml>
    </if>

    <ehtml>
        <data>
            <somevalue>Shadow somevalue for sub component</somevalue>
        </data>
        SOMEVALUE: {{somevalue}}
    </ehtml>

    <if cond="this.tag === 'peach'">
        IF CONDITION MATCHED: I am a fruit: PEACH
    </if>

    E------------------------

</for>

<if cond="this.somevalue">
    Truthy if 1
</if>
<if cond="this.somevalue">
    Truthy if 2
</if>
<if cond="this.somevalue">
    Truthy if 3
</if>
<if cond="this.somevalue">
    Truthy if 4
</if>
<if cond="false">
    Non Truthy if 5
</if>


{{somevalue}}
# Some markdown

- text to be compiled to
- html outputFormat