import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const core=JSON.parse(read("knowledge/pierre-core-profile.v1.json"));
const html=read("index.html"),source=read("pierre-core-public-link-v1.js");
test("Pierre public CORE identity remains role-scoped and provenance-pinned",()=>{
 assert.equal(core.schema,"pierre-public-core-profile-v1");
 assert.equal(core.mentorId,"pierre");
 assert.equal(core.name,"Pierre");
 assert.equal(core.source.repository,"artist1970/CORE");
 assert.equal(core.source.path,"PierreCore/AI_CORE_MANIFEST.json");
 assert.match(core.source.gitBlobSha,/^[a-f0-9]{40}$/);
 assert.equal(core.authority.protectedRuntimeAccess,false);
 assert.equal(core.authority.consequentialExecution,false);
 assert.equal(core.synchronization.automaticDraftPublication,false);
 assert.equal(core.synchronization.privateCloudAccess,false);
});
test("Front door links only its same-origin public identity and does not request the private CORE",()=>{
 assert.match(html,/pierre-core-profile-status/);
 assert.match(html,/pierre-core-public-link-v1\.js/);
 assert.match(source,/knowledge\/pierre-core-profile\.v1\.json/);
 assert.doesNotMatch(source,/https?:\/\/|localStorage|sessionStorage|indexedDB|postMessage|\.put\(/);
});
test("Approved identity is displayed without altering public conversation",async()=>{
 const label={textContent:""};
 const win={};
 const fetch=async()=>({ok:true,json:async()=>structuredClone(core)});
 vm.runInNewContext(source,{window:win,document:{getElementById:()=>label},fetch,Error,Object,RegExp,String});
 await win.PierrePublicCoreProfile.load();
 assert.equal(win.PierrePublicCoreProfile.status,"ready");
 assert.match(label.textContent,/PierreCore 1\.0\.0/);
 assert.equal(win.PierrePublicCoreProfile.profile.authority,"public-educational-guidance-only");
});
test("Unapproved and authority-escalating identity fails closed",async()=>{
 const label={textContent:""},win={};
 const fetch=async()=>({ok:true,json:async()=>({...core,authority:{...core.authority,protectedRuntimeAccess:true}})});
 vm.runInNewContext(source,{window:win,document:{getElementById:()=>label},fetch,Error,Object,RegExp,String});
 await win.PierrePublicCoreProfile.load();
 assert.equal(win.PierrePublicCoreProfile.status,"unavailable");
 assert.equal(win.PierrePublicCoreProfile.profile,null);
 assert.match(label.textContent,/temporarily unavailable/);
});
