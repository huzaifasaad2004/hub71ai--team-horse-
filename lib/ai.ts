import {z} from 'zod';
import {type Operation,type Source,understandSchema,bridgeSchema,weekSchema,draftSchema,profileSchema,recSchema,validateBridge,validateWeek,validateDraft} from './contracts';
import {systemPrompt,prompts} from './prompts';
import {jsonSchema} from './json-schema';
const schemas={UnderstandFamily:understandSchema,BuildBridge:bridgeSchema,BuildOurWeek:weekSchema,ActionAgent:draftSchema};
export const inputs={
 UnderstandFamily:z.object({narrative:z.string().trim().min(1).max(5000)}).strict(),
 BuildBridge:z.object({profile:profileSchema,focusPersonId:z.string().max(100),sourceIds:z.array(z.string().max(100)).max(20)}).strict(),
 BuildOurWeek:z.object({profile:profileSchema,bridge:bridgeSchema,savedRecommendationIds:z.array(z.string().max(100)).max(12),startDate:z.null(),maxTasksPerDay:z.union([z.literal(1),z.literal(2)]),extraConstraint:z.string().max(600).nullable()}).strict(),
 ActionAgent:z.object({profile:profileSchema,recommendation:recSchema,intent:z.enum(['draft_introduction','portfolio_checklist']),tone:z.enum(['warm','concise']),userContext:z.string().max(600).nullable()}).strict()
};
export function validateOperation(operation:Operation,data:unknown,input:unknown,sources:Source[]){
 const parsed=inputs[operation].parse(input);const value=schemas[operation].parse(data);
 if(operation==='UnderstandFamily'){const d=understandSchema.parse(value);d.profile.id='family-'+crypto.randomUUID();d.profile.people=d.profile.people.map((p,index)=>({...p,id:d.profile.id+'-p'+index}));for(const p of d.profile.people){if(p.role==='child'&&(p.profession!==null||p.experienceYears!==null||p.interests.length||p.concerns.length))throw Error('Child data minimization');}return d;}
 if(operation==='BuildBridge'){
  const i=inputs.BuildBridge.parse(parsed),b=validateBridge(value,i.profile,sources);b.id='bridge-'+crypto.randomUUID();const ids=new Map(b.recommendations.map((r,index)=>[r.id,b.id+'-r'+index]));b.featuredRecommendationId=ids.get(b.featuredRecommendationId)!;b.recommendations=b.recommendations.map(r=>({...r,id:ids.get(r.id)!}));b.tracks=b.tracks.map(t=>({...t,recommendationIds:t.recommendationIds.map(id=>ids.get(id)!)}));
  for(const r of b.recommendations){if(r.personIds.some(id=>i.profile.people.find(p=>p.id===id)?.role==='child')&&!r.personIds.some(id=>i.profile.people.find(p=>p.id===id)?.role!=='child'))throw Error('Caregiver required');}return b;
 }
 if(operation==='BuildOurWeek'){const i=inputs.BuildOurWeek.parse(parsed);validateBridge(i.bridge,i.profile,sources);if(i.savedRecommendationIds.some(id=>!i.bridge.recommendations.some(r=>r.id===id)))throw Error('Saved reference');const w=validateWeek(value,i.bridge,i.maxTasksPerDay);if(w.tasks.length<7)throw Error('Incomplete week');w.id='week-'+crypto.randomUUID();w.tasks=w.tasks.map((t,index)=>({...t,id:w.id+'-t'+index}));return w;}
 const i=inputs.ActionAgent.parse(parsed);if(i.recommendation.personIds.some(id=>!i.profile.people.some(p=>p.id===id))||i.recommendation.sourceIds.some(id=>!sources.some(s=>s.id===id)))throw Error('Action references');if(i.intent!==i.recommendation.actionIntent)throw Error('Intent mismatch');const d=validateDraft(value,i.recommendation);if(d.intent!==i.intent)throw Error('Output intent');if(d.intent==='draft_introduction'){const words=d.body.trim().split(/\s+/).length;if(words<100||words>160)throw Error('Draft word count');}d.id='draft-'+crypto.randomUUID();return d;
}
export async function generate(operation:Operation,input:unknown,sources:Source[],key:string,model:string,signal:AbortSignal){
 const safe=inputs[operation].parse(input);let repair=false;
 for(let attempt=0;attempt<2;attempt++){
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model,store:false,max_output_tokens:6500,instructions:systemPrompt+'\n'+prompts[operation]+(repair?'\nPrevious output failed validation. Correct all schema, reference, task and draft constraints.':''),input:[{role:'user',content:JSON.stringify({input:safe,records:sources.map(s=>({id:s.id,title:s.title,track:s.track,kind:s.kind,description:s.description,verifiedClaims:s.verifiedClaims,location:s.location,status:s.status,checkedAt:s.checkedAt}))})}],text:{format:{type:'json_schema',name:operation,strict:true,schema:jsonSchema(schemas[operation])}}})});
  if(!response.ok)throw Error(response.status===429?'RATE_LIMITED':'UNAVAILABLE');
  const body=await response.json() as {output?:{content?:{type?:string;text?:string}[]}[];status?:string};
  try{if(body.status!=='completed')throw Error('Incomplete');const text=body.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text||'').join('')||'';if(text.length>64000)throw Error('Too large');return validateOperation(operation,JSON.parse(text),safe,sources);}catch{repair=true;}
 }
 throw Error('INVALID_OUTPUT');
}
