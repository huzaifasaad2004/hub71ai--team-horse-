import {sameOrigin,limitedBody} from '@/lib/request-body';
import {paidAccess} from '@/lib/access';
export const runtime='nodejs';
export const maxDuration=60;
import {discoveryInput,findPlaces} from '@/lib/discovery';
let pending=0;
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403,headers});
 if(Number(request.headers.get('content-length'))>6000)return Response.json({error:'Too much search input.'},{status:413,headers});
 let input;try{const text=new TextDecoder().decode(await limitedBody(request,6000));if(text.length>6000)throw Error();input=discoveryInput.parse(JSON.parse(text));}catch{return Response.json({error:'Choose a search topic.'},{status:400,headers});}
 const key=process.env.GOOGLE_PLACES_API_KEY;
 if(!key)return Response.json({status:'unavailable',places:[],message:'Live Google Maps results are not connected yet. Open your search in Maps instead.'},{headers});
 try{const access=await paidAccess(request,'discovery');if('error' in access)return Response.json({places:[],message:access.error},{status:access.status,headers});}catch{return Response.json({places:[],message:'Sign-in is temporarily unavailable.'},{status:503,headers});}
 if(pending>=4)return Response.json({status:'unavailable',places:[],message:'Discovery is busy. Try again shortly.'},{status:429,headers});pending++;
 try{return Response.json({status:'live',places:await findPlaces(input,key,AbortSignal.timeout(8000)),checkedAt:new Date().toISOString(),message:'Matches from Google Maps. Confirm dietary needs directly with the venue.'},{headers});}catch{return Response.json({status:'unavailable',places:[],message:'Google Maps could not return results. Try again or open Maps.'},{status:503,headers});}finally{pending--;}
}
