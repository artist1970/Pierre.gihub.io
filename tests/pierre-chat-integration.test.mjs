import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../pierre-conversation-v1.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bank=JSON.parse(readFileSync(new URL('../knowledge/public-qa.v1.json',import.meta.url),'utf8'));
function elem(tag='div'){
 const handlers={};
 return {tag,handlers,children:[],dataset:{},value:'',checked:false,textContent:'',scrollHeight:350,scrollTop:0,style:{},
  addEventListener(type,fn){handlers[type]=fn;},
  setAttribute(name,value){this[name]=value;},
  append(...nodes){this.children.push(...nodes);},
  replaceChildren(){this.children=[];},
  focus(){this.focused=true;},
  querySelectorAll(selector){return selector==='.bubble.pierre p'?this.children.filter(x=>x.className?.includes('pierre')).map(x=>x.children.find(c=>c.tag==='p')).filter(Boolean):[];}
 };
}
async function boot({shared=null}={}){
 const names=['message','send','clear','conversation','language','voice','pierre-knowledge-status','pierre-review-opt-in','pierre-review-clear','pierre-review-status','pierre-audio-status','pierre-voice-profile','pierre-volume','pierre-pace','stop-voice','pierre-volume-value','pierre-pace-value'];
 const els=new Map(names.map(id=>[id,elem()]));
 els.get('language').value='en';els.get('pierre-volume').value='80';els.get('pierre-pace').value='0.85';
 const data=new Map();
 const localStorage={getItem:key=>data.get(key)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const document={getElementById:id=>els.get(id)||null,createElement:elem};
 const window={};if(shared)window.CreativeSparkMentorLanguage=shared;
 const context={window,document,fetch:async()=>({ok:true,json:async()=>bank}),localStorage};
 vm.runInNewContext(code,context,{timeout:1000});
 await new Promise(resolve=>setImmediate(resolve));
 return {els,data,get:id=>els.get(id),submit:q=>{els.get('message').value=q;els.get('send').handlers.click();}};
}
function lines(a){return a.get('conversation').children.map(x=>({who:x.children[0]?.textContent,text:x.children.find(n=>n.tag==='p')?.textContent,buttons:x.children.filter(n=>n.tag==='button')}));}
test('page offers opt-in storage, delete control and replay; no hidden private CORE navigation',()=>{
 assert.match(html,/id="pierre-review-opt-in"/);
 assert.match(html,/id="pierre-review-clear"/);
 assert.doesNotMatch(html,/href="https:\/\/github\.com\/artist1970\/CORE/);
 assert.match(code,/Listen to this reply/);
});
test('continuous conversation retains preceding exchanges',async()=>{
 const a=await boot();a.submit('hello');a.submit('thanks');
 const turns=lines(a);
 assert.equal(turns.length,5);
 assert.deepEqual(turns.slice(1).map(x=>x.who),['You','Pierre','You','Pierre']);
 assert.ok(turns[2].buttons.length===1);
});
test('privacy default never queues unanswered questions; opt-in can erase',async()=>{
 const a=await boot();
 a.submit('a purple pineapple glacier kaleidoscope meridian');
 assert.equal(a.data.size,0);
 a.get('pierre-review-opt-in').checked=true;
 a.get('pierre-review-opt-in').handlers.change();
 a.submit('a purple pineapple glacier kaleidoscope meridian');
 assert.equal(a.data.has('pierre.unanswered.review.v1'),true);
 a.get('pierre-review-clear').handlers.click();
 assert.equal(a.data.has('pierre.unanswered.review.v1'),false);
});
test('approved answers remain unique, and follow-ups stay in topic without repeating',async()=>{
 const a=await boot(),expected=bank.records.find(x=>x.question==='What is code-switching?');
 a.submit('What is code-switching?');
 assert.equal(lines(a).at(-1).text,expected.answer);
 a.submit('tell me more');
 const follow=lines(a).at(-1).text;
 assert.notEqual(follow,expected.answer);
 assert.ok(follow.length>35);
 a.submit('tell me more');
 const another=lines(a).at(-1).text;
 assert.notEqual(another,follow);
 assert.ok(!another.includes('Would you like another related question?') || another.length>30);
});
test('Clear resets conversation and topic context',async()=>{
 const a=await boot();
 a.submit('What is code-switching?');
 a.get('clear').handlers.click();
 assert.equal(lines(a).length,1);
 a.submit('tell me more');
 assert.match(lines(a).at(-1).text,/Which language or linguistic topic/);
});
test('Aurora referral points to actual public mentor and avoids private CORE URL',async()=>{
 const a=await boot();a.submit('I would like meditation and mindfulness');
 assert.match(lines(a).at(-1).text,/Aurora\.github\.io/);
 assert.doesNotMatch(code,/AuroraCore\.github\.io/);
});
test('Enter triggers send and Shift+Enter leaves newline available',async()=>{
 const a=await boot(),input=a.get('message');input.value='bonjour';let prevented=false;
 input.handlers.keydown({key:'Enter',shiftKey:false,preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(lines(a).length,3);
 prevented=false;
 input.handlers.keydown({key:'Enter',shiftKey:true,preventDefault(){prevented=true;}});
 assert.equal(prevented,false);
});

test("Pierre consults shared approved lookup and advisory grammar, never private CORE",async()=>{
 const events=[];
 const shared={
  grammar:(text,opts)=>{events.push({text,opts});return {advisory:true,notes:["Check the article before the vowel sound."]};},
  lookup:(word,opts)=>{events.push({word,opts});return word==="abacus"?"abacus: A reviewed counting device.":null;}
 };
 const a=await boot({shared});
 a.submit("check grammar: I saw a apple");
 assert.match(lines(a).at(-1).text,/Check the article/);
 a.submit("define abacus");
 assert.match(lines(a).at(-1).text,/reviewed counting device/);
 assert.equal(events[0].opts.mentorId,"pierre");
 assert.equal(events[1].opts.mentorId,"pierre");
 a.submit("please give me account credential");
 assert.match(lines(a).at(-1).text,/do not share private records or credentials/);
});
