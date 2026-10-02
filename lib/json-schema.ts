import {z} from 'zod';
// Only the schema types used by BRIDGE are supported. Runtime refinements remain authoritative.
export function jsonSchema(s:z.ZodTypeAny):Record<string,unknown>{
 if(s instanceof z.ZodEffects)return jsonSchema(s.innerType());
 if(s instanceof z.ZodNullable)return {anyOf:[jsonSchema(s.unwrap()),{type:'null'}]};
 if(s instanceof z.ZodObject){const shape=s.shape as Record<string,z.ZodTypeAny>;return {type:'object',properties:Object.fromEntries(Object.entries(shape).map(([k,v])=>[k,jsonSchema(v)])),required:Object.keys(shape),additionalProperties:false};}
 if(s instanceof z.ZodArray)return {type:'array',items:jsonSchema(s.element)};
 if(s instanceof z.ZodEnum)return {type:'string',enum:s.options};
 if(s instanceof z.ZodLiteral)return {type:typeof s.value,enum:[s.value]};
 if(s instanceof z.ZodString)return {type:'string'};
 if(s instanceof z.ZodNumber)return {type:s.isInt?'integer':'number'};
 if(s instanceof z.ZodNull)return {type:'null'};
 throw Error('Unsupported output schema');
}
