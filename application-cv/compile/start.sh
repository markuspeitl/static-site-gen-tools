#!/usr/bin/env sh

script_dir=$(dirname "$0")
document_root="$script_dir/.."

#Usually like this
#npx ts-node "$document_root/../cli.ts" "$document_root/index.md" "$document_root/dist/index.html"

#Alternative (we do not need content so this should be workable)
npx ts-node "$document_root/../cli.ts" "$document_root/assembled-cv.ehtml" "$document_root/dist/index.html"

cd ../dist || exit

npx http-server & firefox http://localhost:8080
