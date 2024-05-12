---
tags:
- test
- apple
- peach
- markdown
---

<for it="tag" of="tags">
    
    The fruit:
    <span>{{tag}}</span>
    was eaten.
    

    <if cond="this.tag === 'peach'">
        IF CONDITION MATCHED: I am a fruit: PEACH
    </if>

</for>

# Some markdown

- text to be compiled to
- html outputFormat