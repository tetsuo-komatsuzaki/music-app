import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import * as dotenv from "dotenv"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = "musicxml"
const MXL_DIR = path.join(__dirname, "..", "prisma", "data", "mxl")
const OUTPUT_JSON = path.join(__dirname, "..", "prisma", "data", "mxl_urls.json")
const CONCURRENCY = 5

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const files = fs.readdirSync(MXL_DIR).filter(f => f.endsWith(".mxl"))
  console.log(`Found ${files.length} .mxl files`)

  const results: Record<string, string> = {}
  let uploaded = 0
  let failed = 0

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const promises = batch.map(async (filename) => {
      const filePath = path.join(MXL_DIR, filename)
      const fileBuffer = fs.readFileSync(filePath)
      const storagePath = `practice-items/scales/${filename}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: "application/vnd.recordare.musicxml+xml",
          upsert: true,
        })

      if (error) {
        console.error(`FAIL: ${filename} - ${error.message}`)
        return { filename, success: false }
      }

      results[filename] = storagePath
      return { filename, success: true }
    })

    const settled = await Promise.allSettled(promises)
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value.success) uploaded++
      else failed++
    }

    if ((i + CONCURRENCY) % 100 < CONCURRENCY) {
      console.log(`Progress: ${Math.min(i + CONCURRENCY, files.length)}/${files.length}`)
    }
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2))

  console.log(`\nUpload complete:`)
  console.log(`  Uploaded: ${uploaded}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  URLs saved to: ${OUTPUT_JSON}`)
}

main().catch(console.error)
