import { chromium } from "playwright"
const url = "https://www.genspark.ai/api/files/s/d5XajlOY?token=Z0FBQUFBQnFsQ1QyYlRLYlVacVh6Y1UxX0hLS01RY28xSE5oaFN0aHE5VzEzMmwxRkdLemg1ek0yLWRFUHBkc2ZtZ3NMeWliank4S2N0Z1FhTkcwOERHTjJEU3BuU0xOSzc5ZWlCdUJoUjJxLUh3U2lSMlhZeExqY1hfMFNobi1iY2F5cWxpZDBfUUxfWW9WOVRoUnVmcnNTRFJ5d1JJWjhkVjB6Q014Y1VCUnpxTFZELTd5T3NXY2NHYzJGY2FGYkRIUDB3ZzRaMDQ5RXFmRUpMVHB1ZUZxcE9YdnhGU2ljeXZNSWVrRExqekRsb0ZVM0VtYnplMjBpZGY4eTJydmlYZkZoZDRRMkZ3dzlsclVqWGRfUkJacWprQmhYTjg0enc9PQ"
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
console.log("status:", resp.status())
const body = await resp.text()
console.log("length:", body.length)
console.log(body.slice(0, 200))
if (body.length > 1000) {
  const fs = await import("fs")
  fs.writeFileSync("C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide/genspark_nintei_v8.html", body)
  console.log("saved")
}
await browser.close()
