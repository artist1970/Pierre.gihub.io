/* Pierre guided dialogue and sentence studio v1.
 * Inspired by the learning patterns of AffixSix, Checkers Variant Lab and
 * Storybird Grove. Original, session-only teaching logic, not a copy of game engines.
 * No learner tracking, external calls, remote inference, or persistent storage.
 */
(function(root){"use strict";
const clean=s=>String(s||"").trim().replace(/\s+/g," ").slice(0,1200);
const norm=s=>clean(s).normalize("NFKC").toLowerCase().replace(/[’]/g,"'");
const sentenceEnd=/[.!?]$/;
const subjects=/\b(i|you|he|she|we|they|it|the|a|an|my|our|your|someone|people|builder|artist|student|friend|bird|fox|cat|dog)\b/i;
const verbs=/\b(am|is|are|was|were|have|has|had|build|built|make|made|create|created|write|wrote|play|played|visit|visited|walk|walked|learn|learned|learns|study|studied|studies|read|reads|speak|speaks|spoke|see|saw|find|found|go|went|went|draw|drew|like|likes|enjoy|enjoyed|feel|felt|run|ran|helps|helped|help|practice|practiced|practise|practised|work|worked|works|want|wanted|try|tried|choose|chose|sing|sang|dance|danced|discover|discovered|explore|explored|prepare|prepared|prepare|teach|taught|tell|told|said|say|says|can|could|will|would)\b/i;
const places=/\b(in|at|on|near|beside|around|through|inside|outside|behind|under|above|across|into|from|by|home|school|garden|park|library|studio|workshop|room|forest|city|academy)\b/i;
const connections=/\b(because|when|while|after|before|although|so|but|then|and)\b/i;
let active=false,stage=0,tries=0,successes=0,lastInterest="",recentPrompt="";
const prompts=[
 "Let's create a sentence together. Write one complete sentence about something you have built. For example, 'I built a tiny garden.' Your turn!",
 "Well done. Now add a setting or place to your sentence. For example, 'I built a tiny garden beside the library.' Write your own version.",
 "Excellent. Add a reason or a second event using 'because', 'when', or 'and'. For example, 'I built a tiny garden beside the library because I love flowers.' Write yours."
];
function prompt(){recentPrompt=prompts[stage];return prompts[stage];}
function start(){active=true;stage=0;tries=0;successes=0;return "A splendid choice! We'll use the Storybird pattern—who, action, place, and reason—to grow your own sentences step by step. "+prompt();}
function feedback(message){
 const s=clean(message),words=s.split(/\s+/).filter(Boolean);
 const hasSubject=subjects.test(s),hasVerb=verbs.test(s);
 const basic=words.length>=4&&hasSubject&&hasVerb;
 if(!basic){tries++;return "You're getting started. A complete sentence needs someone or something and an action. Try 'I built a small model.' What did you build?";}
 if(stage===0){stage=1;successes++;tries=0;return "That works as a sentence: “"+s+"” You included a subject and an action. "+prompt();}
 if(stage===1&&!places.test(s)){tries++;return "Good subject and action! Now tell me where it happened. Add a place, such as 'in my studio' or 'at school', and try again.";}
 if(stage===1){stage=2;successes++;tries=0;return "Wonderful—you added a setting. "+prompt();}
 if(stage===2&&!connections.test(s)){tries++;return "You're close! Connect another idea with 'because', 'when', or 'and'. Tell me why it happened or what happened next.";}
 successes++;active=false;stage=0;tries=0;
 return "Très bien! You combined an action, a setting, and another idea into a growing sentence. That's the same building-block principle Storybird Grove uses for storytelling. Your practice is complete; you can say 'practice again' for a new round or 'quiz me on French' for a different challenge.";
}
function handle(raw){
 const q=norm(raw);
 if(!q)return null;
 if(/^(?:stop|end|exit|cancel)(?: (?:the )?(?:practice|exercise|activity))?[!.?]*$/.test(q)&&active){active=false;return "Of course. We'll leave the exercise here. You can return whenever you like.";}
 if(/^(?:hint|give me a hint|help me|i'm stuck|i am stuck)[.!?]*$/.test(q)&&active)return stage===0?"Start with 'I' or 'The artist', then use an action like 'built', 'wrote', or 'created'.":stage===1?"Keep your subject and action; add a place using 'in', 'at', or 'beside'.":"Add 'because' to give a reason, or 'and' to add what happened next.";
 if(/^(?:repeat|repeat the question|what was the task)[.!?]*$/.test(q)&&active)return recentPrompt;
 if(/^(?:practice(?: please| again| with me)?|let'?s practice|give me (?:an? )?exercise|start (?:an? )?exercise|let'?s do (?:an? )?exercise)[.!?]*$/.test(q))return start();
 if(/^(?:suggest (?:something|an exercise|something for me)(?: please)?|what should (?:we|i) (?:do|practice)(?: next)?|surprise me(?: please)?|pick (?:something|a lesson|an exercise)(?: for me)?)[.!?]*$/.test(q))return "I suggest a small creative-writing challenge. It's a little like building a story in Storybird Grove: first a person and action, then a place, then a reason. "+start();
 if(active){
   // Do not consume explicit new subject requests while a practice is in progress.
   if(/^(?:quiz me|define |translate |what is |who is |where is |can you tell me)/.test(q)){active=false;return null;}
   return feedback(raw);
 }
 if(/\b(?:i (?:have|ve|have been|ve been|was|am|'m) (?:been )?busy building|i(?:'ve| have) been (?:busy )?(?:building|making|creating)|i built|i'm building|i am building)\b/.test(q)){
   lastInterest="building";
   return "You have been busy building! That sounds like meaningful creative work. What have you been building—something for the Academy, an artwork, or a new game? If you'd rather unwind, I can offer a short language exercise.";
 }
 if(/^(?:hello|hi|hey) pierre[!., ]*how are you[?.!]*$/.test(q))return "Bonjour! I'm doing well, merci. I'm glad to see you. Have you been creating something interesting today?";
 if(/^(?:what do you recommend|what would you suggest)[?.!]*$/.test(q))return "We could build an original sentence together, practise French greetings, or try a vocabulary quiz. Say 'practice please' for a short guided sentence challenge.";
 return null;
}
root.PierreGuidedDialogue=Object.freeze({handle,reset(){active=false;stage=0;tries=0;successes=0;lastInterest="";recentPrompt="";},get state(){return {active,stage,tries,successes};}});
})(window);
