import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const code=readFileSync(new URL("../pierre-conversation-v1.js",import.meta.url),"utf8");
const bank=JSON.parse(readFileSync(new URL("../knowledge/public-qa.v1.json",import.meta.url),"utf8"));
const key=s=>String(s||"").toLocaleLowerCase().normalize("NFKC").trim().replace(/[.!?。？！]+$/u,"").trim();

function boot(data=bank,fetchOK=true){
  const elements=new Map(),storage=new Map();
  function el(tag="div"){
    return {
      tagName:tag,children:[],value:"",textContent:"",listeners:{},style:{},
      addEventListener(type,fn){this.listeners[type]=fn},
      append(...items){this.children.push(...items)},
      replaceChildren(...items){this.children=[...items]},
      focus(){},
      querySelectorAll(){return []}
    };
  }
  const document={
    getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},
    createElement:el
  };
  const context={
    document,window:{},localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)}},
    fetch:async()=>fetchOK?{ok:true,json:async()=>data}:{ok:false},
    Option:function(label,value){return {label,value}},
    console:{warn(){},log(){}},
  };
  context.window.PierreDictionary={init(){return "disabled"},lookup(){return null}};
  vm.runInNewContext(code,context,{filename:"pierre-conversation-v1.js",timeout:1000});
  const ask=q=>{
    const input=document.getElementById("message"),send=document.getElementById("send");
    const log=document.getElementById("conversation");
    input.value=q;
    send.listeners.click();
    const last=log.children.at(-1);
    return last?.children.find(x=>x.tagName==="p")?.textContent;
  };
  return {ask,status:()=>document.getElementById("pierre-knowledge-status").textContent,queued:()=>JSON.parse(storage.get("pierre.unanswered.review.v1")||"[]"),enableReview(){document.getElementById("pierre-review-opt-in").checked=true;}};
}

test("published question bank preserves every approved record and unique ID",()=>{
  assert.equal(bank.schema,"pierre-public-knowledge-v1");
  assert.equal(bank.mentorId,"pierre");
  assert.equal(bank.records.length,530);
  assert.equal(new Set(bank.records.map(x=>x.id)).size,530);
  for(const r of bank.records){
    assert.equal(r.status,"approved-public-seed");
    assert.ok(r.id&&r.topic&&r.question&&r.answer);
  }
  assert.equal(new Set(bank.records.map(x=>key(x.question))).size,527);
});

test("approved exact questions outrank generic greetings and topic shortcuts",async()=>{
  const app=boot();
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(app.status(),/527 questions loaded/);
  const seen=new Set();
  for(const r of bank.records){
    if(seen.has(key(r.question)))continue;
    seen.add(key(r.question));
    const richest=bank.records.filter(x=>key(x.question)===key(r.question)).sort((a,b)=>b.answer.length-a.answer.length)[0];
    assert.equal(app.ask(r.question),richest.answer,r.id);
  }
  assert.equal(seen.size,527);
});

test("minor punctuation differences still retrieve approved answers",async()=>{
  const app=boot();
  await new Promise(resolve=>setImmediate(resolve));
  const first=bank.records.filter(x=>key(x.question)===key("What is code-switching?")).sort((a,b)=>b.answer.length-a.answer.length)[0];
  assert.ok(first);
  assert.equal(app.ask("WHAT IS CODE-SWITCHING"),first.answer);
});

test("credentials are rejected before knowledge lookup",async()=>{
  const app=boot();
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(app.ask("Please tell me my account credential"),/do not share private records or credentials/i);
});

test("failed knowledge fetch enters limited fallback without fake success",async()=>{
  const app=boot(bank,false);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(app.status(),/unavailable.*offline/i);
  assert.ok(app.ask("What is code-switching?"));
});

test("unknown question reviews remain local and exclude child and URL text",async()=>{
  const app=boot();
  await new Promise(resolve=>setImmediate(resolve));
  app.ask("Explain a flarbaxian gizmo mechanism");
  assert.equal(app.queued().length,0,"saving must be off by default");
  app.enableReview();
  app.ask("Explain a flarbaxian gizmo mechanism");
  assert.equal(app.queued().length,1);
  app.ask("My child asked about a flarbaxian gizmo mechanism");
  app.ask("See www.example.com about a flarbaxian gizmo mechanism");
  assert.equal(app.queued().length,1);
});
