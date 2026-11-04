/* Pierre Monte Carlo Q&A v1.
 * Session-only weighted sampling of approved question/answer records and published
 * vocabulary definitions. No learner tracking, cross-repo calls, data mutation,
 * automatic scoring of free-text, or unsupported answer generation. */
(function(root){"use strict";
const normalize=s=>String(s||"").normalize("NFKC").toLocaleLowerCase().trim().replace(/\s+/g," ").replace(/[.!?]+$/,"");
const topicKey=s=>normalize(s).replace(/[-_]+/g," ");
const approved=records=>Array.isArray(records)?records.filter(x=>x&&x.status==="approved-public-seed"&&typeof x.question==="string"&&typeof x.answer==="string"&&x.question.trim()&&x.answer.trim()).slice(0,1500):[];
const limits={maximumQuestions:500,history:12};
let session=null;
function float(){return (root.crypto?.getRandomValues?root.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296:Math.random());}
function chooseWeighted(items,weight){
 let total=0;const weights=items.map(item=>{let w=weight(item);w=Number.isFinite(w)?Math.max(0,w):0;total+=w;return w;});
 if(!total)return null;let spin=float()*total;
 for(let i=0;i<items.length;i++){spin-=weights[i];if(spin<0)return items[i];}
 return items[items.length-1];
}
function available(records,topic){
 const filtered=approved(records).filter(x=>topic==="all"||topicKey(x.topic)===topic);
 const seen=new Set();
 return filtered.filter(r=>{const key=normalize(r.question);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,limits.maximumQuestions).map(r=>({id:r.id,question:r.question,answer:r.answer,topic:topicKey(r.topic)}));
}
function wordsFromDictionary(dict){
 const words=["abacus","ability","abstract","sentence","speech","structure"];
 if(!dict||!["ready","cached"].includes(dict.status))return [];
 return words.map(word=>({word,definition:dict.lookup(word,"definition")}))
  .filter(x=>typeof x.definition==="string"&&x.definition.toLocaleLowerCase().startsWith(x.word+": "))
  .map(x=>({...x,definition:x.definition.slice(x.definition.indexOf(":")+1).trim()}));
}
function weightsFor(card){
 const misses=session.misses.get(card.id)||0;
 const last=session.recent.indexOf(card.id);
 return (1+Math.min(misses,5)*2)*(last<0?1:.025)*(session.current?.id===card.id?.01:1);
}
function draw(){
 const bank=session.pool;
 const unvisited=bank.filter(c=>!session.visited.has(c.id));
 const source=unvisited.length?unvisited:bank;
 if(!source.length)return null;
 const next=chooseWeighted(source,weightsFor);
 if(!next)return null;
 session.current=next;session.visited.add(next.id);
 session.recent.unshift(next.id);session.recent=session.recent.slice(0,limits.history);
 session.revealed=false;
 session.asked++;
 return next;
}
function display(card){
 if(!card)return "No approved questions are available for that topic.";
 const prefix="Question "+session.asked+" · "+(session.mode==="vocabulary"?"vocabulary":card.topic)+": ";
 return prefix+card.question+(session.mode==="vocabulary"?" Reply with one of the choices above.":" Say 'show answer' to reveal the approved explanation, then 'got it' or 'practice again' to continue.");
}
function startVocabulary(dict){
 const words=wordsFromDictionary(dict);
 if(words.length<3)return "My reviewed vocabulary bank is not ready; please try again after it loads.";
 const pool=words.map(w=>{
  const distractors=words.filter(x=>x.word!==w.word).map(x=>x.word);
  // Weighted sampling selects a term; choices are shuffled separately without altering truth.
  const picks=[];while(picks.length<2&&distractors.length){const ix=Math.floor(float()*distractors.length);picks.push(distractors.splice(ix,1)[0]);}
  const choices=[w.word,...picks];
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(float()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  const cleanDefinition=w.definition.replace(/[.!?]+$/,"");
  return {id:"dictionary:"+w.word,word:w.word,definition:cleanDefinition,question:"Which word means: "+cleanDefinition+"? Choices: "+choices.join(", ")+".",answer:w.word,choices,topic:"vocabulary"};
 });
 session={mode:"vocabulary",pool,misses:new Map(),visited:new Set(),recent:[],current:null,revealed:false,asked:0,correct:0,attempted:0};
 return display(draw());
}
function startKnowledge(records,topic){
 const pool=available(records,topic);
 if(!pool.length)return "I don't have approved Q&A records for that topic. Try 'quiz me on French', 'quiz me on English', or 'quiz me on linguistics'.";
 session={mode:"knowledge",pool,misses:new Map(),visited:new Set(),recent:[],current:null,revealed:false,asked:0,correct:0,attempted:0};
 return display(draw());
}
function stop(){
 if(!session)return "There isn't an active Monte Carlo practice session.";
 const summary="Practice complete: "+session.asked+" questions drawn, "+session.attempted+" reviewed attempts.";
 session=null;return summary+" No learner answers were uploaded or saved.";
}
function handle(input,records,dict){
 const q=normalize(input);
 if(q==="stop quiz"||q==="end quiz"||q==="exit quiz"||q==="stop practice")return stop();
 if(/^(?:start )?(?:monte carlo|random|mixed|adaptive) (?:q\s*&\s*a|questions|quiz|practice)$/.test(q)||q==="quiz me"||q==="start monte carlo quiz")return startKnowledge(records,"all");
 const topic=q.match(/^(?:start )?(?:monte carlo |random |adaptive )?(?:quiz me on|quiz me about|quiz on|practice questions on|practice q&a on) (.+)$/);
 if(topic){
  const target=topicKey(topic[1].replace(/\s+(?:questions|q&a)$/,""));
  if(["words","word","vocabulary","definitions"].includes(target))return startVocabulary(dict);
  return startKnowledge(records,target);
 }
 if(q==="monte carlo vocabulary"||q==="random vocabulary quiz"||q==="adaptive vocabulary quiz"||q==="quiz vocabulary")return startVocabulary(dict);
 if(!session)return null;
 if(q==="next question"||q==="next quiz question"||q==="another question"||q==="skip question")return display(draw());
 const card=session.current;if(!card)return null;
 if(session.mode==="vocabulary"){
  const answer=normalize(q.replace(/^(?:my answer is|i choose|i think it is|the answer is)\s+/,""));
  if(card.choices.includes(answer)){
   session.attempted++;
   if(answer===card.answer){session.correct++;return "Correct! '"+card.answer+"' means "+card.definition+". "+display(draw());}
   session.misses.set(card.id,(session.misses.get(card.id)||0)+1);
   return "Not quite. Try another option from this question's choices, or say 'show answer' for the approved definition.";
  }
  if(q==="show answer"){
   session.revealed=true;return "Approved answer: "+card.word+". "+card.definition+". Say 'next question' to continue.";
  }
  if(q==="repeat question")return display(card);
  return null;
 }
 if(q==="show answer"||q==="reveal answer"){
  session.revealed=true;return "Approved explanation: "+card.answer+" Say 'got it' to continue or 'practice again' to revisit this subject.";
 }
 if(q==="got it"||q==="i got it"||q==="correct"){
  if(!session.revealed)return "Please say 'show answer' before self-scoring this open-ended response.";
  session.attempted++;session.correct++;return "Good work reviewing the explanation. "+display(draw());
 }
 if(q==="practice again"||q==="i missed it"||q==="not yet"){
  if(!session.revealed)return "Say 'show answer' first, then choose whether to review it again.";
  session.attempted++;session.misses.set(card.id,(session.misses.get(card.id)||0)+1);
  return "We'll give this topic a higher chance of returning later. "+display(draw());
 }
 if(q==="repeat question")return display(card);
 return null;
}
root.PierreMonteCarloQA=Object.freeze({handle,get active(){return !!session},get stats(){return session?{mode:session.mode,questions:session.asked,attempted:session.attempted,correct:session.correct,pool:session.pool.length}:null},reset(){session=null}});
})(window);
