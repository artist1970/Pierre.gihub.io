/* Creative Spark · approved public mentor Q&A federation v1.
 * One reviewed source index; no duplicated private CORE, no user text transport.
 * The four known GitHub Pages resources are fetched as static documents ONLY.
 * Mentor responses remain mentor-owned; foreign results are attributed as references.
 */
(function(root){"use strict";
 if(root.CreativeSparkMentorQA?.version==="1.0.0")return;
 const BASE="https://artist1970.github.io/";
 const SPECS=Object.freeze([
  {id:"eiren",schema:"vnv-mentor-public-qa-v1",field:"reviewStatus",approved:"approved",count:60,url:BASE+"Eiren.github.io/knowledge/public-qa.v1.json"},
  {id:"pierre",schema:"pierre-public-knowledge-v1",field:"status",approved:"approved-public-seed",count:527,url:BASE+"Pierre.gihub.io/knowledge/public-qa.v1.json"},
  {id:"archaemenes",schema:"archaemenes-question-collection-v1",field:"status",approved:"approved",count:140,url:BASE+"Archaemenes.github.io/knowledge/question-records.json"},
  {id:"zelle",schema:"zelle-question-collection-v1",field:"status",approved:"approved",count:500,url:BASE+"Zelle.github.io/knowledge/question-records.json"}
 ]);
 const names={eiren:"Eiren",pierre:"Pierre",archaemenes:"Archaemenes",zelle:"Zelle"};
 const stop=new Set(["how","what","why","when","where","which","this","that","with","from","your","you","are","the","for","and","can","could","would","should","please","tell","help","about","really","just","into","does","some","have","want","like","their","there","give","show","more","than","them","these","those","our","his","her","its","was"]);
 const norm=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g," ").replace(/\s+/g," ").trim();
 const words=s=>new Set(norm(s).split(" ").filter(w=>w.length>2&&!stop.has(w)));
 const state=new Map(),bank=new Map(),history=new Map();
 let pending=null;
 const sensitive=/\b(?:password|access token|api key|secret key|private key|student record|student id|credit card|ssn|social security|home address|bank account|private chat|personal phone|medical record|login credential|authentication|answer key|locked exam|locked test|graded assessment|suicide|self[- ]harm|kill myself|immediate danger|emergency)\b/i;
 function verify(data,spec){
  if(!data||data.schema!==spec.schema||!Array.isArray(data.records)||data.records.length!==spec.count)throw Error("bank-schema-or-count");
  const ids=new Set(),questions=new Set(),rows=[];
  for(const r of data.records){
   if(!r||r[spec.field]!==spec.approved||typeof r.id!=="string"||!r.id||
      typeof r.question!=="string"||!r.question.trim()||r.question.length>350||ids.has(r.id)||
      typeof r.topic!=="string"||!r.topic.trim())throw Error("unapproved-or-malformed");
   const n=norm(r.question);
   ids.add(r.id);
   const answers=Array.isArray(r.responses)?r.responses.map(x=>x?.text).filter(x=>typeof x==="string"&&x.trim()):[r.answer];
   if(!answers.length||answers.some(a=>typeof a!=="string"||!a.trim()||a.length>2500))throw Error("invalid-answer");
   const alts=[...(Array.isArray(r.alternateQuestions)?r.alternateQuestions:[]),...(Array.isArray(r.aliases)?r.aliases:[])].filter(x=>typeof x==="string"&&x.length<350);
   if(questions.has(n))continue; // Preserve approved source; deduplicate only retrieval index.
   questions.add(n);
   rows.push(Object.freeze({mentorId:spec.id,id:r.id,topic:r.topic,question:r.question,alts:Object.freeze(alts),
    keywords:Object.freeze((Array.isArray(r.keywords)?r.keywords:[]).filter(k=>typeof k==="string"&&k.length<100)),
    answer:answers[0],url:spec.url}));
  }
  return Object.freeze(rows);
 }
 function init(){
  if(pending)return pending;
  pending=Promise.all(SPECS.map(async spec=>{
    state.set(spec.id,"loading");
    try{
     const response=await root.fetch(spec.url,{mode:"cors",credentials:"omit",cache:"force-cache"});
     if(!response.ok)throw Error("fetch-unavailable");
     const verified=verify(await response.json(),spec);
     bank.set(spec.id,verified);state.set(spec.id,"ready");
    }catch(_){bank.delete(spec.id);state.set(spec.id,"unavailable");}
  })).then(()=>status());
  return pending;
 }
 function status(){
  const sources=Object.fromEntries(SPECS.map(s=>[s.id,state.get(s.id)||"not-loaded"]));
  return Object.freeze({version:"1.0.0",sources,
   approvedAvailable: [...bank.values()].reduce((n,rows)=>n+rows.length,0),
   indexedSources:bank.size,expectedTotal:1227,transcriptTransport:false,privateCOREAccess:false});
 }
 function match(query,{mentorId,excludeIds=[]}={}){
  if(!names[mentorId])return null;
  const q=norm(String(query||"").slice(0,700));
  if(q.length<9||q.length>650||sensitive.test(query))return null;
  const tokens=words(q),exclude=new Set(excludeIds);
  let best=null,second=null;
  for(const [id,rows] of bank){
   if(id===mentorId)continue;
   for(const row of rows){
    if(exclude.has(row.id))continue;
    const forms=[row.question,...row.alts].map(norm);
    let score=0;
    if(forms.includes(q))score=100;
    else if(forms.some(x=>x.length>=20&&q.includes(x)&&q.length<=x.length+50))score=85;
    else{
     const combined=new Set([...words(row.question),...row.keywords.flatMap(x=>[...words(x)])]);
     const common=[...tokens].filter(t=>combined.has(t)).length;
     const cov=common/Math.max(1,tokens.size);
     const specificity=common/Math.max(1,Math.min(6,combined.size));
     if(common>=3&&cov>=0.76&&specificity>=0.52)score=48+Math.round(cov*15+specificity*15);
    }
    if(score<65)continue;
    const item={score,row};
    if(!best||score>best.score){second=best;best=item;}
    else if(!second||score>second.score)second=item;
   }
  }
  if(!best||best.score<78)return null;
  // Avoid confidently returning an answer for an ambiguous, overlapping query.
  if(second&&second.score===best.score)return null; // Ambiguous cross-mentor answers must not be arbitrarily selected.
  if(second&&best.score<100&&best.score-second.score<7)return null;
  return Object.freeze({kind:"attributed-public-reference",answer:best.row.answer,sourceMentor:best.row.mentorId,
   sourceName:names[best.row.mentorId],topic:best.row.topic,recordId:best.row.id,score:best.score,
   sourceUrl:best.row.url,ownMentor:mentorId,verifiedPublicOnly:true});
 }
 function answer(query,{mentorId,scope="public",excludeIds=[]}={}){
  if(!names[mentorId])return null;
  const found=match(query,{mentorId,excludeIds});
  if(!found)return null;
  const key=mentorId+":"+String(scope).slice(0,50);
  const previous=history.get(key)||[];
  if(previous.includes(found.recordId))return null;
  history.set(key,[...previous,found.recordId].slice(-20));
  return found;
 }
 function reset({mentorId,scope="public"}={}){history.delete(mentorId+":"+String(scope).slice(0,50));}
 root.CreativeSparkMentorQA=Object.freeze({version:"1.0.0",init,status,match,answer,reset});
 init();
})(window);
