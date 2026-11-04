/* Pierre's bounded English grammar guidance. No automatic rewrites or storage.
   This is intentionally not a comprehensive grammar checker. */
(function(root){"use strict";
const prefix=/^(?:grammar\s*check|check\s*(?:my\s*)?grammar)\s*:\s*/i;
function explain(request){
 const input=String(request||"");
 if(!prefix.test(input))return null;
 const text=input.replace(prefix,"").trim().slice(0,500);
 if(!text)return "Add a short English sentence after 'grammar check:' to explore common patterns.";
 const notes=[];
 const rules=[
  {pattern:/\ba\s+(apple|orange|umbrella|hour|honest\s+\w+|heir)\b/gi,article:"an",reason:"Use 'an' before a vowel sound, including silent-h words."},
  {pattern:/\ban\s+(university|uniform|unicorn|european\s+\w+|one\s+\w+)\b/gi,article:"a",reason:"Use 'a' before a consonant sound, such as the initial sound of 'university'."}
 ];
 for(const rule of rules)for(const m of text.matchAll(rule.pattern)){
  notes.push("Consider '"+rule.article+" "+m[1]+"' instead of '"+m[0]+"'. "+rule.reason);
  if(notes.length>=3)break;
 }
 if(/\s{2,}/.test(text))notes.push("Use single spaces between words.");
 if(/^[a-z]/.test(text))notes.push("A standard English sentence usually starts with a capital letter.");
 if(!/[.!?]$/.test(text))notes.push("A complete declarative sentence normally ends with punctuation.");
 return notes.length
  ?"Possible English grammar improvements (check context): "+notes.slice(0,4).join(" ")
  :"I did not find an issue in my limited grammar rules. That does not prove the sentence is correct. We can also explore verb agreement, tense, or meaning.";
}
root.PierreGrammarGuide=Object.freeze({explain});
})(window);
