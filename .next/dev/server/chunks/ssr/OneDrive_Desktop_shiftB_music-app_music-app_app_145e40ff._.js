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
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/actions/uploadRecord.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"40ee6fd3bdb741f288971eb9cd4778e4612782d7fe":"uploadRecord"},"",""] */ __turbopack_context__.s([
    "uploadRecord",
    ()=>uploadRecord
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
async function uploadRecord(formData) {
    console.log("① uploadRecord START");
    const scoreId = formData.get("scoreId");
    const file = formData.get("file");
    if (!scoreId) return {
        error: "scoreIdがありません"
    };
    if (!file) return {
        error: "ファイルがありません"
    };
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
    if (!dbUser) return {
        error: "User未登録"
    };
    const performance = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].performance.create({
        data: {
            userId: dbUser.id,
            scoreId,
            performanceType: "user",
            performanceStatus: "uploaded",
            audioPath: ""
        }
    });
    const filePath = `${dbUser.id}/${scoreId}/${performance.id}.wav`;
    // 🔥 ここで直接作る
    const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://wglnquvppatpnhzdgekm.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await storage.storage.from("performances").upload(filePath, file, {
        upsert: false
    });
    console.log("STORAGE ERROR:", error);
    if (error) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].performance.delete({
            where: {
                id: performance.id
            }
        });
        return {
            error: "アップロード失敗"
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].performance.update({
        where: {
            id: performance.id
        },
        data: {
            audioPath: filePath
        }
    });
    // 演奏比較を実行
    try {
        const { exec } = __turbopack_context__.r("[externals]/child_process [external] (child_process, cjs)");
        const { promisify } = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
        const execAsync = promisify(exec);
        const PYTHON_PATH = "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe";
        await execAsync(`"${PYTHON_PATH}" ../music-analyzer/analyze_performance.py ${dbUser.id} ${scoreId} ${performance.id}`);
    } catch (e) {
        console.error("analyze_performance failed:", e);
    // 比較失敗してもアップロード自体は成功扱いにする
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/${dbUser.id}/top/${scoreId}`);
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    uploadRecord
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(uploadRecord, "40ee6fd3bdb741f288971eb9cd4778e4612782d7fe", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_145e40ff._.js.map