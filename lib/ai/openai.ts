import OpenAI from 'openai';
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
export async function withRetry<T>(fn:()=>Promise<T>,attempts=4):Promise<T>{let last:unknown; for(let i=0;i<attempts;i++){try{return await fn()}catch(e){last=e; if(i===attempts-1)break; await new Promise(r=>setTimeout(r,Math.min(1000*2**i,8000)));}} throw last instanceof Error?last:new Error('AI request failed');}
export {client};
