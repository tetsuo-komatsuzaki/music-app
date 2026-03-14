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
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/actions/uploadScore.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"40a7967bb5ad48b0862b4c214fa42d1904a52a0741":"uploadScore"},"",""] */ __turbopack_context__.s([
    "uploadScore",
    ()=>uploadScore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$supabaseServer$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/supabaseServer.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/child_process [external] (child_process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$util__$5b$external$5d$__$28$util$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/util [external] (util, cjs)");
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
;
;
const execAsync = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$util__$5b$external$5d$__$28$util$2c$__cjs$29$__["promisify"])(__TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__["exec"]);
const PYTHON_PATH = "C:/Users/tetsu/OneDrive/Desktop/shiftB/music-app/music-analyzer/venv/Scripts/python.exe";
async function uploadScore(formData) {
    const title = formData.get("title");
    const composer = formData.get("composer");
    const file = formData.get("file");
    if (!title) return {
        error: "曲名が必要です"
    };
    if (!file) return {
        error: "ファイルがありません"
    };
    if (file.size > 5 * 1024 * 1024) {
        return {
            error: "5MB以下のみ対応"
        };
    }
    const allowedExtensions = [
        "xml",
        "musicxml",
        "mxl"
    ];
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
        return {
            error: "対応形式は .xml / .musicxml / .mxl のみです"
        };
    }
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
        error: "UserがDBに存在しません"
    };
    // Score作成（状態初期化）
    const score = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].score.create({
        data: {
            createdById: dbUser.id,
            title,
            composer: composer || "",
            originalXmlPath: "",
            analysisStatus: "processing",
            buildStatus: "processing"
        }
    });
    const filePath = `${dbUser.id}/${score.id}.${extension}`;
    const storageClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://wglnquvppatpnhzdgekm.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error: uploadError } = await storageClient.storage.from("musicxml").upload(filePath, file, {
        upsert: false
    });
    if (uploadError) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].score.delete({
            where: {
                id: score.id
            }
        });
        return {
            error: "Storage保存失敗"
        };
    }
    // 先に originalXmlPath 保存（安全）
    await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].score.update({
        where: {
            id: score.id
        },
        data: {
            originalXmlPath: filePath
        }
    });
    try {
        await execAsync(`"${PYTHON_PATH}" ../music-analyzer/analyze_musicxml.py ${dbUser.id} ${score.id}`);
        await execAsync(`"${PYTHON_PATH}" ../music-analyzer/build_score.py ${dbUser.id} ${score.id}`);
    } catch (e) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].score.update({
            where: {
                id: score.id
            },
            data: {
                analysisStatus: "error",
                buildStatus: "error"
            }
        });
        throw e;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/${user.id}/top`);
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    uploadScore
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(uploadScore, "40a7967bb5ad48b0862b4c214fa42d1904a52a0741", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_1b85b6d4._.js.map