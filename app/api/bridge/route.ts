import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {operations,type Operation} from '@/lib/contracts';
import {generate,inputs} from '@/lib/ai';
import {getEvidence} from '@/lib/sources';
function config(){const bindings=env as unknown as Record<string,string|undefined>;return {key:bindings.OPENAI_API_KEY||process.env.OPENAI_API_KEY,model:bindings.OPENAI_MODEL||process.env.OPENAI_MODEL};}
const failure=(code:string,message:string,status=400)=>Response.json({ok:false,error:{code,message,retryable:code!=='INVALID_INPUT'}},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const c=config();return Response.json({liveAI:!!(c.key&&c.model),message:c.key&&c.model?'Live AI configured.':'Live AI is not configured. The sample family remains fully available.'},{headers:{'Cache-Control':'no-store'}});}
const envelope=z.object({operation:z.enum(operations),input:z.unknown(),profileRevision:z.number().int().min(0).max(100000)}).strict();
let concurrent=0;
async function readBody(request:Request){if(Number(request.headers.get('content-length')||0)>131072)throw Error('Body too large');const reader=request.body?.getReader();if(!reader)throw Error('No body');let size=0,text='';const decoder=new TextDecoder();while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>131072){await reader.cancel();throw Error('Body too large');}text+=decoder.decode(value,{stream:true});}return JSON.parse(text+decoder.decode());}
export async function POST(request:Request){
 let payload:z.infer<typeof envelope>;
 try{payload=envelope.parse(await readBody(request));inputs[payload.operation].parse(payload.input);}catch{return failure('INVALID_INPUT','Check your family details and try again.');}
 const c=config();if(!c.key||!c.model)return failure('UNAVAILABLE','Live AI is not configured yet. Your details are preserved. Explore the fictional sample family to complete the journey.',503);
 if(concurrent>=4)return failure('RATE_LIMITED','The planner is busy. Try again in a moment.',429);
 concurrent++;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try{const operation:Operation=payload.operation;const evidence=operation==='UnderstandFamily'?null:await getEvidence();const sources=operation==='BuildBridge'?evidence!.records.filter(s=>inputs.BuildBridge.parse(payload.input).sourceIds.includes(s.id)):evidence?.records||[];
 const data=await generate(operation,payload.input,sources,c.key,c.model,AbortSignal.any([controller.signal,request.signal]));return Response.json({ok:true,data,meta:{mode:'live',generatedAt:new Date().toISOString(),profileRevision:payload.profileRevision,warnings:[],evidenceMode:evidence?.evidenceMode||'sample'},evidence},{headers:{'Cache-Control':'no-store'}});
 }catch(e){const code=controller.signal.aborted?'TIMEOUT':e instanceof Error&&['RATE_LIMITED','INVALID_OUTPUT'].includes(e.message)?e.message:'UNAVAILABLE';return failure(code,code==='TIMEOUT'?'The live planner timed out. Retry or explore the sample family.':code==='INVALID_OUTPUT'?'The live planner returned an invalid result. Your details are preserved. Retry or use the sample family.':'The live planner is unavailable. Retry or explore the sample family.',503);}finally{clearTimeout(timeout);concurrent--;}
}
