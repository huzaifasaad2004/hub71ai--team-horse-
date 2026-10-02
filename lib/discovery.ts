import {z} from 'zod';
export const discoveryInput=z.object({kind:z.enum(['food','social']),topic:z.string().trim().min(1).max(60),area:z.string().trim().max(100),diet:z.array(z.string().max(60)).max(8),avoid:z.array(z.string().max(60)).max(8),budget:z.enum(['Explore all','Everyday','Treat yourself'])}).strict();
export type DiscoveryInput=z.infer<typeof discoveryInput>;
export type Place={id:string;name:string;address:string;url:string;rating:number|null;ratings:number|null;attributions:{name:string;url:string}[]};
const safeUrl=(s:unknown)=>{if(typeof s!=='string')return null;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?s:null;}catch{return null;}};
export async function findPlaces(input:DiscoveryInput,key:string,signal:AbortSignal):Promise<Place[]>{
 const query=input.kind==='food'?[input.diet.slice(0,1).join(' '),input.topic,input.topic==='Coffee'?'cafes':'restaurants',input.area,'Abu Dhabi UAE'].filter(Boolean).join(' '):[input.topic,input.avoid.includes('Intense workouts')?'beginner friendly clubs classes':'clubs classes',input.avoid.includes('Crowds')?'small groups':'',input.avoid.includes('Loud venues')?'quiet':'',input.area,'Abu Dhabi UAE'].join(' ');
 const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',signal,redirect:'manual',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.rating,places.userRatingCount,places.attributions,places.businessStatus,places.location'},body:JSON.stringify({textQuery:query,pageSize:6,regionCode:'AE',languageCode:'en',locationRestriction:{rectangle:{low:{latitude:24.20,longitude:54.20},high:{latitude:24.65,longitude:54.90}}},...(input.kind==='food'&&input.budget!=='Explore all'?{priceLevels:input.budget==='Everyday'?['PRICE_LEVEL_INEXPENSIVE','PRICE_LEVEL_MODERATE']:['PRICE_LEVEL_EXPENSIVE','PRICE_LEVEL_VERY_EXPENSIVE']}:{})})});
 if(!response.ok)throw Error('PLACES_UNAVAILABLE');const raw=await response.text();if(raw.length>250000)throw Error('PLACES_UNAVAILABLE');const data=JSON.parse(raw) as {places?:Record<string,unknown>[]};if(!Array.isArray(data.places))return [];
 return data.places.flatMap(p=>{const place=normalizePlace(p);return place?[place]:[];});
}
function normalizePlace(p:Record<string,unknown>):Place|null{
 if(p.businessStatus==='CLOSED_PERMANENTLY')return null;
 const name=(p.displayName as {text?:unknown})?.text,url=safeUrl(p.googleMapsUri);
 if(typeof name!=='string'||!url||typeof p.id!=='string')return null;
 return {id:p.id,name:name.slice(0,150),address:typeof p.formattedAddress==='string'?p.formattedAddress.slice(0,240):'',url,rating:typeof p.rating==='number'?p.rating:null,ratings:typeof p.userRatingCount==='number'?p.userRatingCount:null,attributions:Array.isArray(p.attributions)?p.attributions.flatMap(a=>{const v=a as {provider?:unknown;providerUri?:unknown},u=safeUrl(v.providerUri);return typeof v.provider==='string'&&u?[{name:v.provider,url:u}]:[];}):[]};
}
export async function placeDetails(id:string,key:string,signal:AbortSignal):Promise<Place|null>{
 const response=await fetch('https://places.googleapis.com/v1/places/'+encodeURIComponent(id)+'?languageCode=en&regionCode=AE',{signal,redirect:'manual',headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'id,displayName,formattedAddress,googleMapsUri,attributions,businessStatus'}});
 if(!response.ok)throw Error('PLACES_UNAVAILABLE');const raw=await response.text();if(raw.length>50000)throw Error('PLACES_UNAVAILABLE');return normalizePlace(JSON.parse(raw) as Record<string,unknown>);
}
