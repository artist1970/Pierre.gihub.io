/* Creative Spark · Public Mentor Explicit Language Requests · v1.0.0
 * A bounded bridge into the existing approved public dictionary and local grammar.
 * No model, user-data upload, private CORE, authorizations, or implicit rewrites.
 */
(function(root){"use strict";
 if(root.CreativeSparkLanguageRequest?.version==="1.0.0")return;
 const allowed=new Set(["eiren","pierre","archaemenes","zelle","hope","moirai","aurora","arshif","naib","auren"]);
 const denied=/\b(?:password|passcode|pin code|access token|api key|secret|credential|login|social security|ssn|credit card|bank account|account number|student record|student grade|private record|private transcript|medical record|home address|phone number|email address|emergency|suicide|self[- ]harm|hurt myself|kill myself|overdose|violence|threat|unsafe|diagnos\w*|prescri\w*|medication|treatment|medical|therapy|legal|benefits|housing|shelter|abuse|assessment key|answer key|locked exam)\b/i;
 const unusual=/[@<>{}\[\]\\/]|(?:\d[ -]?){4,}/;
 const lexical=/^(?:please\s+)?(?:(define|definition of|meaning of|synonyms? (?:of|for)|antonyms? (?:of|for))\s+(?:the\s+word\s+)?|what\s+does\s+(?:the\s+word\s+)?)(["'“”]?)([a-z][a-z-]{1,59})\2(?:\s+mean)?[?.!]?$/i;
 const grammar=/^(?:please\s+)?(?:check|review|help with)(?:\s+my)?\s+grammar\s*[:—-]\s*(.{4,180})$/i;
 function answer(text,{mentorId}={}){
  if(!allowed.has(mentorId)||typeof text!=="string"||text.length>240)return null;
  const q=text.trim();if(!q||denied.test(q)||unusual.test(q))return null;
  const service=root.CreativeSparkMentorLanguage;
  if(!service||typeof service.lookup!=="function"||typeof service.grammar!=="function")return null;
  const gm=q.match(grammar);
  if(gm){
   const sentence=gm[1].trim();
   if(denied.test(sentence)||unusual.test(sentence))return null;
   const v=service.grammar(sentence,{mentorId});
   if(!v||!Array.isArray(v.notes))return null;
   return v.notes.length
      ?v.notes.slice(0,3).join(" ")+" This is limited, advisory grammar guidance."
      :"The basic local grammar check did not flag one of its limited patterns. This is not a complete proofread.";
  }
  const m=q.match(lexical);if(!m)return null;
  const w=m[3].toLowerCase();
  if(denied.test(w))return null;
  const mode=/synonym/i.test(m[1]||"")?"synonyms":/antonym/i.test(m[1]||"")?"antonyms":"definition";
  const v=service.lookup(w,{mentorId,mode});
  if(v)return v+" (Approved public dictionary reference.)";
  const state=service.capabilities?.(mentorId)?.lexicon;
  return state==="ready"
    ?"That term is not in the small approved public dictionary. I won't invent a definition."
    :"The approved public dictionary is not available right now. I won't invent a definition.";
 }
 root.CreativeSparkLanguageRequest=Object.freeze({version:"1.0.0",answer});
})(window);
