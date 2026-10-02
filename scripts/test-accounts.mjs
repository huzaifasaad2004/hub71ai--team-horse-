import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
if(!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET)throw Error('Set test database and auth secret first.');
await mkdir('work',{recursive:true});
await build({entryPoints:['tests/accounts.integration.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:'work/test-accounts.mjs',target:'node22'});
const result=spawnSync(process.execPath,['work/test-accounts.mjs'],{stdio:'inherit'});process.exit(result.status??1);
