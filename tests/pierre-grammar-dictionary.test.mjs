import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const grammarCode=readFileSync(new URL("../pierre-grammar-guide-v1.js",import.meta.url),"utf8");
const adapterCode=readFileSync(new URL("../pierre-dictionary-adapter-v1.js",import.meta.url),"utf8");
const grammarContext={window:{}};
vm.runInNewContext(grammarCode,grammarContext,{timeout:1000});
const grammar=grammarContext.window.PierreGrammarGuide;

test("grammar guide only handles explicit requests",()=>{
 assert.equal(grammar.explain("What is French syntax?"),null);
 assert.match(grammar.explain("grammar check: a apple"),/an apple/);
 assert.match(grammar.explain("grammar check: an university"),/a university/);
 assert.match(grammar.explain("grammar check: a hour"),/an hour/);
 assert.match(grammar.explain("grammar check: a honest person"),/an honest person/);
 assert.match(grammar.explain("grammar check: The cat sleeps."),/does not prove/);
});

function adapterFixture(payload){
 const storage=new Map();
 const root={
  location:{href:"https://artist1970.github.io/Pierre.gihub.io/",origin:"https://artist1970.github.io"},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}
 };
 const context={
  window:root,URL,
  fetch:async()=>({ok:true,json:async()=>payload})
 };
 vm.runInNewContext(adapterCode,context,{timeout:1000});
 return {adapter:root.PierreDictionary,storage};
}
const approved={
 schema:"pierre-public-dictionary-v1",reviewStatus:"approved-public",
 source:{visibility:"public",repository:"artist1970/Pierre.gihub.io",revision:"synthetic-test-only"},
 entries:[{word:"syntax",definition:"The organization of words in sentences.",partOfSpeech:"noun",synonyms:["sentence structure"],antonyms:[]}]
};
test("approved same-origin synthetic dictionary loads with provenance",async()=>{
 const {adapter}=adapterFixture(approved);
 assert.equal(await adapter.init("knowledge/test-dictionary.json"),"ready");
 assert.equal(adapter.size,1);
 assert.match(adapter.lookup("SYNTAX"),/organization of words/);
 assert.match(adapter.lookup("syntax","synonyms"),/sentence structure/);
});
test("private or unreviewed dictionary exports fail closed",async()=>{
 for(const data of [
  {...approved,reviewStatus:"pending"},
  {...approved,source:{...approved.source,visibility:"private"}},
  {...approved,entries:[approved.entries[0],approved.entries[0]]}
 ]){
  const {adapter}=adapterFixture(data);
  assert.equal(await adapter.init("knowledge/test-dictionary.json"),"unavailable");
  assert.equal(adapter.size,0);
 }
});
test("external AIPCore private URL is blocked before fetch",async()=>{
 const {adapter}=adapterFixture(approved);
 assert.equal(await adapter.init("https://raw.githubusercontent.com/artist1970/AIPCore/main/dictionary/letters/A-words"),"blocked");
 assert.equal(adapter.size,0);
});
test("missing dictionary URL remains disabled without modifying the chat",async()=>{
 const {adapter}=adapterFixture(approved);
 assert.equal(await adapter.init(""),"disabled");
 assert.equal(adapter.size,0);
});
