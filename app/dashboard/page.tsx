import BridgeApp from '@/components/bridge-dashboard';
export default async function Dashboard({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;const entry=query.start!==undefined?'start':query.signup!==undefined?'signup':query.login!==undefined?'login':'demo';return <BridgeApp entry={entry}/>;}
