import {getEvidence} from '@/lib/sources';
export async function GET(){return Response.json(await getEvidence(),{headers:{'Cache-Control':'no-store'}});}
