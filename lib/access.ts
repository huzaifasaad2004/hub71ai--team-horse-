import {and,eq,lt,sql} from 'drizzle-orm';
import {getDb} from '@/db';
import {usage} from '@/db/schema';
import {authConfigured,getAuth} from './auth';
export async function signedInUser(request:Request){
 if(!authConfigured())return null;
 const session=await getAuth().api.getSession({headers:request.headers});
 return session?.user??null;
}
export const limits={planner:10,voice:10,discovery:50} as const;
export async function paidAccess(request:Request,action:keyof typeof limits){
 const user=await signedInUser(request);
 if(!user)return {error:'Sign in to use live recommendations and voice.',status:401} as const;
 const day=new Date().toISOString().slice(0,10),db=getDb();
 // One atomic update enforces the quota across concurrent Vercel instances.
 const rows=await db.insert(usage).values({userId:user.id,day,action,count:1}).onConflictDoUpdate({target:[usage.userId,usage.day,usage.action],set:{count:sql`${usage.count}+1`},setWhere:and(eq(usage.day,day),lt(usage.count,limits[action]))}).returning({count:usage.count});
 if(!rows.length)return {error:'You have reached today’s live limit. Your plan and saved items are still available.',status:429} as const;
 return {user} as const;
}
