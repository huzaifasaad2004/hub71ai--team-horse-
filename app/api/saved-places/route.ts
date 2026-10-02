import {z} from 'zod';
import {paidAccess} from '@/lib/access';
import {placeDetails} from '@/lib/discovery';
import {sameOrigin,limitedBody} from '@/lib/request-body';
export const runtime='nodejs';
export const maxDuration=30;
const inputSchema=z.object({ids:z.array(z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/)).max(20)}).strict();
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!sameOrigin(request))return Response.json({message:'Invalid origin.'},{status:403,headers});
 try{const input=inputSchema.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,6000))));
 const key=process.env.GOOGLE_PLACES_API_KEY;if(!key)return Response.json({places:[]},{headers});
 const access=await paidAccess(request,'discovery');if('error' in access)return Response.json({message:access.error},{status:access.status,headers});
 // Small batches bound upstream concurrency. Google venue content is never stored.
 const places=[];for(let i=0;i<input.ids.length;i+=3){const batch=await Promise.allSettled(input.ids.slice(i,i+3).map(id=>placeDetails(id,key,AbortSignal.timeout(5000))));for(const result of batch)if(result.status==='fulfilled'&&result.value)places.push(result.value);}
 return Response.json({places},{headers});
 }catch{return Response.json({message:'Saved place details could not refresh.'},{status:503,headers});}
}
