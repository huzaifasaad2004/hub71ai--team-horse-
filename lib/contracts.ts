import { z } from 'zod';
const text = (max: number) => z.string().max(max);
const list = z.array(text(240)).max(8);
const id = z.string().min(1).max(100);
export const trackSchema = z.enum(['career','community','family','personal']);
export type Track = z.infer<typeof trackSchema>;
export const tracks: Track[] = ['career','community','family','personal'];
export const personSchema = z.object({id,name:text(80),role:z.enum(['employee','partner','child','other']),age:z.number().int().min(0).max(120).nullable(),profession:text(100).nullable(),experienceYears:z.number().min(0).max(80).nullable(),goals:list,interests:list,concerns:list}).strict();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v).nullable();
export const profileSchema = z.object({id,originCity:text(100).nullable(),destinationCity:z.literal('Abu Dhabi'),preferredArea:text(100).nullable(),employerContext:text(240).nullable(),arrivalDate:date,people:z.array(personSchema).min(1).max(20),constraints:z.object({budgetNote:text(240).nullable(),transport:text(240).nullable(),childcare:text(240).nullable(),availability:text(240).nullable()}).strict(),facts:z.array(z.object({fieldPath:text(120),evidence:z.enum(['user_stated','user_confirmed','planning_assumption']),text:text(240)}).strict()).max(80),unknowns:z.array(text(240)).max(12),assumptions:z.array(text(240)).max(12)}).strict().refine(p=>new Set(p.people.map(x=>x.id)).size===p.people.length,'Duplicate person IDs');
export type Profile = z.infer<typeof profileSchema>;
export const understandSchema=z.object({profile:profileSchema,reviewSummary:text(600),clarifyingQuestions:z.array(z.object({fieldPath:text(120),question:text(240)}).strict()).max(3)}).strict();
export const sourceSchema=z.object({id,title:text(150),url:z.string().url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password}),publisher:text(100),checkedAt:z.string().datetime().nullable(),verifiedClaims:z.array(text(360)).max(5),verification:z.enum(['checked','unverified']),status:z.enum(['live','cached','checked','sample']),track:trackSchema,kind:z.enum(['job','official','resource']),description:text(500),location:text(120).nullable()}).strict();
export type Source = z.infer<typeof sourceSchema>;
export const evidenceSchema=z.object({records:z.array(sourceSchema).max(20),health:z.array(z.object({name:text(100),status:z.enum(['live','cached','unavailable','checked']),message:text(300)}).strict()).max(8),evidenceMode:z.enum(['live','cached','mixed','sample']),retrievedAt:z.string().datetime()}).strict();
export type Evidence = z.infer<typeof evidenceSchema>;
export const recSchema=z.object({id,title:text(100),track:trackSchema,personIds:z.array(id).min(1).max(20),kind:z.enum(['self_directed','catalog_resource']),catalogId:id.nullable(),sourceIds:z.array(id).max(5),rationale:text(360),nextStep:text(300),effortMinutes:z.number().int().min(5).max(120),effortLabel:z.literal('planning_estimate'),requiresChecking:list,actionIntent:z.enum(['draft_introduction','portfolio_checklist','none'])}).strict();
export type Recommendation=z.infer<typeof recSchema>;
export const bridgeSchema=z.object({id,profileId:id,headline:text(120),summary:text(500),tracks:z.array(z.object({id:trackSchema,goal:text(200),recommendationIds:z.array(id).max(6)}).strict()).length(4),recommendations:z.array(recSchema).min(8).max(12),featuredRecommendationId:id,assumptions:z.array(text(240)).max(12)}).strict();
export type Bridge=z.infer<typeof bridgeSchema>;
export const taskSchema=z.object({id,dayIndex:z.number().int().min(1).max(7),recommendationId:id,title:text(100),personIds:z.array(id).min(1).max(20),track:trackSchema,effortMinutes:z.number().int().min(5).max(120),timeWindow:z.enum(['flexible','morning','afternoon','evening']),rationale:text(360),requiresChecking:list}).strict();
export const weekSchema=z.object({id,bridgeId:id,startDate:date,timezone:z.literal('Asia/Dubai'),tasks:z.array(taskSchema).min(1).max(14),assumptions:z.array(text(240)).max(12)}).strict();
export type Week=z.infer<typeof weekSchema>;
export const draftSchema=z.object({id,recommendationId:id,intent:z.enum(['draft_introduction','portfolio_checklist']),title:text(100),channel:text(160),recipientLabel:text(160).nullable(),recipientAddress:z.null(),subject:text(160).nullable(),body:text(2000),checklist:list,sourceIds:z.array(id).max(5),reviewNotes:list,executionStatus:z.literal('draft_only')}).strict();
export type Draft=z.infer<typeof draftSchema>;
export const operations=['UnderstandFamily','BuildBridge','BuildOurWeek','ActionAgent'] as const;
export type Operation=typeof operations[number];
export type Meta={mode:'live'|'sample'|'local';generatedAt:string;profileRevision:number;warnings:string[];evidenceMode:Evidence['evidenceMode']};
export type Result<T>={ok:true;data:T;meta:Meta}|{ok:false;error:{code:'INVALID_INPUT'|'UNAVAILABLE'|'TIMEOUT'|'INVALID_OUTPUT'|'RATE_LIMITED';message:string;retryable:boolean}};
export function validateBridge(raw:unknown,profile:Profile,sources:Source[]):Bridge {
 const b=bridgeSchema.parse(raw), people=new Set(profile.people.map(p=>p.id)),ids=new Set(b.recommendations.map(r=>r.id)),src=new Set(sources.map(s=>s.id));
 if(b.profileId!==profile.id || new Set(b.tracks.map(t=>t.id)).size!==4 || ids.size!==b.recommendations.length || !ids.has(b.featuredRecommendationId))throw Error('Plan integrity');
 for(const r of b.recommendations){if(r.personIds.some(i=>!people.has(i))||r.sourceIds.some(i=>!src.has(i)))throw Error('Unknown reference');if(r.kind==='self_directed'&&(r.catalogId!==null||r.sourceIds.length))throw Error('Suggestion cannot claim evidence');if(r.kind==='catalog_resource'&&(!r.catalogId||!src.has(r.catalogId)||!r.sourceIds.includes(r.catalogId)))throw Error('Missing catalog evidence');}
 for(const t of b.tracks){const expected=b.recommendations.filter(r=>r.track===t.id).map(r=>r.id);if(t.recommendationIds.length!==expected.length||new Set(t.recommendationIds).size!==expected.length||t.recommendationIds.some(i=>!expected.includes(i)))throw Error('Track integrity');} return b;
}
export function validateWeek(raw:unknown,b:Bridge,max=2):Week{const w=weekSchema.parse(raw);if(w.bridgeId!==b.id||new Set(w.tasks.map(t=>t.id)).size!==w.tasks.length)throw Error('Week integrity');for(let d=1;d<=7;d++)if(w.tasks.filter(t=>t.dayIndex===d).length>max)throw Error('Day capacity');for(const t of w.tasks){const r=b.recommendations.find(r=>r.id===t.recommendationId);if(!r||r.track!==t.track||t.personIds.some(i=>!r.personIds.includes(i)))throw Error('Task reference');}return w;}
export function validateDraft(raw:unknown,r:Recommendation):Draft{const d=draftSchema.parse(raw);if(d.recommendationId!==r.id||d.sourceIds.some(i=>!r.sourceIds.includes(i)))throw Error('Draft reference');return d;}
