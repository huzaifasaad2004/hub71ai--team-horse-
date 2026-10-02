import {and,eq} from 'drizzle-orm';
import {getDb} from '@/db';
import {household} from '@/db/schema';
import {signedInUser} from '@/lib/access';
import {saveSchema,snapshotSchema} from '@/lib/snapshot';
import {sameOrigin,limitedBody} from '@/lib/request-body';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
const fail=(message:string,status:number)=>Response.json({message},{status,headers});
export async function GET(request:Request){
 try{const user=await signedInUser(request);if(!user)return fail('Sign in to open your saved plan.',401);
 const [row]=await getDb().select().from(household).where(eq(household.userId,user.id));
 return Response.json(row?{snapshot:snapshotSchema.parse(row.snapshot),version:row.version,updatedAt:row.updatedAt}:{snapshot:null,version:0},{headers});
 }catch{return fail('Your saved plan is temporarily unavailable.',503);}
}
export async function PUT(request:Request){
 if(!sameOrigin(request))return fail('Invalid origin.',403);
 try{const user=await signedInUser(request);if(!user)return fail('Sign in to save your plan.',401);
 let input;try{input=saveSchema.parse(JSON.parse(new TextDecoder().decode(await limitedBody(request,200000))));}catch{return fail('Check your household and rebuild your plan before saving.',400);}
 const db=getDb(),updatedAt=new Date();
 const rows=input.version===0?await db.insert(household).values({userId:user.id,snapshot:input.snapshot,version:1,updatedAt}).onConflictDoNothing().returning():await db.update(household).set({snapshot:input.snapshot,version:input.version+1,updatedAt}).where(and(eq(household.userId,user.id),eq(household.version,input.version))).returning();
 if(!rows.length)return fail('Your saved plan changed on another device. Open that plan before saving again.',409);
 return Response.json({version:rows[0].version,updatedAt},{headers});
 }catch{return fail('Saving could not finish. Your current plan is still here.',503);}
}
export async function DELETE(request:Request){
 if(!sameOrigin(request))return fail('Invalid origin.',403);
 try{const user=await signedInUser(request);if(!user)return fail('Sign in first.',401);await getDb().delete(household).where(eq(household.userId,user.id));return Response.json({version:0},{headers});}catch{return fail('Deletion could not finish. Please try again.',503);}
}
