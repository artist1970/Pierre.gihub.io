/* Pierre · offline-first public language mentor. No remote API and no saved messages. */
(() => {"use strict";
const input=document.getElementById("message"), send=document.getElementById("send"), clear=document.getElementById("clear"), log=document.getElementById("conversation"), language=document.getElementById("language"), voice=document.getElementById("voice");
if(!input||!send||!log)return;
let records=[],status="loading";
const topics={french:["french","français","bonjour"],spanish:["spanish","español","hola"],german:["german","deutsch"],mandarin:["mandarin","chinese","tones"],japanese:["japanese","hiragana","katakana"],arabic:["arabic","عربي"],russian:["russian","русский"],phonetics:["phonetic","ipa","speech sound"],phonology:["phonology","phoneme"],morphology:["morpholog","morpheme"],syntax:["syntax","word order"],semantics:["semantics","meaning"],pragmatics:["pragmatic","context"],translation:["translate","translation"],dictionary:["dictionary","definition"],thesaurus:["thesaurus","synonym","antonym"],accent:["accent","pronunciation"],listening:["listening","hear"],conversation:["conversation","speaking","speak"],grammar:["grammar"],culture:["culture","custom"],assessment:["assessment","mastery","80%"],writing:["writing","write"],"code-switching":["code switch","bilingual"],etymology:["etymology","origin of word"],"language families":["language family","related languages"],register:["formal","informal","register"],voice:["voice","listen aloud"],privacy:["privacy","save my chat"],identity:["who are you","your name"]};
const greetings={fr:"Bonjour ! Je suis Pierre. Comment puis-je vous aider ?",es:"¡Hola! Soy Pierre. ¿Qué te gustaría aprender?",de:"Guten Tag! Ich bin Pierre. Was möchten Sie lernen?",zh:"你好！我是皮埃尔。你想学习什么？",ja:"こんにちは！ピエールです。何を学びたいですか？",ar:"مرحباً! أنا بيير. ماذا تود أن تتعلم؟",ru:"Здравствуйте! Я Пьер. Что вы хотите изучить?",en:"Hello! I'm Pierre. We can explore languages, grammar, pronunciation, and the art of communicating."};
const fallback="A useful place to begin is your goal. Which language or linguistic topic are you exploring, and would you prefer an explanation, examples, or a practice exercise?";
const normalize=s=>String(s||"").toLocaleLowerCase().normalize("NFKC").trim();
fetch("knowledge/public-qa.v1.json").then(r=>{if(!r.ok)throw Error("index");return r.json()}).then(d=>{if(d.schema!=="pierre-public-knowledge-v1"||!Array.isArray(d.records))throw Error("schema");records=d.records.filter(x=>x.status==="approved-public-seed"&&typeof x.answer==="string");status="ready"}).catch(()=>{status="offline-fallback"});
function answer(raw){const s=normalize(raw).slice(0,1200);if(!s)return "Write a question or select a language above.";
if(/^(hello|hi|hey|bonjour|hola|hallo|привет|你好|こんにちは|مرحبا)[!. ]*$/u.test(s))return greetings[language.value]||greetings.en;
if(/(password|api key|secret|private student|account credential)/i.test(s))return "Please do not share private records or credentials here. I can help with a general language question without personal details.";
const direct=records.find(r=>normalize(r.question)===s);if(direct)return direct.answer;
const topic=Object.keys(topics).find(t=>topics[t].some(k=>s.includes(normalize(k))));if(topic){const r=records.find(x=>x.topic===topic);if(r)return r.answer;}
if(s.includes("thank"))return "You're welcome. Languages reward curiosity and regular practice. What shall we explore next?";
return fallback;}
function append(who,text){const div=document.createElement("div");div.className="bubble "+(who==="You"?"you":"pierre");const b=document.createElement("span");b.className="speaker";b.textContent=who;const p=document.createElement("p");p.textContent=text;div.append(b,p);log.append(div);log.scrollTop=log.scrollHeight;}
function submit(){const q=input.value.trim();if(!q)return;append("You",q);append("Pierre",answer(q));input.value="";input.focus();}
send.addEventListener("click",submit);input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}});
clear.addEventListener("click",()=>{log.replaceChildren();append("Pierre",greetings[language.value]||greetings.en);input.value="";});
language.addEventListener("change",()=>append("Pierre",greetings[language.value]||greetings.en));
if(voice)voice.addEventListener("click",()=>{if(!("speechSynthesis" in window)){append("Pierre","Speech synthesis is not supported by this browser.");return;}const last=[...log.querySelectorAll(".bubble.pierre p")].at(-1);if(!last)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(last.textContent);u.lang=language.value==="zh"?"zh-CN":language.value;u.rate=.82;window.speechSynthesis.speak(u);});
append("Pierre",greetings.en);
})();