import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import * as schema from './schema';
let database:ReturnType<typeof drizzle<typeof schema>>|undefined;
export function getDb(){
 if(!process.env.DATABASE_URL)throw Error('Database is not configured.');
 return database??=drizzle(neon(process.env.DATABASE_URL),{schema});
}
