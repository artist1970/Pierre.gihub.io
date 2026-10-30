/* Pierre public dictionary adapter v1. No private-source access or automatic publishing. */
(function(root){"use strict";
const schema="pierre-public-dictionary-v1", cacheKey="pierre.dictionary.public.v1";
let entries=new Map(), state="disabled", provenance="";
const clean=x=>String(x||"").trim();
const norm=x=>clean(x).normalize("NFKC").toLocaleLowerCase();
function validate(data){
 if(!data||data.schema!==schema||data.reviewStatus!=="approved-public"||!Array.isArray(data.entries)||data.entries.length>10000)throw Error("dictionary-schema");
 if(!data.source||data.source.visibility!=="public"||!clean(data.source.repository)||!clean(data.source.revision))throw Error("dictionary-provenance");
 const map=new Map();
 for(const e of data.entries){
  if(!e||typeof e.word!=="string"||typeof e.definition!=="string"||!e.word.trim()||!e.definition.trim()||e.word.length>100||e.definition.length>1200)throw Error("dictionary-entry");
  const key=norm(e.word);
  if(map.has(key))throw Error("dictionary-duplicate");
  const list=k=>Array.isArray(e[k])?e[k].filter(v=>typeof v==="string").map(v=>v.trim()).filter(Boolean).slice(0,12):[];
  map.set(key,{word:e.word.trim(),definition:e.definition.trim(),synonyms:list("synonyms"),antonyms:list("antonyms"),partOfSpeech:clean(e.partOfSpeech).slice(0,80)});
 }
 return map;
}
function install(data){const map=validate(data);entries=map;provenance=data.source.repository+" @ "+data.source.revision;state="ready";return map.size;}
async function init(url){
 if(typeof url!=="string"||!url){state="disabled";return state;}
 // Only a same-origin, explicitly approved JSON export can be loaded.
 const parsed=new URL(url,root.location.href);
 if(parsed.origin!==root.location.origin||!parsed.pathname.endsWith(".json")){state="blocked";return state;}
 state="loading";
 try{
  const response=await fetch(parsed.href,{cache:"no-cache",credentials:"same-origin"});
  if(!response.ok)throw Error("dictionary-fetch");
  const data=await response.json();install(data);
  try{root.localStorage.setItem(cacheKey,JSON.stringify(data));}catch{}
 }catch{
  try{install(JSON.parse(root.localStorage.getItem(cacheKey)||"null"));state="cached";}catch{state="unavailable";}
 }
 return state;
}
function lookup(word,mode="definition"){
 if(state!=="ready"&&state!=="cached")return null;
 const e=entries.get(norm(word));if(!e)return null;
 if(mode==="synonyms")return e.synonyms.length?e.word+" — synonyms: "+e.synonyms.join(", ")+".":e.word+" has no reviewed synonyms in this dictionary yet.";
 if(mode==="antonyms")return e.antonyms.length?e.word+" — antonyms: "+e.antonyms.join(", ")+".":e.word+" has no reviewed antonyms in this dictionary yet.";
 return e.word+(e.partOfSpeech?" ("+e.partOfSpeech+")":"")+": "+e.definition;
}
root.PierreDictionary=Object.freeze({init,lookup,get status(){return state;},get size(){return entries.size;},get source(){return provenance;}});
})(window);
