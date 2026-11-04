/* Pierre · approved knowledge composition v1.
   Offline deterministic natural-question guidance, not generative AI.
   Reads only already-approved public Q&A records and the separately approved dictionary. */
(function(root){"use strict";
const norm=s=>String(s||"").normalize("NFKC").toLocaleLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g," ").trim();
const terms=s=>(norm(s).match(/[\p{L}\p{N}]+/gu)||[]).filter(x=>x.length>=3);
const stops=new Set("what where when how why who which whom could would should please can will does do did are is was were has have had you your me my i a an the this that these those word words learn teach explain tell give about some more of in on at to from for with and or into english language languages translate translation definition define".split(" "));
const key=s=>terms(s).filter(x=>!stops.has(x)).join(" ");
const safeEntries=records=>Array.isArray(records)?records.filter(x=>x&&x.status==="approved-public-seed"&&typeof x.question==="string"&&typeof x.answer==="string"&&x.answer.trim().length>0).slice(0,1500):[];
const suggestions=["abacus","ability","abstract","sentence","speech","structure"];
function dictPhrase(text,dict){
 const q=norm(text).replace(/[?.!]+$/,"");
 if(/^(?:(?:can|could|would) you (?:please )?|please )?(?:define|explain the meaning of|give (?:me )?(?:the )?definition of) (?:the word )?words?$/.test(q))
  return "Absolutely. Ask me to define one word, for example: 'define abacus'. My approved public dictionary currently contains six reviewed definitions, and we can build useful sentences using those words.";
 const match=q.match(/^(?:(?:can|could|would) you (?:please )?|please )?(?:(?:define|explain the meaning of|give (?:me )?(?:the )?definition of|what is|what does|what's the meaning of) (?:the word )?)([a-z'-]+)$/);
 if(!match)return null;
 const word=match[1];
 const found=dict?.lookup?.(word,"definition");
 if(found)return found+" Would you like to practice using '"+word+"' in a sentence?";
 if(dict?.status==="loading")return "My reviewed dictionary is loading. Please try again shortly.";
 return "I do not yet have a reviewed dictionary definition for '"+word+"'. The published pilot covers: "+suggestions.join(", ")+". We can still discuss a linguistic question using my approved Q&A bank.";
}
function sentencePractice(text,dict){
 const q=norm(text);
 if(!/\b(?:sentence|sentences|example|examples)\b/.test(q)||!/\b(?:create|make|write|give|show|use|using|with|in|practice)\b/.test(q))return null;
 const words=suggestions.filter(w=>new RegExp("\\b"+w+"\\b","u").test(q));
 if(words.length!==1)return null;
 const word=words[0],definition=dict?.lookup?.(word,"definition");
 if(!definition)return "I can make a practice sentence once that word's approved dictionary entry is available.";
 const meaning=definition.slice(definition.indexOf(":")+1).trim().replace(/[.!?]+$/,"");
 return "Here's an original vocabulary-practice sentence: 'Today we are studying the word "+word+" and its meaning.' In my reviewed dictionary, "+word+" means "+meaning.charAt(0).toLowerCase()+meaning.slice(1)+". Would you like to write your own sentence with it?";
}
function languageStarter(question,records){
 const q=norm(question);
 const match=q.match(/(?:\bi (?:want|would like|need) to learn|\blet'?s learn|\b(?:teach|help) me(?: to learn)?|\bhow (?:can|do) i learn|\bstart learning)\s+(english|french|spanish|german|mandarin|japanese|arabic|russian)\b/);
 if(!match)return null;
 const language=match[1];
 const lookups={english:["How do I review grammar without rote memorization alone?","What is an effective beginner dialogue?"],
 french:["How do I start French?","Why should I practice greetings in context?"],
 spanish:["How do I start Spanish?","Why should I practice greetings in context?"],
 german:["How do I learn German word order?","How do I use a bilingual dictionary well?"],
 mandarin:["What are Mandarin tones?","How do I learn a new alphabet?"],
 japanese:["How do I begin Japanese?","How do I learn a new alphabet?"],
 arabic:["How can I learn polite and informal forms?","How do I learn a new alphabet?"],
 russian:["How do I learn a new alphabet?","How do I build a multilingual phrase notebook?"]};
 const found=lookups[language].map(item=>records.find(r=>norm(r.question)===norm(item))).filter(Boolean);
 const opening="Wonderful! We can begin "+language[0].toUpperCase()+language.slice(1)+" with a small practice activity.";
 const evidence=found.slice(0,2).map(x=>x.answer).join(" ");
 return opening+" "+evidence+" Choose vocabulary, conversation, grammar, or pronunciation for your next step.";
}
function translationGuide(text,records){
 const q=norm(text);
 if(!/\b(?:translat(?:e|ion)|transllate|translate)\b/.test(q))return null;
 const match=q.match(/(?:translat(?:e|ion)|transllate|translate)\s+(?:(?:the )?word\s+)?['"]?([\p{L}'-]+)['"]?\s+(?:into|to)\s+(french|spanish|german|mandarin|japanese|arabic|russian|english)/u);
 if(match) return "To translate '"+match[1]+"' into "+match[2]+", please use the Academy's reviewed translator: https://vervenveda.com/Khaemenes_Linguistics.github.io/apps/translator-entry.html . I can help compare context and explain grammar, but I will not invent an unverified translation.";
 const approved=records.find(r=>norm(r.question)==="what makes a translation accurate?");
 return (approved?approved.answer+" ":"")+"Which target language should we use? Tell me the word or sentence and the target language. For a verified rendering, use the Academy's Universal Translator.";
}
function synthesize(question,records){
 const q=norm(question),tokens=new Set(terms(q).filter(t=>!stops.has(t)));
 if(tokens.size<2)return null;
 const scored=[];
 for(const rec of records){
  const source=new Set(terms(rec.question).filter(t=>!stops.has(t)));
  const overlap=[...tokens].filter(t=>source.has(t));
  const ratio=overlap.length/Math.max(tokens.size,source.size,1);
  if(overlap.length>=2&&ratio>=0.6)scored.push({rec,score:overlap.length*2+ratio});
 }
 scored.sort((a,b)=>b.score-a.score);
 if(!scored.length)return null;
 const best=scored[0],second=scored.slice(1).find(x=>x.rec.topic!==best.rec.topic&&x.score>=best.score*.8);
 // Don't blend answers into a new factual claim; attribute approved teaching steps.
 if(!second)return best.rec.answer;
 return "Let's connect two related ideas. "+best.rec.answer+" "+second.rec.answer+" Would you like an example or a short practice exercise?";
}
function respond(message,records,dict){
 const approved=safeEntries(records);
 const q=norm(message);
 if(!q)return null;
 const practice=sentencePractice(q,dict);
 if(practice)return practice;
 const lexical=dictPhrase(q,dict);
 if(lexical)return lexical;
 const learn=languageStarter(q,approved);
 if(learn)return learn;
 const translation=translationGuide(q,approved);
 if(translation)return translation;
 return synthesize(q,approved);
}
root.PierreLanguageComposer=Object.freeze({respond});
})(window);
