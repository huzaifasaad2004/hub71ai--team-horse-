import {authConfigured} from '@/lib/auth';
export async function GET(){return Response.json({login:authConfigured(),maps:!!process.env.GOOGLE_PLACES_API_KEY,ai:!!(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL)},{headers:{'Cache-Control':'no-store'}});}
