(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/admin.module.css [app-client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "checkboxGroup": "admin-module__Gc8RtW__checkboxGroup",
  "checkboxLabel": "admin-module__Gc8RtW__checkboxLabel",
  "container": "admin-module__Gc8RtW__container",
  "field": "admin-module__Gc8RtW__field",
  "fieldRow": "admin-module__Gc8RtW__fieldRow",
  "formCard": "admin-module__Gc8RtW__formCard",
  "formGrid": "admin-module__Gc8RtW__formGrid",
  "formTitle": "admin-module__Gc8RtW__formTitle",
  "header": "admin-module__Gc8RtW__header",
  "hint": "admin-module__Gc8RtW__hint",
  "inlineGroup": "admin-module__Gc8RtW__inlineGroup",
  "itemSub": "admin-module__Gc8RtW__itemSub",
  "itemTitle": "admin-module__Gc8RtW__itemTitle",
  "listSection": "admin-module__Gc8RtW__listSection",
  "message": "admin-module__Gc8RtW__message",
  "pageTitle": "admin-module__Gc8RtW__pageTitle",
  "primaryBtn": "admin-module__Gc8RtW__primaryBtn",
  "radioGroup": "admin-module__Gc8RtW__radioGroup",
  "radioLabel": "admin-module__Gc8RtW__radioLabel",
  "sectionTitle": "admin-module__Gc8RtW__sectionTitle",
  "starEmpty": "admin-module__Gc8RtW__starEmpty",
  "starFilled": "admin-module__Gc8RtW__starFilled",
  "stars": "admin-module__Gc8RtW__stars",
  "statusDone": "admin-module__Gc8RtW__statusDone",
  "statusProcessing": "admin-module__Gc8RtW__statusProcessing",
  "table": "admin-module__Gc8RtW__table",
  "tag": "admin-module__Gc8RtW__tag",
  "tagCategory": "admin-module__Gc8RtW__tagCategory",
  "tagCategoryName": "admin-module__Gc8RtW__tagCategoryName",
  "tagList": "admin-module__Gc8RtW__tagList",
  "tagPrimary": "admin-module__Gc8RtW__tagPrimary",
  "tagSection": "admin-module__Gc8RtW__tagSection",
  "tagSelected": "admin-module__Gc8RtW__tagSelected",
  "tagSmall": "admin-module__Gc8RtW__tagSmall",
});
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminPractice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/admin.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const categoryLabels = {
    scale: "音階",
    arpeggio: "アルペジオ",
    etude: "エチュード"
};
const modeLabels = {
    major: "長調",
    minor: "短調"
};
const positionOptions = [
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th"
];
const tonicOptions = [
    "C",
    "C#",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B"
];
function AdminPractice({ items, tagsByCategory, uploadAction }) {
    _s();
    const [showForm, setShowForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [submitting, setSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // フォーム state
    const [title, setTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [composer, setComposer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("scale");
    const [difficulty, setDifficulty] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [keyTonic, setKeyTonic] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("G");
    const [keyMode, setKeyMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("major");
    const [tempoMin, setTempoMin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [tempoMax, setTempoMax] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [positions, setPositions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedTags, setSelectedTags] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [description, setDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [descriptionShort, setDescriptionShort] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const togglePosition = (pos)=>{
        setPositions((prev)=>prev.includes(pos) ? prev.filter((p)=>p !== pos) : [
                ...prev,
                pos
            ]);
    };
    const toggleTag = (tagId)=>{
        setSelectedTags((prev)=>{
            const exists = prev.find((t)=>t.id === tagId);
            if (exists) return prev.filter((t)=>t.id !== tagId);
            return [
                ...prev,
                {
                    id: tagId,
                    isPrimary: false
                }
            ];
        });
    };
    const togglePrimary = (tagId)=>{
        setSelectedTags((prev)=>prev.map((t)=>t.id === tagId ? {
                    ...t,
                    isPrimary: !t.isPrimary
                } : t));
    };
    const handleSubmit = async ()=>{
        if (!file) {
            setMessage("MusicXMLファイルを選択してください");
            return;
        }
        if (!title) {
            setMessage("タイトルを入力してください");
            return;
        }
        setSubmitting(true);
        setMessage("");
        const formData = new FormData();
        formData.set("file", file);
        formData.set("title", title);
        formData.set("composer", composer);
        formData.set("category", category);
        formData.set("difficulty", String(difficulty));
        formData.set("keyTonic", keyTonic);
        formData.set("keyMode", keyMode);
        formData.set("tempoMin", tempoMin);
        formData.set("tempoMax", tempoMax);
        formData.set("positions", JSON.stringify(positions));
        formData.set("techniques", JSON.stringify(selectedTags));
        formData.set("description", description);
        formData.set("descriptionShort", descriptionShort);
        try {
            const result = await uploadAction(formData);
            if (result?.error) {
                setMessage(`エラー: ${result.error}`);
            } else {
                setMessage("登録しました");
                // reset
                setTitle("");
                setComposer("");
                setDifficulty(1);
                setTempoMin("");
                setTempoMax("");
                setPositions([]);
                setSelectedTags([]);
                setDescription("");
                setDescriptionShort("");
                setFile(null);
                setShowForm(false);
                window.location.reload();
            }
        } catch (e) {
            setMessage(`エラー: ${e.message}`);
        } finally{
            setSubmitting(false);
        }
    };
    const renderStars = (n, interactive = false)=>{
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].stars,
            children: [
                1,
                2,
                3,
                4,
                5
            ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: i <= n ? __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].starFilled : __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].starEmpty,
                    onClick: interactive ? ()=>setDifficulty(i) : undefined,
                    style: interactive ? {
                        cursor: "pointer"
                    } : undefined,
                    children: "★"
                }, i, false, {
                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                    lineNumber: 110,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
            lineNumber: 108,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].header,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].pageTitle,
                        children: "練習メニュー管理"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].primaryBtn,
                        onClick: ()=>setShowForm(!showForm),
                        children: showForm ? "閉じる" : "新規登録"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].message,
                children: message
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                lineNumber: 132,
                columnNumber: 19
            }, this),
            showForm && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formCard,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formTitle,
                        children: "新規登録"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 136,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].formGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "MusicXML ファイル *"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        accept: ".musicxml,.mxl,.xml",
                                        onChange: (e)=>setFile(e.target.files?.[0] || null)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 141,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 139,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "タイトル *"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 146,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: title,
                                        onChange: (e)=>setTitle(e.target.value),
                                        placeholder: "ト長調 音階 2オクターブ"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 147,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "作曲者"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 152,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: composer,
                                        onChange: (e)=>setComposer(e.target.value),
                                        placeholder: "カイザー"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 153,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 151,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "カテゴリ *"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].radioGroup,
                                        children: [
                                            "scale",
                                            "arpeggio",
                                            "etude"
                                        ].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].radioLabel,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "radio",
                                                        name: "category",
                                                        value: c,
                                                        checked: category === c,
                                                        onChange: ()=>setCategory(c)
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 162,
                                                        columnNumber: 21
                                                    }, this),
                                                    categoryLabels[c]
                                                ]
                                            }, c, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 161,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 159,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "難易度 *"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 171,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            renderStars(difficulty, true),
                                            " ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].hint,
                                                children: [
                                                    "(",
                                                    difficulty,
                                                    "/5)"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 172,
                                                columnNumber: 52
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 172,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 170,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].fieldRow,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: "調 *"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 177,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inlineGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        value: keyTonic,
                                                        onChange: (e)=>setKeyTonic(e.target.value),
                                                        children: tonicOptions.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: t,
                                                                children: t
                                                            }, t, false, {
                                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                                lineNumber: 180,
                                                                columnNumber: 46
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 179,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                        value: keyMode,
                                                        onChange: (e)=>setKeyMode(e.target.value),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "major",
                                                                children: "長調"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                                lineNumber: 183,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                value: "minor",
                                                                children: "短調"
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                                lineNumber: 184,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 182,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 178,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 176,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                children: "推奨テンポ"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 190,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].inlineGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: tempoMin,
                                                        onChange: (e)=>setTempoMin(e.target.value),
                                                        placeholder: "60",
                                                        style: {
                                                            width: 80
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 192,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "〜"
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 194,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: tempoMax,
                                                        onChange: (e)=>setTempoMax(e.target.value),
                                                        placeholder: "90",
                                                        style: {
                                                            width: 80
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 195,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 191,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 189,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 175,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "ポジション"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 202,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].checkboxGroup,
                                        children: positionOptions.map((pos)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].checkboxLabel,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        checked: positions.includes(pos),
                                                        onChange: ()=>togglePosition(pos)
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 206,
                                                        columnNumber: 21
                                                    }, this),
                                                    pos
                                                ]
                                            }, pos, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 205,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 203,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "技法タグ"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 215,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagSection,
                                        children: [
                                            Object.entries(tagsByCategory).map(([cat, tags])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagCategory,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagCategoryName,
                                                            children: cat
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                            lineNumber: 219,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagList,
                                                            children: tags.map((tag)=>{
                                                                const sel = selectedTags.find((t)=>t.id === tag.id);
                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tag} ${sel ? __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagSelected : ""} ${sel?.isPrimary ? __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagPrimary : ""}`,
                                                                    onClick: ()=>toggleTag(tag.id),
                                                                    onDoubleClick: ()=>{
                                                                        if (sel) togglePrimary(tag.id);
                                                                    },
                                                                    title: "クリックで選択、ダブルクリックで主要タグ",
                                                                    children: [
                                                                        tag.name,
                                                                        sel?.isPrimary && " ●"
                                                                    ]
                                                                }, tag.id, true, {
                                                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                                    lineNumber: 224,
                                                                    columnNumber: 27
                                                                }, this);
                                                            })
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                            lineNumber: 220,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, cat, true, {
                                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                    lineNumber: 218,
                                                    columnNumber: 19
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].hint,
                                                children: "クリック: 選択/解除　ダブルクリック: 主要タグ指定"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 238,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 216,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 214,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "短い説明（一覧表示用）"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 243,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: descriptionShort,
                                        onChange: (e)=>setDescriptionShort(e.target.value),
                                        placeholder: "2の指と3の指の間隔に注意"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 244,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 242,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].field,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        children: "詳細説明"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 249,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        value: description,
                                        onChange: (e)=>setDescription(e.target.value),
                                        placeholder: "練習のポイント、注意事項など",
                                        rows: 3
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 250,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 248,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 138,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].primaryBtn,
                        onClick: handleSubmit,
                        disabled: submitting,
                        children: submitting ? "登録中..." : "登録"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 255,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                lineNumber: 135,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].listSection,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: [
                            "登録済み (",
                            items.length,
                            "件)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].table,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "タイトル"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 267,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "カテゴリ"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 268,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "難易度"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 269,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "調"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 270,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "テンポ"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 271,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "技法"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 272,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "状態"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 273,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "公開"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                            lineNumber: 274,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                    lineNumber: 266,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 265,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].itemTitle,
                                                        children: item.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 281,
                                                        columnNumber: 19
                                                    }, this),
                                                    item.composer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].itemSub,
                                                        children: item.composer
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 282,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 280,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: categoryLabels[item.category] || item.category
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 284,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: renderStars(item.difficulty)
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 285,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: [
                                                    item.keyTonic,
                                                    " ",
                                                    modeLabels[item.keyMode] || item.keyMode
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 286,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: item.tempoMin && item.tempoMax ? `${item.tempoMin}-${item.tempoMax}` : "-"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 287,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: item.techniques.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagSmall} ${t.isPrimary ? __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].tagPrimary : ""}`,
                                                        children: t.name
                                                    }, t.id, false, {
                                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                        lineNumber: 290,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 288,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: item.analysisStatus === "done" && item.buildStatus === "done" ? __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusDone : __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$admin$2f$admin$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].statusProcessing,
                                                    children: item.analysisStatus === "done" && item.buildStatus === "done" ? "完了" : "処理中"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                    lineNumber: 296,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 295,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: item.isPublished ? "✅" : "❌"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                                lineNumber: 301,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, item.id, true, {
                                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                        lineNumber: 279,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                        lineNumber: 264,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
                lineNumber: 262,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/admin/adminPractice.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this);
}
_s(AdminPractice, "oGDMAd5XotxEgD+6Yv8GRq42V1Y=");
_c = AdminPractice;
var _c;
__turbopack_context__.k.register(_c, "AdminPractice");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_%5BuserId%5D_admin_72c78f31._.js.map