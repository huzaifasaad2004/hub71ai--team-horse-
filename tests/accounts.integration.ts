// Uses the configured database and disposable fixture identities; no Google requests.
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {inArray} from 'drizzle-orm';
import {getDb} from '../db';
import {user,session} from '../db/schema';
import {GET,PUT,DELETE} from '../app/api/household/route';
import {paidAccess,signedInUser} from '../lib/access';
import {getAuth} from '../lib/auth';
import {buildSample,buildWeek,sampleProfile} from '../lib/fixtures';
import {defaultLifestyle} from '../lib/lifestyle';
const db=getDb(),ids=[randomUUID(),randomUUID()],tokens=[randomUUID(),randomUUID()];
const origin=process.env.BETTER_AUTH_URL!;
const cookie=(token:string)=>'better-auth.session_token='+encodeURIComponent(token+'.'+createHmac('sha256',process.env.BETTER_AUTH_SECRET!).update(token).digest('base64'));
function request(method:string,owner?:number,body?:unknown,extra:Record<string,string>={}){return new Request(origin+'/api/household',{method,headers:{'x-forwarded-for':'127.0.0.1',Origin:origin,'Content-Type':'application/json',...(owner===undefined?{}:{Cookie:cookie(tokens[owner])}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});}
const b=buildSample(),w=buildWeek(b),snapshot={profile:sampleProfile,prefs:defaultLifestyle,bridge:b,week:w,fullWeek:w,draft:null,saved:[],completed:[],prepared:[],lighter:false,mode:'sample',focus:'everyone',selected:'sara',savedPlaceIds:[],savedAreas:[]};
try{
 await db.insert(user).values(ids.map(id=>({id,name:'Disposable account fixture',email:id+'@example.invalid',emailVerified:true})));
 await db.insert(session).values(ids.map((id,i)=>({id:randomUUID(),userId:id,token:tokens[i],expiresAt:new Date(Date.now()+600000)})));
 assert.equal((await GET(request('GET'))).status,401);
 assert.equal(await signedInUser(request('GET',undefined,undefined,{'X-User-Id':ids[0],Cookie:'better-auth.session_token=forged'})),null);
 assert.equal((await signedInUser(request('GET',0)))?.id,ids[0]);
 assert.equal((await PUT(request('PUT',0,{version:0,snapshot}))).status,200);
 const own=await (await GET(request('GET',0))).json() as {version:number;snapshot:unknown};assert.equal(own.version,1);assert.deepEqual(own.snapshot,snapshot);
 const other=await (await GET(request('GET',1))).json() as {snapshot:unknown};assert.equal(other.snapshot,null);
 assert.equal((await PUT(request('PUT',1,{version:0,snapshot,userId:ids[0]}))).status,400);
 const concurrent=await Promise.all([PUT(request('PUT',0,{version:1,snapshot})),PUT(request('PUT',0,{version:1,snapshot}))]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 assert.equal((await PUT(request('PUT',0,{version:2,snapshot}, {Origin:'https://unrelated.invalid'}))).status,403);
 const quota=await Promise.all(Array.from({length:12},()=>paidAccess(request('POST',0),'planner')));assert.equal(quota.filter(q=>'user' in q).length,10);assert.equal(quota.filter(q=>'error' in q&&q.status===429).length,2);
 assert.equal((await DELETE(request('DELETE',1))).status,200);assert.equal((await (await GET(request('GET',0))).json() as {version:number}).version,2);
 assert.equal((await DELETE(request('DELETE',0))).status,200);assert.equal((await (await GET(request('GET',0))).json() as {snapshot:unknown}).snapshot,null);
 // Verify real password hashing and a separate email sign-in session.
 const email=randomUUID()+'@example.invalid',password=randomUUID()+'-Secure8!';
 const signup=await getAuth().handler(new Request(origin+'/api/auth/sign-up/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name:'Disposable signup fixture',email,password})}));
 assert.equal(signup.status,200);const signupBody=await signup.json() as {user:{id:string}};ids.push(signupBody.user.id);
 const login=await getAuth().handler(new Request(origin+'/api/auth/sign-in/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,password})}));assert.equal(login.status,200);
 const denied=await getAuth().handler(new Request(origin+'/api/auth/sign-in/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,password:'incorrect-password'})}));assert.equal(denied.status,401);
 // Verify the OAuth redirect is Google with state and the exact app callback, without signing in.
 const response=await getAuth().handler(new Request(origin+'/api/auth/sign-in/social',{method:'POST',headers:{'x-forwarded-for':'127.0.0.1',Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({provider:'google',callbackURL:'/',disableRedirect:true})}));
 assert.equal(response.status,200);const auth=await response.json() as {url:string};const url=new URL(auth.url);assert.equal(url.hostname,'accounts.google.com');assert.equal(url.searchParams.get('redirect_uri'),origin+'/api/auth/callback/google');assert.ok(url.searchParams.get('state'));
 console.log('Account isolation, session signatures, concurrent saves, quotas, deletion email signup, password sign-in and Google redirect passed.');
}finally{await db.delete(user).where(inArray(user.id,ids));}
