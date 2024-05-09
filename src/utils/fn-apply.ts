export function getScopedEvalFn(scopeCtx: any, jsScript: string): () => any {
    return new Function(`"use strict"; ${jsScript}`).bind(scopeCtx);
}