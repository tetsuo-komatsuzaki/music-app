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
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/actions/signUpAction.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"40d8bb8b9fa3ec147cfbd8ff01d2fef45b8d429534":"signUpAction"},"",""] */ __turbopack_context__.s([
    "signUpAction",
    ()=>signUpAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/_libs/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function signUpAction(formData) {
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");
    const plan = formData.get("plan");
    const role = formData.get("role");
    if (!email || !password || !name || !plan) {
        return {
            error: "入力不備があります"
        };
    }
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://wglnquvppatpnhzdgekm.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
    // ① Supabase作成
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    if (error || !data.user) {
        return {
            error: "Supabase登録失敗"
        };
    }
    try {
        // ② Prisma作成
        await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$_libs$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.create({
            data: {
                supabaseUserId: data.user.id,
                name,
                role,
                plan
            }
        });
    } catch (err) {
        try {
            await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
            console.error("Supabase削除失敗", cleanupError);
        }
        return {
            error: "データベース登録失敗"
        };
    }
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    signUpAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signUpAction, "40d8bb8b9fa3ec147cfbd8ff01d2fef45b8d429534", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_2b079fe6._.js.map