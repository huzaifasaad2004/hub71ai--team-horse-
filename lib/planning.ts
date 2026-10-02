import {type Week,type Bridge,validateWeek} from './contracts';
export function lightenWeek(original:Week,bridge:Bridge,saved:string[],completed:string[]):Week{
 const selected:Week['tasks']=[];
 for(let day=1;day<=7;day++){
  const candidates=original.tasks.filter(t=>t.dayIndex===day).slice().sort((a,b)=>Number(completed.includes(b.id))-Number(completed.includes(a.id))||Number(saved.includes(b.recommendationId))-Number(saved.includes(a.recommendationId)));
  if(candidates[0])selected.push(candidates[0]);
 }
 for(const task of original.tasks.filter(t=>completed.includes(t.id)&&!selected.some(s=>s.id===t.id))){
  const freeDay=Array.from({length:7},(_,i)=>i+1).find(d=>!selected.some(s=>s.dayIndex===d));
  if(freeDay){selected.push({...task,dayIndex:freeDay});continue;}
  const removable=selected.findIndex(t=>!completed.includes(t.id));
  if(removable<0)return original;
  selected[removable]={...task,dayIndex:selected[removable].dayIndex};
 }
 return validateWeek({...original,tasks:selected.sort((a,b)=>a.dayIndex-b.dayIndex)},bridge,1);
}
