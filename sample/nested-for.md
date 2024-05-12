---
tags:
- test
- apple
- peach
- markdown
---

<for it="tag" of="tags">
    <hello>
        <span>{{tag}}</span>
    </hello>

    Anything tabbed is treated as a code block in markdown ( -> markdown it escapes the following)

    <if cond="this.tag === 'peach'">
        IF CONDITION MATCHED: I am a fruit: PEACH
    </if>

</for>
