import type {Profile,Bridge,Week,Draft,Evidence,Meta} from './contracts';
export type View='welcome'|'family'|'bridge'|'week'|'action';
export type State={view:View;narrative:string;profile:Profile|null;confirmed:boolean;revision:number;focus:string;bridge:Bridge|null;week:Week|null;fullWeek:Week|null;draft:Draft|null;active:string|null;saved:string[];completed:string[];prepared:string[];lighter:boolean;mode:'live'|'sample'|'local';evidence:Evidence|null;meta:Meta|null;error:string;loading:string;notice:string;};
export const initial:State={view:'welcome',narrative:'',profile:null,confirmed:false,revision:0,focus:'sara',bridge:null,week:null,fullWeek:null,draft:null,active:null,saved:[],completed:[],prepared:[],lighter:false,mode:'live',evidence:null,meta:null,error:'',loading:'',notice:''};
export type Action={type:'patch';patch:Partial<State>}|{type:'reset'}|{type:'profile';profile:Profile}|{type:'story';value:string}|{type:'toggle';key:'saved'|'completed'|'prepared';id:string};
export function reducer(s:State,a:Action):State{
 if(a.type==='reset')return {...initial,revision:s.revision+1};
 if(a.type==='profile')return {...s,profile:a.profile,confirmed:false,revision:s.revision+1,bridge:null,week:null,fullWeek:null,draft:null,saved:[],completed:[],prepared:[],lighter:false,error:'',loading:'',notice:'Your family details changed; rebuild the plan.'};
 if(a.type==='story')return {...s,narrative:a.value,profile:null,confirmed:false,revision:s.revision+1,bridge:null,week:null,fullWeek:null,draft:null,saved:[],completed:[],prepared:[],meta:null,error:'',loading:''};
 if(a.type==='toggle')return {...s,[a.key]:s[a.key].includes(a.id)?s[a.key].filter(id=>id!==a.id):[...s[a.key],a.id]};
 return {...s,...a.patch};
}
export function mayCommit(token:number,current:number,revision:number,currentRevision:number,mode:string,currentMode:string){return token===current&&revision===currentRevision&&mode===currentMode;}
