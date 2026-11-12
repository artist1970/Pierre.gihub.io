/* Creative Spark · Public Mentor Language Adapter v1
 * Canonical interface, mirrored verbatim to approved public mentor front doors.
 * AIPCore's private dictionary and Aurora v8.2 MUST NOT be fetched or bundled.
 * Only the explicitly approved Pierre public dictionary projection is allowed here.
 * Grammar advice is limited original browser-local guidance, not AIPCore v8.2.
 * Ten public mentors share this lexicon interface, while each retains its own safety and persona.
 * This is NOT a generative model or a replacement for mentor-owned response policy.
 */
(function(root){"use strict";
 if(root.CreativeSparkMentorLanguage?.version==="1.3.0")return;
 const PUBLIC_DICTIONARY="https://artist1970.github.io/Pierre.gihub.io/knowledge/public-dictionary.v1.json";
 const SCHEMA="pierre-public-dictionary-v1";
 const allowed=new Set(["pierre","eiren","archaemenes","zelle","hope","moirai","aurora","arshif","naib","auren"]);
 const entries=new Map(),states=new Map(),inflight=new Map();
 const norm=x=>String(x??"").normalize("NFKC").trim().toLowerCase();
 const clean=x=>String(x??"").trim();
 function validate(body){
  if(!body||body.schema!==SCHEMA||body.reviewStatus!=="approved-public"||
     body.source?.visibility!=="public"||!Array.isArray(body.entries)||body.entries.length>2000)
     throw Error("unapproved-dictionary");
  const next=new Map();
  for(const r of body.entries){
   if(!r||typeof r.word!=="string"||typeof r.definition!=="string"||
      !r.word.trim()||r.word.length>100||!r.definition.trim()||r.definition.length>1200)
      throw Error("invalid-dictionary-entry");
   const key=norm(r.word);
   if(next.has(key))throw Error("duplicate-dictionary-entry");
   next.set(key,Object.freeze({word:r.word.trim(),definition:r.definition.trim(),
    partOfSpeech:clean(r.partOfSpeech).slice(0,80),
    synonyms:Array.isArray(r.synonyms)?r.synonyms.filter(v=>typeof v==="string").slice(0,12):[],
    antonyms:Array.isArray(r.antonyms)?r.antonyms.filter(v=>typeof v==="string").slice(0,12):[]}));
  }
  return next;
 }
 function init(mentorId){
  if(!allowed.has(mentorId))return Promise.resolve("blocked");
  if(states.get(mentorId)==="ready")return Promise.resolve("ready");
  if(inflight.has(mentorId))return inflight.get(mentorId);
  states.set(mentorId,"loading");
  const request=(async()=>{
    try{
      // Static, preapproved resource only. No user message, accounts, or query data sent.
      const response=await root.fetch(PUBLIC_DICTIONARY,{method:"GET",mode:"cors",credentials:"omit",cache:"no-store"});
      if(!response.ok)throw Error("public-dictionary-unavailable");
      const data=validate(await response.json());
      entries.clear();for(const [k,v] of data)entries.set(k,v);
      states.set(mentorId,"ready");
    }catch(_){states.set(mentorId,"unavailable");}
    return states.get(mentorId);
  })();
  inflight.set(mentorId,request);
  return request;
 }
 function lookup(word,{mentorId="eiren",mode="definition"}={}){
  if(!allowed.has(mentorId)||states.get(mentorId)!=="ready")return null;
  const item=entries.get(norm(word));
  if(!item)return null;
  if(mode==="synonyms")return item.synonyms.length?item.word+" — synonyms: "+item.synonyms.join(", ")+".":null;
  if(mode==="antonyms")return item.antonyms.length?item.word+" — antonyms: "+item.antonyms.join(", ")+".":null;
  return item.word+(item.partOfSpeech?" ("+item.partOfSpeech+")":"")+": "+item.definition;
 }
 function grammar(text,{mentorId="eiren"}={}){
  if(!allowed.has(mentorId))return null;
  const input=clean(text);
  if(input.length<4||input.length>1200)return null;
  const notes=[];
  if(/\b(?:a)\s+[aeiou][a-z]+\b/i.test(input))notes.push("Check whether the article should be 'an' before a vowel sound; pronunciation, not spelling alone, decides.");
  if(/\b(?:an)\s+[bcdfghjklmnpqrstvwxyz][a-z]+\b/i.test(input))notes.push("Check whether 'an' suits the following word's initial sound; some consonant letters are silent.");
  if(/ {2,}/.test(input))notes.push("There may be repeated spaces you can simplify.");
  if(!/[.!?…]["')\]]?\s*$/.test(input)&&input.length>25)notes.push("If this is a finished statement, consider ending punctuation.");
  return notes.length?{notes:notes.slice(0,3),source:"public-local-basic-grammar-v1",advisory:true}:null;
 }
 function capabilities(mentorId){
  return Object.freeze({version:"1.3.0",mentorId,
   lexicon:states.get(mentorId)||"not-loaded",
   publishedWordCount:states.get(mentorId)==="ready"?entries.size:0,
   grammar:"basic-advisory-local",
   aipcorePrivateLexicon:"not-accessible",
   aipcoreAuroraV82:"not-loaded",
   source:PUBLIC_DICTIONARY});
 }
 root.CreativeSparkMentorLanguage=Object.freeze({
  version:"1.3.0",init,lookup,grammar,capabilities,
  approvedSource:PUBLIC_DICTIONARY
 });
})(window);
