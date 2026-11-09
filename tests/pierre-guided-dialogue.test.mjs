import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../pierre-guided-dialogue-v1.js",import.meta.url),"utf8");
const front=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const conversation=readFileSync(new URL("../pierre-conversation-v1.js",import.meta.url),"utf8");
function boot(){
 const root={};vm.runInNewContext(source,{window:root},{timeout:1000});
 return root.PierreGuidedDialogue;
}
test("Pierre responds to the actual friendly conversation rather than a generic goal fallback",()=>{
 const d=boot();
 assert.match(d.handle("hello pierre how are you"),/Bonjour/);
 assert.match(d.handle("i have been busy building"),/What have you been building/);
 assert.equal(d.state.active,false);
});
test("practice please launches a specific scaffold instead of repeating the default fallback",()=>{
 const d=boot();
 assert.match(d.handle("practice please"),/Write one complete sentence/);
 assert.equal(d.state.active,true);
 assert.equal(d.state.stage,0);
});
test("subject, action, setting and reason advance a three-stage story sentence activity",()=>{
 const d=boot();d.handle("practice please");
 assert.match(d.handle("I built a small model."),/add a setting/i);
 assert.equal(d.state.stage,1);
 assert.match(d.handle("I built a small model in my studio."),/add a reason/i);
 assert.equal(d.state.stage,2);
 assert.match(d.handle("I built a small model in my studio because I love science."),/practice is complete/i);
 assert.equal(d.state.active,false);
});
test("missing grammar features elicit useful hints and do not award progress",()=>{
 const d=boot();d.handle("practice please");
 assert.match(d.handle("purple"),/someone or something and an action/i);
 assert.equal(d.state.stage,0);
 d.handle("I wrote a story.");
 assert.match(d.handle("I wrote a story."),/where it happened/i);
 assert.equal(d.state.stage,1);
 assert.match(d.handle("hint"),/place/i);
});
test("suggestion begins an exercise, with stop and reset",()=>{
 const d=boot();
 assert.match(d.handle("suggest something for me please"),/small creative-writing challenge/i);
 assert.equal(d.state.active,true);
 assert.match(d.handle("stop practice"),/leave the exercise/i);
 assert.equal(d.state.active,false);
 d.handle("practice again");d.reset();
 assert.equal(d.state.active,false);
 assert.equal(d.handle("purple"),null);
});
test("explicit subject requests are not swallowed by active practice",()=>{
 const d=boot();d.handle("practice please");
 assert.equal(d.handle("quiz me on French"),null);
 assert.equal(d.state.active,false);
});
test("page loads guided module before chat, which calls guided handler before fallback",()=>{
 const guided=front.indexOf('<script src="pierre-guided-dialogue-v1.js"></script>');
 const chat=front.indexOf('<script src="pierre-conversation-v1.js"></script>');
 assert.ok(guided>0 && chat>guided);
 assert.ok(conversation.indexOf('window.PierreGuidedDialogue?.handle(raw)')>0);
 assert.match(conversation,/window\.PierreGuidedDialogue\?\.reset\?\.\(\)/);
});
test("no storage, network, private CORE or external model calls in the guided module",()=>{
 assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|\bfetch\s*\(|XMLHttpRequest|CORE\/|terminal\/|api\.openai\.com/);
});
