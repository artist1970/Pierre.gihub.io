import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("../pierre-practice-studio-v1.js",import.meta.url),"utf8");
const bank=JSON.parse(readFileSync(new URL("../knowledge/public-qa.v1.json",import.meta.url),"utf8"));
const dict=JSON.parse(readFileSync(new URL("../knowledge/public-dictionary.v1.json",import.meta.url),"utf8"));
function setup(){
 const c={window:{}};
 vm.runInNewContext(source,c,{timeout:1000});
 const lookup={lookup(word){const e=dict.entries.find(e=>e.word===word);return e?e.word+": "+e.definition:null;}};
 return {studio:c.window.PierrePracticeStudio,lookup};
}
test("six reviewed words each support three varied grammatical practice sentences",()=>{
 const {studio,lookup}=setup();
 assert.equal(studio.supportedWords.length,6);
 for(const word of dict.entries.map(e=>e.word)){
  const results=Array.from({length:3},()=>studio.handle("write a sentence using "+word,lookup));
  assert.equal(new Set(results).size,3,word);
  assert.ok(results.every(x=>x.includes(word)),word);
 }
});
test("repeat requests retain only the current session word",()=>{
 const {studio,lookup}=setup();
 const first=studio.handle("write a sentence using abacus",lookup);
 const second=studio.handle("another example",lookup);
 assert.notEqual(first,second);
 studio.reset();
 assert.equal(studio.handle("another example",lookup),null);
});
test("practice language and vocabulary prompts are responsive and local",()=>{
 const {studio,lookup}=setup();
 assert.match(studio.handle("practice English conversation",lookup),/short English conversation/);
 assert.match(studio.handle("another dialogue prompt",lookup),/because/);
 assert.match(studio.handle("practice vocabulary",lookup),/sentence, ability, or abacus/);
 assert.match(studio.handle("more vocabulary practice",lookup),/speech, structure, or abstract/);
});
test("unapproved word requests are not treated as approved dictionary definitions",()=>{
 const {studio,lookup}=setup();
 assert.equal(studio.handle("write a sentence using astrophysics",lookup),null);
 const denied={lookup(){return null;}};
 assert.match(studio.handle("write a sentence using abacus",denied),/not currently available/);
});
test("no network, storage, private repository access, or canonical bank modifications",()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|localStorage|indexedDB|raw\.githubusercontent/);
 assert.equal(bank.records.length,527);
 assert.equal(dict.entries.length,6);
});

test("quiz checks learner choices and advances to the next practice word",()=>{
 const {studio,lookup}=setup();
 studio.handle("practice vocabulary",lookup);
 assert.match(studio.handle("ability",lookup),/Not quite/);
 assert.match(studio.handle("sentence",lookup),/Correct/);
 studio.handle("more vocabulary practice",lookup);
 assert.match(studio.handle("structure",lookup),/Correct/);
 studio.reset();
 assert.equal(studio.handle("ability",lookup),null);
});
