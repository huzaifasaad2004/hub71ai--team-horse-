import {sameOrigin,limitedBody} from '@/lib/request-body';
import {env} from 'cloudflare:workers';
let pending=0;
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403,headers});
 const bindings=env as unknown as Record<string,string>;const key=bindings.OPENAI_API_KEY||process.env.OPENAI_API_KEY,model=bindings.OPENAI_TRANSCRIPTION_MODEL||process.env.OPENAI_TRANSCRIPTION_MODEL;
 if(!key||!model)return Response.json({error:'Voice transcription is not connected yet. Your recording stays here; you can listen, download it, or use the choice-based setup.'},{status:503,headers});
 if(Number(request.headers.get('content-length'))>6000000)return Response.json({error:'Keep your recording under 5 MB.'},{status:413,headers});
 if(pending>=2)return Response.json({error:'Voice transcription is busy. Try again shortly.'},{status:429,headers});pending++;
 try{const bytes=await limitedBody(request,6000000);const data=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData(),file=data.get('file');if(!(file instanceof File)||file.size>5000000||!file.size||!['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg'].some(t=>file.type.startsWith(t)))return Response.json({error:'Choose a supported recording under 5 MB.'},{status:400,headers});const form=new FormData();form.set('file',file);form.set('model',model);form.set('response_format','json');const result=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',signal:AbortSignal.timeout(25000),headers:{Authorization:'Bearer '+key},body:form});if(!result.ok)throw Error();const output=await result.json() as {text?:unknown};if(typeof output.text!=='string'||output.text.length>5000)throw Error();return Response.json({text:output.text},{headers});}catch{return Response.json({error:'Transcription could not finish. Your recording is preserved.'},{status:503,headers});}finally{pending--;}
}
