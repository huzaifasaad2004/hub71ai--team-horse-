import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {getDb} from '@/db';
import * as schema from '@/db/schema';
export function authConfigured(){return !!(process.env.DATABASE_URL&&process.env.BETTER_AUTH_SECRET&&process.env.BETTER_AUTH_URL);}
const createAuth=()=>betterAuth({appName:'BRIDGE',baseURL:process.env.BETTER_AUTH_URL,secret:process.env.BETTER_AUTH_SECRET,
 database:drizzleAdapter(getDb(),{provider:'pg',schema}),
 emailAndPassword:{enabled:true,minPasswordLength:8,maxPasswordLength:128},
 socialProviders:process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET?{google:{clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,prompt:'select_account'}}:{},
 advanced:{ipAddress:{ipAddressHeaders:['x-vercel-forwarded-for']}},
 account:{encryptOAuthTokens:true},session:{expiresIn:60*60*24*7,updateAge:60*60*24},
 rateLimit:{enabled:true,storage:'database',window:60,max:30},
});
let auth:ReturnType<typeof createAuth>|undefined;
export function getAuth(){
 if(!authConfigured())throw Error('Sign-in is not configured.');
 return auth??=createAuth();
}
