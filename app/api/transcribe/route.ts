import {sameOrigin,limitedBody} from '@/lib/request-body';
import {paidAccess} from '@/lib/access';
export const runtime='nodejs';
export const maxDuration=60;
let pending=0;
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403,headers});
 const key=process.env.OPENAI_API_KEY,model=process.env.OPENAI_TRANSCRIPTION_MODEL;
 if(!key||!model)return Response.json({error:'Voice transcription is not connected yet. Your recording stays here; you can listen, download it, or use the choice-based setup.'},{status:503,headers});
 if(Number(request.headers.get('content-length'))>3200000)return Response.json({error:'Keep your recording under 3 MB.'},{status:413,headers});
 try{const access=await paidAccess(request,'voice');if('error' in access)return Response.json({error:access.error},{status:access.status,headers});}catch{return Response.json({error:'Sign-in is temporarily unavailable.'},{status:503,headers});}
 if(pending>=2)return Response.json({error:'Voice transcription is busy. Try again shortly.'},{status:429,headers});pending++;
 try{const bytes=await limitedBody(request,3200000);const data=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData(),file=data.get('file');if(!(file instanceof File)||file.size>3000000||!file.size||!['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg'].some(t=>file.type.startsWith(t)))return Response.json({error:'Choose a supported recording under 3 MB.'},{status:400,headers});const form=new FormData();form.set('file',file);form.set('model',model);form.set('response_format','json');const result=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',signal:AbortSignal.timeout(25000),headers:{Authorization:'Bearer '+key},body:form});if(!result.ok)throw Error();const output=await result.json() as {text?:unknown};if(typeof output.text!=='string'||output.text.length>5000)throw Error();return Response.json({text:output.text},{headers});}catch{return Response.json({error:'Transcription could not finish. Your recording is preserved.'},{status:503,headers});}finally{pending--;}
}
