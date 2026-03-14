module.exports = [
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$generated$2f$prisma$2f$client$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/client.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/adapter-pg/dist/index.mjs [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PrismaPg"]({
    connectionString: process.env.DATABASE_URL
});
const prisma = new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$generated$2f$prisma$2f$client$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PrismaClient"]({
    adapter
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/supabaseServer.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createServerSupabaseClient",
    ()=>createServerSupabaseClient
]);
// app/_libs/supabaseServer.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function createServerSupabaseClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://wglnquvppatpnhzdgekm.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbG5xdXZwcGF0cG5oemRnZWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDkzNzQsImV4cCI6MjA4NzE4NTM3NH0.I9CxbxqNXyExnIrOPbPqAzQqGVQGurerX1x-lkYThLk"), {
        cookies: {
            get (name) {
                return cookieStore.get(name)?.value;
            },
            set (name, value, options) {
                cookieStore.set({
                    name,
                    value,
                    ...options
                });
            },
            remove (name, options) {
                cookieStore.set({
                    name,
                    value: "",
                    ...options
                });
            }
        }
    });
}
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/actions/uploadPracticeItem.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"40ede48aaf7d0475bb220a664d1f2e14b46cca59b8":"uploadPracticeItem"},"",""] */ __turbopack_context__.s([
    "uploadPracticeItem",
    ()=>uploadPracticeItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$supabaseServer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/supabaseServer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
async function uploadPracticeItem(formData) {
    console.log("▶ uploadPracticeItem START");
    // 管理者チェック
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$supabaseServer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {
        error: "ログインが必要です"
    };
    const dbUser = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            supabaseUserId: user.id
        }
    });
    if (!dbUser || dbUser.role !== "admin") return {
        error: "管理者権限が必要です"
    };
    // フォームデータ取得
    const file = formData.get("file");
    const title = formData.get("title");
    const composer = formData.get("composer") || null;
    const category = formData.get("category");
    const difficulty = parseInt(formData.get("difficulty")) || 1;
    const keyTonic = formData.get("keyTonic");
    const keyMode = formData.get("keyMode");
    const tempoMin = parseInt(formData.get("tempoMin")) || null;
    const tempoMax = parseInt(formData.get("tempoMax")) || null;
    const positions = JSON.parse(formData.get("positions") || "[]");
    const techniques = JSON.parse(formData.get("techniques") || "[]");
    const description = formData.get("description") || null;
    const descriptionShort = formData.get("descriptionShort") || null;
    if (!file || !title || !category || !keyTonic || !keyMode) {
        return {
            error: "必須項目が不足しています"
        };
    }
    // PracticeItem レコード作成
    const item = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].practiceItem.create({
        data: {
            category: category,
            title,
            composer,
            description,
            descriptionShort,
            difficulty,
            keyTonic,
            keyMode,
            tempoMin,
            tempoMax,
            positions,
            instrument: "violin",
            originalXmlPath: "",
            source: "admin",
            isPublished: true
        }
    });
    // Storage にアップロード
    const storagePath = `practice/${item.id}/original.musicxml`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://wglnquvppatpnhzdgekm.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error: uploadError } = await storage.storage.from("musicxml").upload(storagePath, buffer, {
        contentType: "application/xml",
        upsert: true
    });
    if (uploadError) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].practiceItem.delete({
            where: {
                id: item.id
            }
        });
        return {
            error: `アップロード失敗: ${uploadError.message}`
        };
    }
    // originalXmlPath を更新
    await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].practiceItem.update({
        where: {
            id: item.id
        },
        data: {
            originalXmlPath: storagePath
        }
    });
    // 技法タグを紐づけ
    for (const tech of techniques){
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].practiceItemTechnique.create({
            data: {
                practiceItemId: item.id,
                techniqueTagId: tech.id,
                isPrimary: tech.isPrimary
            }
        });
    }
    // analyze_musicxml.py + build_score.py を実行（バックグラウンド）
    try {
        const { exec } = __turbopack_context__.r("[externals]/child_process [external] (child_process, cjs)");
        const { promisify } = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
        const execAsync = promisify(exec);
        const PYTHON_PATH = "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe";
        // analysis.json 生成
        await execAsync(`"${PYTHON_PATH}" ../music-analyzer/analyze_musicxml.py --practice-item ${item.id}`);
        // 表示用 MusicXML 生成
        await execAsync(`"${PYTHON_PATH}" ../music-analyzer/build_score.py --practice-item ${item.id}`);
        // ステータス更新
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].practiceItem.update({
            where: {
                id: item.id
            },
            data: {
                analysisStatus: "done",
                buildStatus: "done",
                analysisPath: `practice/${item.id}/analysis.json`,
                generatedXmlPath: `practice/${item.id}/build_score.musicxml`
            }
        });
    } catch (e) {
        console.error("Post-processing failed:", e);
    // 失敗してもアイテム自体は残す（手動で再実行可能）
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/practice");
    return {
        success: true,
        itemId: item.id
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    uploadPracticeItem
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(uploadPracticeItem, "40ede48aaf7d0475bb220a664d1f2e14b46cca59b8", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_4b896e5c._.js.map