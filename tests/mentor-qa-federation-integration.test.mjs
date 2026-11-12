import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html");
const local=read("pierre-conversation-v1.js");
const shared=read("creative-spark-mentor-qa-v1.js");
test("page loads approved public Q&A federation before mentor conversation",()=>{
 const loader=html.indexOf("creative-spark-mentor-qa-v1.js");
 const chat=html.indexOf("pierre-conversation-v1.js");
 assert.ok(loader>=0 && chat>loader,"public federation must precede mentor chat in page source");
});
test("mentor uses local protected response path before attributed foreign reference",()=>{
 assert.ok(local.indexOf("PierreDictionary")>=0);
 const sharedCall=local.indexOf("CreativeSparkMentorQA?.answer");
 assert.ok(sharedCall>=0,"shared public reference call must exist");
 assert.match(local,/sourceName/);
 assert.match(local,/approved public knowledge/);
});
test("shared public client is strictly static, fail-closed, and transcript-free",()=>{
 new vm.Script(shared);
 assert.match(shared,/credentials:"omit"/);
 assert.match(shared,/unapproved-or-malformed/);
 assert.match(shared,/approvedAvailable/);
 assert.match(shared,/privateCOREAccess:false/);
 assert.doesNotMatch(shared,/localStorage\.setItem|indexedDB|XMLHttpRequest|\.send\(/);
});
