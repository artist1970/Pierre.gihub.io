import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const code=readFileSync(new URL("../pierre-monte-carlo-qa-v1.js",import.meta.url),"utf8");
const qa=JSON.parse(readFileSync(new URL("../knowledge/public-qa.v1.json",import.meta.url),"utf8"));
const approvedDictionary=JSON.parse(readFileSync(new URL("../knowledge/public-dictionary.v1.json",import.meta.url),"utf8"));
function boot(){
 const ctx={window:{}};
 vm.runInNewContext(code,ctx,{timeout:1000});
 const engine=ctx.window.PierreMonteCarloQA;
 const dictionary={status:"ready",lookup(word){
  const record=approvedDictionary.entries.find(x=>x.word===word);
  return record?record.word+": "+record.definition:null;
 }};
 return {engine,dictionary,ask:q=>engine.handle(q,qa.records,dictionary)};
}
test("topic draw uses approved questions and does not repeat before exhaustion",()=>{
 const {engine,ask}=boot();
 const questions=new Set();
 let answer=ask("quiz me on French");
 assert.match(answer,/Question 1 · french:/);
 for(let i=0;i<10;i++){
  const question=answer.split(" Say 'show answer'")[0];
  assert.ok(!questions.has(question),"question repeated prematurely");
  questions.add(question);
  const reveal=ask("show answer");
  assert.match(reveal,/Approved explanation:/);
  answer=ask("got it");
 }
 assert.equal(engine.stats.mode,"knowledge");
 assert.equal(engine.stats.correct,10);
 assert.equal(engine.stats.attempted,10);
 assert.match(ask("stop quiz"),/No learner answers were uploaded or saved/);
 assert.equal(engine.stats,null);
});
test("all 530 published source Q&A records and dictionary words are preserved",()=>{
 assert.equal(qa.records.length,530);
 assert.equal(approvedDictionary.entries.length,6);
 const {engine,ask}=boot();
 assert.match(ask("monte carlo q&a"),/Question 1/);
 assert.ok(engine.stats.pool<=1500);
 assert.equal(engine.stats.pool,527); // every distinct approved question participates in mixed sampling
});
test("open-ended responses are revealed before self-scoring",()=>{
 const {engine,ask}=boot();
 ask("quiz me on English");
 assert.match(ask("got it"),/show answer/);
 assert.equal(engine.stats.attempted,0);
 assert.match(ask("show answer"),/Approved explanation/);
 assert.match(ask("practice again"),/higher chance/);
 assert.equal(engine.stats.attempted,1);
});
test("vocabulary quiz checks actual choice and preserves definition",()=>{
 const {engine,ask}=boot();
 let msg=ask("monte carlo vocabulary");
 assert.match(msg,/Choices:/);
 assert.equal(engine.stats.pool,6);
 const chosen=msg.match(/Choices: ([a-z-]+), ([a-z-]+), ([a-z-]+)\./);
 assert.ok(chosen,"three approved options");
 const response=ask(chosen[1]);
 assert.match(response,/Correct!|Not quite/);
 if(response.includes("Not quite")){
  const follow=ask("show answer");
  assert.match(follow,/Approved answer:/);
 }
 assert.match(ask("stop quiz"),/Practice complete/);
});
test("empty or unapproved topic fails closed with no content invention",()=>{
 const {ask}=boot();
 assert.match(ask("quiz me on made-up science"),/don't have approved Q&A/);
 assert.equal(ask("unrelated greeting"),null);
});
test("no persistent state, raw private exports or remote requests",()=>{
 assert.doesNotMatch(code,/localStorage|indexedDB|fetch\s*\(|XMLHttpRequest|raw\.githubusercontent/);
});

test("missed material is eligible again after four intervening questions",()=>{
 const context={window:{crypto:{getRandomValues(array){array[0]=0;return array;}}}};
 vm.runInNewContext(code,context,{timeout:1000});
 const engine=context.window.PierreMonteCarloQA;
 const ask=q=>engine.handle(q,qa.records,{status:"unavailable",lookup(){return null;}});
 const first=ask("quiz me on French");
 const firstQuestion=first.split(" Say 'show answer'")[0].replace(/^Question \d+/, "Question");
 ask("show answer");ask("practice again");
 let seenAgain=false;
 for(let n=0;n<20;n++){
  const output=ask("next question");
  const same=output.split(" Say 'show answer'")[0].replace(/^Question \d+/, "Question");
  if(same===firstQuestion){seenAgain=true;break;}
 }
 assert.equal(seenAgain,true,"incorrectly reviewed content should return after its cooldown");
});
