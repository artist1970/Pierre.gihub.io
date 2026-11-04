/* Pierre practice studio v1. Rule-based, offline, no persistence or external requests.
   Illustrative sentences are original teaching examples, not new dictionary entries. */
(function(root){"use strict";
const examples=Object.freeze({
 abacus:[
  "The student used an abacus to count ten beads.",
  "We practiced addition with an abacus in the classroom.",
  "An abacus can help us visualize place value."
 ],
 ability:[
  "Reading a little every day can strengthen your ability to recognize words.",
  "The learner showed the ability to explain the new idea clearly.",
  "Practice helps us develop the ability to speak with confidence."
 ],
 abstract:[
  "The class discussed an abstract idea about fairness.",
  "Her abstract painting used shapes instead of familiar objects.",
  "Patience is an abstract quality that we can describe through actions."
 ],
 sentence:[
  "We wrote a sentence about our favorite book.",
  "A clear sentence helps the reader understand an idea.",
  "Can you create a sentence with a subject and a verb?"
 ],
 speech:[
  "The student prepared a short speech about the environment.",
  "Clear speech helps a listener follow your meaning.",
  "We studied how rhythm changes during natural speech."
 ],
 structure:[
  "The structure of this sentence is simple.",
  "The teacher explained the structure of a short paragraph.",
  "A good structure helps organize an explanation."
 ]
});
const count=new Map();
let recentWord=null;
const clean=s=>String(s||"").normalize("NFKC").toLocaleLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g," ").trim();
const words=Object.keys(examples);
function nextExample(word){
 const n=count.get(word)||0;
 count.set(word,n+1);
 recentWord=word;
 return "Here's a "+(n===0?"practice":"different")+" sentence: “"+examples[word][n%examples[word].length]+"” Can you write another sentence with '"+word+"' in your own words?";
}
function handle(question,dict){
 const q=clean(question).replace(/[?.!]+$/,"");
 const explicit=q.match(/\b(?:sentence|sentences|example|examples)\b.*\b(?:using|with|for)\s+(?:the\s+word\s+)?([a-z'-]+)$/u)
  ||q.match(/\b(?:use|using)\s+([a-z'-]+)\s+in\s+(?:a|an|another)\s+sentence$/u);
 if(explicit&&words.includes(explicit[1])){
  if(!dict?.lookup?.(explicit[1],"definition"))return "That word is not currently available in my approved dictionary.";
  return nextExample(explicit[1]);
 }
 if(/^(?:another|one more|next|different)\s+(?:example|sentence)(?:\s+please)?$/.test(q)&&recentWord){
  if(!dict?.lookup?.(recentWord,"definition"))return null;
  return nextExample(recentWord);
 }
 if(/^(?:practice|let'?s practice|can we practice|help me practice)\s+(?:english\s+)?(?:conversation|speaking|dialogue)$/.test(q)){
  return "Let's practice a short English conversation. I'll start: 'Hello! What would you like to learn today?' Reply with one complete sentence, such as 'I would like to learn new words.' Then ask me for another dialogue prompt.";
 }
 if(/^(?:another|next|new)\s+(?:dialogue|conversation)\s+(?:prompt|question)$/.test(q)){
  return "Here is another English conversation prompt: 'What do you enjoy reading or learning about?' Answer in a sentence. You can begin with 'I enjoy...' and add one reason using 'because'.";
 }
 if(/^(?:practice|let'?s practice|quiz me on|give me a quiz on)\s+(?:the\s+)?(?:word|vocabulary|words|definitions)(?:\s+please)?$/.test(q)){
  return "Vocabulary practice: Which of our six reviewed words means 'a group of words that expresses a complete thought'? Choose: sentence, ability, or abacus. Reply with your choice, and I can explain it.";
 }
 if(/^(?:more|another|next)\s+(?:vocabulary|word)\s+(?:practice|quiz)$/.test(q)){
  return "Try a different vocabulary question: Which reviewed word describes 'the way parts are arranged or organized'? Choose: speech, structure, or abstract.";
 }
 return null;
}
root.PierrePracticeStudio=Object.freeze({handle,get supportedWords(){return [...words]},reset(){count.clear();recentWord=null}});
})(window);
