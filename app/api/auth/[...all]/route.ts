import {toNextJsHandler} from 'better-auth/next-js';
import {authConfigured,getAuth} from '@/lib/auth';
export const runtime='nodejs';
async function handler(request:Request){
 if(!authConfigured())return Response.json({message:'Account sign-in is being connected.'},{status:503,headers:{'Cache-Control':'no-store'}});
 return toNextJsHandler(getAuth())[request.method==='GET'?'GET':'POST'](request);
}
export {handler as GET,handler as POST};
