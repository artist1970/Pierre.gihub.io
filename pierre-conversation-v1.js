/* Pierre · offline-first public mentor. Unanswered questions can be locally queued for private review; no remote submission. */
(() => {"use strict";
const input=document.getElementById("message"), send=document.getElementById("send"), clear=document.getElementById("clear"), log=document.getElementById("conversation"), language=document.getElementById("language"), voice=document.getElementById("voice");
if(!input||!send||!log)return;
let records=[],status="loading";
let activeLanguage="";
const pendingKey="pierre.unanswered.review.v1";
function queueUnanswered(question){
  const cleaned=String(question||"").trim().slice(0,250);
  // Do not collect free-text questions that may include identifying or sensitive details.
  if(cleaned.length<8||/(@|https?:|www\.|\b(?:password|api.?key|secret|token|address|phone|email|student|child|minor|medical|diagnosis|therapy|health|social.security|credit.card|born|birthday|live at|my name is|my daughter|my son)\b)/i.test(cleaned))return;
  try{
    const now=Date.now(),ttl=7*24*60*60*1000;
    const raw=JSON.parse(localStorage.getItem(pendingKey)||"[]");
    if(!Array.isArray(raw))return;
    const items=raw.filter(x=>x&&x.schema==="mentor-unanswered-v1"&&Number.isFinite(Date.parse(x.capturedAt))&&now-Date.parse(x.capturedAt)<ttl);
    const normalized=cleaned.toLocaleLowerCase().normalize("NFKC");
    if(items.some(x=>String(x.question||"").toLocaleLowerCase().normalize("NFKC")===normalized))return;
    items.push({schema:"mentor-unanswered-v1",mentorId:"pierre",question:cleaned,status:"pending-local-review",capturedAt:new Date(now).toISOString()});
    localStorage.setItem(pendingKey,JSON.stringify(items.slice(-50)));
  }catch{/* Private mode or quota: fail closed. */}
}
const topics={french:["french","français","bonjour"],spanish:["spanish","español","hola"],german:["german","deutsch"],mandarin:["mandarin","chinese","tones"],japanese:["japanese","hiragana","katakana"],arabic:["arabic","عربي"],russian:["russian","русский"],phonetics:["phonetic","ipa","speech sound"],phonology:["phonology","phoneme"],morphology:["morpholog","morpheme"],syntax:["syntax","word order"],semantics:["semantics","meaning"],pragmatics:["pragmatic","context"],translation:["translate","translation"],dictionary:["dictionary","definition"],thesaurus:["thesaurus","synonym","antonym"],accent:["accent","pronunciation"],listening:["listening","hear"],conversation:["conversation","speaking","speak"],grammar:["grammar"],culture:["culture","custom"],assessment:["assessment","mastery","80%"],writing:["writing","write"],"code-switching":["code switch","bilingual"],etymology:["etymology","origin of word"],"language families":["language family","related languages"],register:["formal","informal","register"],voice:["voice","listen aloud"],privacy:["privacy","save my chat"],identity:["who are you","your name"]};
const greetings={fr:"Bonjour ! Je suis Pierre. Comment puis-je vous aider ?",es:"¡Hola! Soy Pierre. ¿Qué te gustaría aprender?",de:"Guten Tag! Ich bin Pierre. Was möchten Sie lernen?",zh:"你好！我是皮埃尔。你想学习什么？",ja:"こんにちは！ピエールです。何を学びたいですか？",ar:"مرحباً! أنا بيير. ماذا تود أن تتعلم؟",ru:"Здравствуйте! Я Пьер. Что вы хотите изучить?",en:"Hello! I'm Pierre. We can explore languages, grammar, pronunciation, and the art of communicating."};
const mentorReferrals=[["Archaemenes",/\b(principal|headmaster|academy mentor|school principal)\b/i,"https://artist1970.github.io/Archaemenes.github.io/"],["Eiren",/\b(poetry|literature|literary|creative writing)\b/i,"https://artist1970.github.io/Eiren.github.io/"],["Zelle",/\b(visual art|drawing|painting|bazaar art)\b/i,"https://artist1970.github.io/Zelle.github.io/"],["Hope",/\b(housing|community support|food assistance|support resources)\b/i,"https://artist1970.github.io/Hope.github.io/"],["Aurora",/\b(meditation|grounding|mindfulness|wellness reflection)\b/i,"https://artist1970.github.io/AuroraCore.github.io/"],["Moirai",/\b(music|composition|songwriting|the refrain)\b/i,"https://artist1970.github.io/Moirai.github.io/"],["NAIB",/\b(administrator|administrative|delegation|ecosystem navigator)\b/i,"https://artist1970.github.io/NAIB.github.io/"]];
const fallback="A useful place to begin is your goal. Which language or linguistic topic are you exploring, and would you prefer an explanation, examples, or a practice exercise?";
const normalize=s=>String(s||"").toLocaleLowerCase().normalize("NFKC").trim();
// Comparison only: original approved content remains untouched.
const questionKey=s=>normalize(s).replace(/[.!?。？！]+$/u,"").trim();
const topicKey=s=>normalize(s).replace(/[-_]+/g," ").replace(/\s+/g," ");
const knowledgeStatus=document.getElementById("pierre-knowledge-status");
if(window.PierreDictionary)window.PierreDictionary.init(window.PIERRE_PUBLIC_DICTIONARY_URL||"");
function showKnowledgeStatus(message){if(knowledgeStatus)knowledgeStatus.textContent=message;}
fetch("knowledge/public-qa.v1.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("index");return r.json()}).then(d=>{
 if(d.schema!=="pierre-public-knowledge-v1"||d.mentorId!=="pierre"||!Array.isArray(d.records)||d.records.length>5000)throw Error("schema");
 const seen=new Set();
 records=d.records.filter(x=>{
  if(x.status!=="approved-public-seed"||typeof x.question!=="string"||typeof x.answer!=="string"||!x.answer.trim())return false;
  const key=questionKey(x.question);
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
 status="ready";
 showKnowledgeStatus("Pierre's knowledge bank ready: "+records.length+" questions loaded.");
}).catch(()=>{status="offline-fallback";showKnowledgeStatus("Knowledge bank unavailable; limited offline responses are active.");});
function answer(raw){const s=normalize(raw).slice(0,1200);if(!s)return "Write a question or select a language above.";
// Guard credentials before content retrieval and heuristic routing.
if(/(password|api key|secret|private student|account credential)/i.test(s))return "Please do not share private records or credentials here. I can help with a general language question without personal details.";
// Grammar feedback is opt-in and advisory. Never rewrite a learner's message.
const grammarHelp=window.PierreGrammarGuide?.explain(raw);
if(grammarHelp!==null&&grammarHelp!==undefined)return grammarHelp;
// Exact approved answers take precedence over generic topic prompts.
const direct=records.find(r=>questionKey(r.question)===questionKey(s));if(direct)return direct.answer;

// Accept ordinary learner phrasing without claiming a generative translation engine.
const dictionaryIntent=s.match(/^(?:(?:(?:can|could|would)\s+you\s+(?:please\s+)?)|(?:please\s+))?(?:(?:define|explain\s+the\s+meaning\s+of)|(?:give\s+(?:me\s+)?(?:the\s+)?definition\s+of))\s+(?:(?:the\s+)?word\s+)?([\p{L}'-]+)[?.!]*$/u);
if(dictionaryIntent){
 const word=dictionaryIntent[1];
 const lookedUp=window.PierreDictionary?.lookup(word,"definition");
 if(lookedUp)return lookedUp;
 if(window.PierreDictionary?.status==="loading")return "My approved dictionary is loading. Please try that definition again in a moment.";
 return "I do not have an approved definition for '"+word+"' in my current public dictionary. It currently contains six reviewed words: abacus, ability, abstract, sentence, speech, and structure.";
}
if(/^(?:(?:can|could|would)\s+you\s+)?(?:define|explain|teach)(?:\s+me)?\s+(?:some\s+)?words[?.!]*$|^(?:can|could|would)\s+you\s+define\s+words[?.!]*$/u.test(s)){
 return "Yes. Ask me to define a specific word, such as 'define abacus'. My approved public dictionary currently has six reviewed entries. You can also ask about vocabulary or word meanings.";
}
if(/\b(?:translat(?:e|ion)|transllate|translate)\b/u.test(s) && /\b(?:word|mother|into|to|from|language|mean)\b/u.test(s)){
 return "I can help you explore translations and explain differences in meaning. Which language would you like to translate into? For a full translation, you can also use the Academy's Universal Translator: https://vervenveda.com/Khaemenes_Linguistics.github.io/apps/translator-entry.html .";
}
if(/\b(?:i\s+(?:want|would\s+like|need)\s+to\s+learn\s+english|teach\s+me\s+english|help\s+me\s+learn\s+english|learn\s+english)\b/u.test(s)){
 return "I'd be glad to help you learn English! We can start with everyday greetings, useful vocabulary, simple sentence structure, or pronunciation. For a first practice, try writing: 'My name is ___. I am learning English.' Would you like to begin with conversation, reading, or grammar?";
}

if(/\b(french|français)\b/i.test(s))activeLanguage="French";
else if(/\b(spanish|español)\b/i.test(s))activeLanguage="Spanish";
else if(/\b(german|deutsch)\b/i.test(s))activeLanguage="German";
if(activeLanguage==="French"){
 if(/\b(alphabet|letters|abc|a to z)\b/i.test(s))return "Wonderful! French uses the same 26 letters as English, but their names differ. Begin with A (ah), B (bé), C (cé), D (dé), E (euh), and F (effe). Say them aloud one at a time. We can practise the next six together.";
 if(/\b(greeting|greetings|say hello|how to greet)\b/i.test(s))return "Let's begin with three French greetings: Bonjour (polite hello), Salut (informal hello), and Bonsoir (good evening). Try this dialogue: Bonjour ! Comment ça va ? — Ça va bien, merci. Your turn!";
 if(/\b(where|start|begin|course|lesson|learn)\b/i.test(s)&&/\b(start|begin|course|lesson|where)\b/i.test(s))return "You can begin French 101 in the Khaemenes Academy Linguistics Hall: https://vervenveda.com/Khaemenes_Linguistics.github.io/ . Choose French 101, then Lesson 01: Alphabet. We can also practise the alphabet together here.";
 if(/\b(i like french|love french|interested in french)\b/i.test(s))return "Magnifique ! Let's start with something useful: Bonjour means hello. Would you like to learn the French alphabet, practise greetings, or try a short dialogue?";
}

if(/^(hello|hi|hey|bonjour|hola|hallo|привет|你好|こんにちは|مرحبا)[!. ]*$/u.test(s))return greetings[language.value]||greetings.en;
if(/\b(translator|translation tool|open translator|universal translator)\b/i.test(s)&&/\b(open|where|find|go to|use|tool)\b/i.test(s))return "The Academy's official Universal Translator is here: https://vervenveda.com/Khaemenes_Linguistics.github.io/apps/translator-entry.html . It has its own privacy and approval controls.";
const referral=mentorReferrals.find(([name,pattern])=>pattern.test(s));if(referral)return referral[0]+" is the specialist best suited to that request. You can visit: "+referral[2]+" . I can also help with the language or translation aspects.";
if(/\b(how are you|how do you feel|how is your day|how are things)\b/.test(s))return "I am doing well, thank you for asking. I've been looking forward to exploring languages with you. How has your day been?";
if(/\b(hello pierre|hi pierre|hey pierre|good to see you|nice to meet you)\b/.test(s))return "Bonjour! It's lovely to see you. We can chat naturally, or explore a language together. How are you today?";
if(/\b(foreign language department|linguistics department|language department|linguistics hall|where are the languages|where can i learn french)\b/.test(s))return "Certainly. The Khaemenes Academy Linguistics Hall is our foreign-language department: https://vervenveda.com/Khaemenes_Linguistics.github.io/ . You can explore French, Spanish, German, Mandarin, Japanese, Arabic and Russian there. Would you like help choosing a course?";
if(/\b(populate|database|data base|add questions|add responses|knowledge base|language data)\b/.test(s))return "A splendid idea. My public question-and-answer library can grow with carefully reviewed examples, language exercises, pronunciation guidance and department directions. The separate Pierre Code Capsule is a drafting workspace; reviewed material must be explicitly exported before it becomes public.";
if(/\b(what can you do|how can you help|your specialty)\b/.test(s))return "My specialty is linguistics and foreign languages. I can explain grammar, compare languages, guide pronunciation practice, discuss translation choices and help you find Academy courses. What interests you most?";
if(/\b(thank you|thanks|merci|gracias|danke|спасибо)\b/.test(s))return "My pleasure! Merci à vous. Is there another question I can help with?";
if(/\b(goodbye|bye|see you later|au revoir)\b/.test(s))return "Au revoir! Come back whenever curiosity calls.";

const dictionaryRequest=s.match(/^(?:what (?:is|does)|define|definition of|meaning of|synonyms? (?:of|for)|antonyms? (?:of|for))\s+(.+?)[?.!]*$/i);
if(dictionaryRequest&&window.PierreDictionary){
 const mode=/^synonyms?/i.test(s)?"synonyms":/^antonyms?/i.test(s)?"antonyms":"definition";
 const word=dictionaryRequest[1].replace(/^(?:the word|a word)\s+/i,"").trim();
 if(/^[\p{L}'-]{1,80}$/u.test(word)){const result=window.PierreDictionary.lookup(word,mode);if(result)return result;}
}
if(s.includes("thank"))return "You're welcome. Languages reward curiosity and regular practice. What shall we explore next?";
const tokens=x=>normalize(x).replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(w=>w.length>2&&!["the","and","you","your","can","how","what","why","does","are","for","with","should","this","that","about","from","into","have","learn"].includes(w));
const words=new Set(tokens(s));let best=null,bestScore=0;
for(const r of records){const terms=[...new Set(tokens(r.question))];const common=terms.filter(t=>words.has(t)).length;const ratio=common/Math.max(terms.length,words.size,1);const score=common*2+ratio*3;if(common>=2&&ratio>=0.55&&score>bestScore){best=r;bestScore=score;}}
if(best&&bestScore>=5)return best.answer;
const topic=Object.keys(topics).find(t=>topics[t].some(k=>s.includes(normalize(k))));if(topic){const candidates=records.filter(x=>topicKey(x.topic)===topicKey(topic));if(candidates.length===1)return candidates[0].answer;return "I'd be glad to explore "+topic+" with you. Are you interested in pronunciation, grammar, vocabulary, conversation, or a specific example?";}
return fallback;}
function append(who,text){const div=document.createElement("div");div.className="bubble "+(who==="You"?"you":"pierre");const b=document.createElement("span");b.className="speaker";b.textContent=who;const p=document.createElement("p");p.textContent=text;div.append(b,p);log.append(div);log.scrollTop=log.scrollHeight;}
function submit(){const q=input.value.trim();if(!q)return;const reply=answer(q);append("You",q);append("Pierre",reply);if(reply===fallback&&status==="ready")queueUnanswered(q);input.value="";input.focus();}
send.addEventListener("click",submit);input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}});
clear.addEventListener("click",()=>{log.replaceChildren();append("Pierre",greetings[language.value]||greetings.en);input.value="";});
language.addEventListener("change",()=>append("Pierre",greetings[language.value]||greetings.en));
const audioStatus=document.getElementById("pierre-audio-status"),voiceSelect=document.getElementById("pierre-voice-select"),volume=document.getElementById("pierre-volume"),pace=document.getElementById("pierre-pace"),stopVoice=document.getElementById("stop-voice");
const speechAvailable=("speechSynthesis" in window)&&("SpeechSynthesisUtterance" in window);
const voiceLocale={en:"en",fr:"fr",es:"es",de:"de",zh:"zh-CN",ja:"ja",ar:"ar",ru:"ru"};
let availableVoices=[];
function refreshVoices(){
 if(!speechAvailable||!voiceSelect)return;
 const previous=voiceSelect.value;
 availableVoices=window.speechSynthesis.getVoices();
 voiceSelect.replaceChildren(new Option("Automatic · preferred language",""));
 availableVoices.forEach((v,i)=>voiceSelect.add(new Option(v.name+" · "+v.lang+(v.localService?" · device":""),String(i))));
 if(previous&&Number(previous)<availableVoices.length)voiceSelect.value=previous;
}
function selectedVoice(){
 const index=voiceSelect&&voiceSelect.value!==""?Number(voiceSelect.value):-1;
 if(index>=0&&availableVoices[index])return availableVoices[index];
 const target=voiceLocale[language.value]||"en";
 const matching=availableVoices.filter(v=>v.lang.toLowerCase().startsWith(target.slice(0,2)));
 return matching.find(v=>v.localService)||matching[0]||null;
}
function setAudioStatus(message){if(audioStatus)audioStatus.textContent=message;}
if(speechAvailable){refreshVoices();window.speechSynthesis.addEventListener?.("voiceschanged",refreshVoices);}
else setAudioStatus("Speech playback is unavailable in this browser.");
for(const [control,output,format] of [[volume,document.getElementById("pierre-volume-value"),v=>v+"%"],[pace,document.getElementById("pierre-pace-value"),v=>Number(v).toFixed(2)+"×"]]){
 if(control&&output)control.addEventListener("input",()=>{output.textContent=format(control.value);});
}
if(voice)voice.addEventListener("click",()=>{
 if(!speechAvailable){setAudioStatus("Speech playback is unavailable in this browser.");return;}
 const last=[...log.querySelectorAll(".bubble.pierre p")].at(-1);
 if(!last)return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(last.textContent);
 const chosen=selectedVoice();
 if(chosen){utterance.voice=chosen;utterance.lang=chosen.lang;}
 else utterance.lang=voiceLocale[language.value]||"en";
 utterance.volume=volume?Number(volume.value)/100:0.8;
 utterance.rate=pace?Number(pace.value):0.85;
 utterance.onstart=()=>setAudioStatus("Pierre is speaking.");
 utterance.onend=()=>setAudioStatus("Playback finished.");
 utterance.onerror=e=>{if(e.error!=="canceled"&&e.error!=="interrupted")setAudioStatus("Audio playback was unavailable. Try another voice.");};
 window.speechSynthesis.speak(utterance);
});
if(stopVoice)stopVoice.addEventListener("click",()=>{if(speechAvailable)window.speechSynthesis.cancel();setAudioStatus("Audio stopped.");});
append("Pierre",greetings.en);
})();