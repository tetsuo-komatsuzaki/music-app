import { config } from "dotenv"
config()
import { createClient } from "@supabase/supabase-js"
import { writeFileSync } from "fs"
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function dl(path: string, out: string) {
  const { data, error } = await supa.storage.from("musicxml").download(path)
  if (error) { console.log("ERR", path, error.message); return }
  writeFileSync(out, Buffer.from(await data.arrayBuffer()))
  console.log("ok", out, (await data.arrayBuffer.length) ?? "")
}
async function main() {
  await dl("practice/cmt83u3es000004jv4ek767ma/original.musicxml", "_tmp/k23_original.musicxml")
  await dl("practice/cmtd8q511000304l3d34g7tam/build_score.musicxml", "_tmp/k23_part4_build.musicxml")
  await dl("practice/cmt82y17m000404jptdx7gsxr/original.musicxml", "_tmp/k17_original.musicxml")
}
main()
