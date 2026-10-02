import {type Result,type Operation,type Meta} from './contracts';
export async function liveOperation<T>(operation:Operation,input:unknown,revision:number,signal:AbortSignal):Promise<{data:T;meta:Meta}>{
 const res=await fetch('/api/bridge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,input,profileRevision:revision}),signal});const result:Result<T>=await res.json();if(!result.ok)throw Error(result.error.message);return {data:result.data,meta:result.meta};
}
