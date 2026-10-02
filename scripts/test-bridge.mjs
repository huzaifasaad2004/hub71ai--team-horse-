import {build} from 'esbuild';
import {spawn} from 'node:child_process';
const result=await build({entryPoints:['tests/domain.test.ts'],bundle:true,platform:'node',format:'esm',write:false,target:'node22'});
const child=spawn(process.execPath,['--input-type=module'],{stdio:['pipe','inherit','inherit']});
child.stdin.end(result.outputFiles[0].text);
child.on('exit',code=>process.exit(code??1));
