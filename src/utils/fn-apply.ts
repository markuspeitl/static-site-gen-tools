export function getScopedEvalFn(scopeCtx: any, jsScript: string): () => any {
    return new Function(`"use strict"; return ${jsScript}`).bind(scopeCtx);
}