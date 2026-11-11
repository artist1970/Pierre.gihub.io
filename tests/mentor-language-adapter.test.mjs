import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createContext,runInContext} from "node:vm";
const js=readFileSync(new URL("../creative-spark-mentor-language-v1.js",import.meta.url),"utf8");
const approved={schema:"pierre-public-dictionary-v1",reviewStatus:"approved-public",
 source:{visibility:"public",repository:"artist1970/AIPCore",revision:"reviewed"},
 entries:[{word:"abacus",definition:"A device with movable beads used for counting."}]};
function setup(body=approved,online=true){
 const calls=[];
 const window={fetch:async(url,opts)=>{calls.push({url,opts});if(!online)throw Error("offline");return {ok:true,json:async()=>body};}};
 runInContext(js,createContext({window,console}));
 return {api:window.CreativeSparkMentorLanguage,calls};
}
test("public knowledge loads for Eiren and Pierre without transmitting chat",async()=>{
 const {api,calls}=setup();
 assert.equal(await api.init("eiren"),"ready");
 assert.match(api.lookup("ABACUS",{mentorId:"eiren"}),/movable beads/);
 assert.equal(await api.init("pierre"),"ready");
 assert.equal(calls.length,2);
 assert.ok(calls.every(c=>c.url==="https://artist1970.github.io/Pierre.gihub.io/knowledge/public-dictionary.v1.json"));
 assert.ok(calls.every(c=>c.opts.credentials==="omit"&&!c.url.includes("?")));
 assert.equal(api.capabilities("eiren").aipcorePrivateLexicon,"not-accessible");
 assert.equal(api.capabilities("eiren").aipcoreAuroraV82,"not-loaded");
});
test("grammar is local, advisory and does not fabricate dictionary access",()=>{
 const {api}=setup(undefined,false);
 const result=api.grammar("I saw a apple  today",{mentorId:"eiren"});
 assert.equal(result.advisory,true);
 assert.ok(result.notes.length>=2);
 assert.equal(api.grammar("Hello.",{mentorId:"outsider"}),null);
 assert.equal(api.lookup("abacus",{mentorId:"eiren"}),null);
});
test("unapproved publication fails closed",async()=>{
 const candidate=JSON.parse(JSON.stringify(approved));
 candidate.reviewStatus="pending-editorial-review";
 const {api}=setup(candidate);
 assert.equal(await api.init("pierre"),"unavailable");
 assert.equal(api.lookup("abacus",{mentorId:"pierre"}),null);
});
test("blocked mentor never loads public resources",async()=>{
 const {api,calls}=setup();
 assert.equal(await api.init("noema"),"blocked");
 assert.equal(calls.length,0);
});
test("offline data does not masquerade as the private AIPCore lexicon",async()=>{
 const {api}=setup(approved,false);
 assert.equal(await api.init("eiren"),"unavailable");
 assert.equal(api.capabilities("eiren").publishedWordCount,0);
 assert.equal(api.grammar("Check  spacing.",{mentorId:"eiren"}).advisory,true);
});
