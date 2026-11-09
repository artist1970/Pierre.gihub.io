import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../pierre-conversation-v1.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bank={schema:'pierre-public-knowledge-v1',mentorId:'pierre',records:[]};
function element(tag='div'){
 const listeners={};
 return {tagName:tag,listeners,children:[],value:'',textContent:'',dataset:{},style:{},disabled:false,
  addEventListener(type,fn){listeners[type]=fn;},
  append(...items){this.children.push(...items);},
  replaceChildren(...items){this.children=[...items];},
  setAttribute(name,val){this[name]=val;},
  focus(){},
  querySelectorAll(selector){
    if(selector!=='.bubble.pierre p')return [];
    return this.children.filter(x=>String(x.className||'').includes('pierre'))
      .map(x=>x.children.find(y=>y.tagName==='p')).filter(Boolean);
  },
  get scrollHeight(){return this.children.length*80;},scrollTop:0};
}
async function boot(initialVoices){
 const elements=new Map(),storage=new Map(),spoken=[];
 const names=['message','send','clear','conversation','language','voice','pierre-knowledge-status','pierre-voice-profile','pierre-voice-select','pierre-voice-preview','pierre-volume','pierre-pace','stop-voice','pierre-volume-value','pierre-pace-value','pierre-audio-status','pierre-review-opt-in','pierre-review-clear','pierre-review-status'];
 for(const id of names)elements.set(id,element());
 elements.get('language').value='en';elements.get('pierre-pace').value='0.85';elements.get('pierre-volume').value='80';
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 let voices=initialVoices,changed=null;
 const speechSynthesis={getVoices:()=>voices,addEventListener:(type,fn)=>{if(type==='voiceschanged')changed=fn;},cancel(){},speak(utterance){spoken.push(utterance);}};
 function SpeechSynthesisUtterance(text){this.text=text;}
 const window={speechSynthesis,SpeechSynthesisUtterance,localStorage};
 const document={getElementById:id=>elements.get(id)||null,createElement:element};
 vm.runInNewContext(script,{window,document,localStorage,SpeechSynthesisUtterance,fetch:async()=>({ok:true,json:async()=>bank})},{timeout:1000});
 await new Promise(resolve=>setImmediate(resolve));
 return{get:id=>elements.get(id),spoken,storage,replaceVoices(list){voices=list;changed?.();},send(q){elements.get('message').value=q;elements.get('send').listeners.click();}};
}
const voices=[
 {name:'Arthur',lang:'en-GB',voiceURI:'arthur',localService:true},
 {name:'Samantha',lang:'en-US',voiceURI:'samantha',localService:true},
 {name:'Amélie',lang:'fr-FR',voiceURI:'amelie',localService:true},
 {name:'Monica',lang:'es-ES',voiceURI:'monica',localService:false}
];
test('voice dropdown replaces locked profile and includes preview control',()=>{
 assert.match(html,/id="pierre-voice-select"/);
 assert.match(html,/id="pierre-voice-preview"/);
 assert.match(html,/Automatic · Arthur preferred/);
 assert.doesNotMatch(html,/locked narrator voice/);
});
test('every browser voice appears with language and device/service indicator',async()=>{
 const a=await boot(voices);const options=a.get('pierre-voice-select').children;
 assert.equal(options.length,voices.length+1);
 assert.match(options[0].textContent,/Automatic/);
 assert.match(options[1].textContent,/Arthur · en-GB · device/);
 assert.match(options.at(-1).textContent,/Monica · es-ES · browser\/service/);
});
test('manual French voice selection overrides English fallback and supports per-reply playback',async()=>{
 const a=await boot(voices);const picker=a.get('pierre-voice-select');
 const item=picker.children.find(x=>/Amélie/.test(x.textContent));
 picker.value=item.value;picker.listeners.change();
 a.send('hello');
 const replay=a.get('conversation').children.at(-1).children.find(x=>x.tagName==='button');
 replay.listeners.click();
 assert.equal(a.spoken.at(-1).voice.name,'Amélie');
 assert.equal(a.spoken.at(-1).lang,'fr-FR');
 assert.equal(a.storage.size,1);
 assert.match(a.get('pierre-voice-profile').textContent,/Selected: Amélie/);
});
test('voice preview speaks in selected voice and automatic mode restores language matching',async()=>{
 const a=await boot(voices),picker=a.get('pierre-voice-select');
 picker.value=picker.children.find(x=>/Monica/.test(x.textContent)).value;picker.listeners.change();
 a.get('pierre-voice-preview').listeners.click();
 assert.equal(a.spoken.at(-1).voice.name,'Monica');
 assert.match(a.spoken.at(-1).text,/Hola/);
 picker.value='auto';picker.listeners.change();
 a.get('language').value='fr';
 a.get('pierre-voice-preview').listeners.click();
 assert.equal(a.spoken.at(-1).voice.name,'Amélie');
});
test('late voice loading refreshes options and missing choice falls back safely',async()=>{
 const a=await boot([]);let picker=a.get('pierre-voice-select');
 assert.equal(picker.children.length,1);
 a.replaceVoices(voices);
 assert.equal(picker.children.length,5);
 picker.value=picker.children.find(x=>/Samantha/.test(x.textContent)).value;picker.listeners.change();
 a.replaceVoices([voices[0],voices[2]]);
 assert.equal(picker.value,'auto');
 assert.match(a.get('pierre-audio-status').textContent,/unavailable/);
});
test('voice preference contains only voice identity, not conversation or personal data',async()=>{
 const a=await boot(voices);
 a.send('my story about a secret garden');
 const picker=a.get('pierre-voice-select');
 picker.value=picker.children[2].value;picker.listeners.change();
 assert.deepEqual([...a.storage.keys()],['pierre.public.voice-choice.v1']);
 assert.doesNotMatch([...a.storage.values()][0],/secret garden/);
});
