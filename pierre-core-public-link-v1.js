/* Pierre public CORE profile reader: same-origin, read-only, advisory only. */
(function(root){"use strict";
 if(root.PierrePublicCoreProfile?.version===1)return;
 let status="loading",profile=null;
 const source="knowledge/pierre-core-profile.v1.json";
 function validate(d){
  if(!d||d.schema!=="pierre-public-core-profile-v1"||d.version!==1||
    d.mentorId!=="pierre"||d.name!=="Pierre"||d.status!=="approved-public-profile-reference"||
    d.source?.repository!=="artist1970/CORE"||
    d.source?.path!=="PierreCore/AI_CORE_MANIFEST.json"||
    !/^[a-f0-9]{40}$/.test(d.source.gitBlobSha)||
    d.authority?.delegatedAdministrativeAuthority!==false||
    d.authority?.protectedRuntimeAccess!==false||
    d.authority?.consequentialExecution!==false||
    d.synchronization?.automaticDraftPublication!==false||
    d.synchronization?.privateCloudAccess!==false||
    typeof d.role!=="string"||d.role.length>250)throw Error("pierre-core-profile-invalid");
  return Object.freeze({mentorId:d.mentorId,name:d.name,role:d.role,department:d.department,
    version:d.coreVersion,sourceSha:d.source.gitBlobSha,authority:"public-educational-guidance-only"});
 }
 const label=document.getElementById("pierre-core-profile-status");
 async function load(){
  try{
   const response=await fetch(source,{credentials:"same-origin",cache:"no-cache",redirect:"error"});
   if(!response.ok)throw Error("pierre-core-unavailable");
   profile=validate(await response.json());status="ready";
   if(label)label.textContent="PierreCore "+profile.version+" · "+profile.role+" · Public educational guidance only";
  }catch(_){
   status="unavailable";profile=null;
   if(label)label.textContent="Canonical profile temporarily unavailable. Pierre's approved public lessons and conversation remain available.";
  }
  return status;
 }
 const api=Object.freeze({version:1,source,get status(){return status;},get profile(){return profile;},load});
 root.PierrePublicCoreProfile=api;
 load();
})(window);
