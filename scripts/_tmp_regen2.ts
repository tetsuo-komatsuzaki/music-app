import { config } from "dotenv"; config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
const RELAY_URL=process.env.RELAY_URL!,API=process.env.RELAY_API_KEY!
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms))
async function main(){
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})})
  const ts=Date.now()
  const ids=(await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM "PracticeItem" WHERE metadata->'transposeSource' IS NOT NULL ORDER BY "createdAt" ASC`)).map(r=>r.id)
  console.log(`移調変種 再生成: ${ids.length}件 (v89, score_full, 2.5s間隔)`)
  let ok=0,err=0
  for(let i=0;i<ids.length;i++){
    const id=ids[i]
    await prisma.practiceItem.update({where:{id},data:{analysisStatus:"queued",buildStatus:"queued",executionId:null,retryCount:0}})
    try{
      const res=await fetch(`${RELAY_URL}/invoke`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${API}`},
        body:JSON.stringify({mode:"score_full",idempotency_key:`regen89:${id}:${ts}`,practice_item_id:id})})
      if(res.ok) ok++; else { err++; if(err<=8) console.log(`  ERR [${res.status}] ${(await res.text()).slice(0,60)}`) }
    }catch(e:any){ err++ }
    if((i+1)%50===0) console.log(`  ${i+1}/${ids.length} (ok=${ok} err=${err})`)
    await sleep(2500)
  }
  console.log(`ディスパッチ完了: ok=${ok} err=${err} / ${ids.length}`)
  await prisma.$disconnect()
}
main().catch(e=>{console.error(e);process.exit(1)})
