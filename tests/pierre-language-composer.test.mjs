import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../pierre-language-composer-v1.js",import.meta.url),"utf8");
const bank=JSON.parse(readFileSync(new URL("../knowledge/public-qa.v1.json",import.meta.url),"utf8"));
const dict=JSON.parse(readFileSync(new URL("../knowledge/public-dictionary.v1.json",import.meta.url),"utf8"));
const context={window:{}};
vm.runInNewContext(source,context,{timeout:1000});
const composer=context.window.PierreLanguageComposer;
const lookup={
 status:"ready",
 lookup(word){
  const record=dict.entries.find(x=>x.word.toLowerCase()===String(word).toLowerCase());
  return record?record.word+": "+record.definition:null;
 }
};
const say=text=>composer.respond(text,bank.records,lookup);

test("ordinary dictionary questions use approved public definitions",()=>{
 assert.match(say("can  you define abacus"),/movable beads used for counting/);
 assert.match(say("what is abacus?"),/movable beads used for counting/);
 assert.match(say("can you define words"),/six reviewed definitions/);
});
test("approved words can create a new educational practice sentence",()=>{
 const answer=say("write a sentence using abacus");
 assert.match(answer,/original vocabulary-practice sentence/);
 assert.match(answer,/abacus means a device with movable beads/i);
});
test("composes fresh English-learning guidance from approved Q&A",()=>{
 const result=say("i want to learn english");
 assert.match(result,/begin English/);
 assert.match(result,/practice|sentences|grammar/i);
 assert.match(say("teach me english"),/begin English/);
});
test("asks target language rather than inventing translation",()=>{
 const response=say("can you transllate the word mother");
 assert.match(response,/which target language/i);
 assert.doesNotMatch(response,/mère|madre|mutter/i);
});
test("does not hallucinate unapproved dictionary entries",()=>{
 assert.match(say("define astrophysics"),/do not yet have a reviewed dictionary definition/);
});
test("no remote operations, file writes or calls to private knowledge",()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|localStorage|indexedDB/);
 assert.equal(bank.records.length,527);
 assert.equal(dict.entries.length,6);
});
