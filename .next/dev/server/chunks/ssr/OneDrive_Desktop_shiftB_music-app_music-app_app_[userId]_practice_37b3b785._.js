module.exports = [
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practice.module.css [app-ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "badge": "practice-module__gueLNq__badge",
  "badgeAdvanced": "practice-module__gueLNq__badgeAdvanced",
  "badgeBeginner": "practice-module__gueLNq__badgeBeginner",
  "badgeIntermediate": "practice-module__gueLNq__badgeIntermediate",
  "categoryCard": "practice-module__gueLNq__categoryCard",
  "categoryCount": "practice-module__gueLNq__categoryCount",
  "categoryGrid": "practice-module__gueLNq__categoryGrid",
  "categoryIcon": "practice-module__gueLNq__categoryIcon",
  "categoryName": "practice-module__gueLNq__categoryName",
  "categorySection": "practice-module__gueLNq__categorySection",
  "container": "practice-module__gueLNq__container",
  "detailDescription": "practice-module__gueLNq__detailDescription",
  "detailHeader": "practice-module__gueLNq__detailHeader",
  "detailMeta": "practice-module__gueLNq__detailMeta",
  "detailTitle": "practice-module__gueLNq__detailTitle",
  "emptyState": "practice-module__gueLNq__emptyState",
  "filterSelect": "practice-module__gueLNq__filterSelect",
  "filters": "practice-module__gueLNq__filters",
  "historyActive": "practice-module__gueLNq__historyActive",
  "historyDate": "practice-module__gueLNq__historyDate",
  "historyItem": "practice-module__gueLNq__historyItem",
  "historyPanel": "practice-module__gueLNq__historyPanel",
  "historyScore": "practice-module__gueLNq__historyScore",
  "itemCard": "practice-module__gueLNq__itemCard",
  "itemHistory": "practice-module__gueLNq__itemHistory",
  "itemList": "practice-module__gueLNq__itemList",
  "itemMeta": "practice-module__gueLNq__itemMeta",
  "itemTitle": "practice-module__gueLNq__itemTitle",
  "listHeader": "practice-module__gueLNq__listHeader",
  "pageTitle": "practice-module__gueLNq__pageTitle",
  "recommendCard": "practice-module__gueLNq__recommendCard",
  "recommendChip": "practice-module__gueLNq__recommendChip",
  "recommendItems": "practice-module__gueLNq__recommendItems",
  "recommendLabel": "practice-module__gueLNq__recommendLabel",
  "recommendReason": "practice-module__gueLNq__recommendReason",
  "recommendSection": "practice-module__gueLNq__recommendSection",
  "sectionTitle": "practice-module__gueLNq__sectionTitle",
});
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PracticeTop
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practice.module.css [app-ssr] (css module)");
"use client";
;
;
;
const categoryLabels = {
    scale: "音階",
    arpeggio: "アルペジオ",
    etude: "エチュード"
};
const difficultyLabels = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級"
};
function PracticeTop({ userId, categoryCounts, scoreRecommendations, weaknessRecommendations }) {
    const hasRecommendations = scoreRecommendations.length > 0 || weaknessRecommendations.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].pageTitle,
                children: "練習メニュー"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            hasRecommendations && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendSection,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "おすすめ練習"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                        lineNumber: 50,
                        columnNumber: 11
                    }, this),
                    scoreRecommendations.map((rec, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendLabel,
                                    children: "📋 あなたの楽曲から"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 54,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendReason,
                                    children: rec.reason
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 55,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendItems,
                                    children: rec.items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            href: `/${userId}/practice/${item.category}/${item.id}`,
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendChip,
                                            children: item.title
                                        }, item.id, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                            lineNumber: 58,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 56,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, `score-${i}`, true, {
                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                            lineNumber: 53,
                            columnNumber: 13
                        }, this)),
                    weaknessRecommendations.map((rec, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendLabel,
                                    children: "🎯 あなたの苦手から"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 72,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendReason,
                                    children: rec.reason
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 73,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendItems,
                                    children: rec.items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            href: `/${userId}/practice/${item.category}/${item.id}`,
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].recommendChip,
                                            children: item.title
                                        }, item.id, false, {
                                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                            lineNumber: 76,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 74,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, `weakness-${i}`, true, {
                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                            lineNumber: 71,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                lineNumber: 49,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].categorySection,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].categoryGrid,
                    children: [
                        "scale",
                        "arpeggio",
                        "etude"
                    ].map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: `/${userId}/practice/${cat}`,
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].categoryCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].categoryIcon,
                                    children: cat === "scale" ? "🎵" : cat === "arpeggio" ? "🎶" : "📖"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 98,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].categoryName,
                                    children: categoryLabels[cat]
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 101,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f$practice$2e$module$2e$css__$5b$app$2d$ssr$5d$__$28$css__module$29$__["default"].categoryCount,
                                    children: [
                                        categoryCounts[cat],
                                        "項目"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                                    lineNumber: 102,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, cat, true, {
                            fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                            lineNumber: 93,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                    lineNumber: 91,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/practiceTop.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_%5BuserId%5D_practice_37b3b785._.js.map