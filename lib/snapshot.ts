import {z} from 'zod';
import {profileSchema,bridgeSchema,weekSchema,draftSchema,validateWeek,validateDraft} from './contracts';
import {lifestyleSchema,areas} from './lifestyle';
const ids=z.array(z.string().min(1).max(200)).max(50).refine(v=>new Set(v).size===v.length);
export const snapshotSchema=z.object({profile:profileSchema,prefs:lifestyleSchema,bridge:bridgeSchema.nullable(),week:weekSchema.nullable(),fullWeek:weekSchema.nullable(),draft:draftSchema.nullable(),saved:ids,completed:ids,prepared:ids,lighter:z.boolean(),mode:z.enum(['sample','local','live']),focus:z.string().max(100),selected:z.string().max(100),savedPlaceIds:z.array(z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/)).max(20),savedAreas:z.array(z.enum(areas.map(a=>a.id) as [string,...string[]])).max(4)}).strict().superRefine((s,ctx)=>{
 const invalid=()=>ctx.addIssue({code:'custom',message:'Plan references do not match your household.'});
 const people=new Set(s.profile.people.map(p=>p.id));
 if(s.selected&&!people.has(s.selected)||s.focus!=='everyone'&&!people.has(s.focus))invalid();
 if(Object.keys(s.prefs.socialLinks).some(id=>!people.has(id)))invalid();
 if(!s.bridge){if(s.week||s.fullWeek||s.draft||s.saved.length||s.completed.length||s.prepared.length)invalid();return;}
 const b=s.bridge,rec=new Set(b.recommendations.map(r=>r.id));
 if(b.profileId!==s.profile.id||rec.size!==b.recommendations.length||!rec.has(b.featuredRecommendationId)||b.recommendations.some(r=>r.personIds.some(id=>!people.has(id)))||new Set(b.tracks.map(t=>t.id)).size!==4)invalid();
 for(const t of b.tracks){const expected=b.recommendations.filter(r=>r.track===t.id).map(r=>r.id);if(t.recommendationIds.length!==expected.length||new Set(t.recommendationIds).size!==expected.length||t.recommendationIds.some(id=>!expected.includes(id)))invalid();}
 try{if(s.week)validateWeek(s.week,b);if(s.fullWeek)validateWeek(s.fullWeek,b);if(s.draft){const r=b.recommendations.find(r=>r.id===s.draft?.recommendationId);if(!r)throw Error();validateDraft(s.draft,r);}}catch{invalid();}
 const tasks=new Set((s.fullWeek||s.week)?.tasks.map(t=>t.id)||[]);
 if(s.saved.some(id=>!rec.has(id))||s.prepared.some(id=>!new Set(s.draft?.checklist.map((_,i)=>s.draft!.id+'-'+i)||[]).has(id))||s.completed.some(id=>!tasks.has(id)))invalid();
});
export type Snapshot=z.infer<typeof snapshotSchema>;
export const saveSchema=z.object({version:z.number().int().min(0).max(2147483646),snapshot:snapshotSchema}).strict();
