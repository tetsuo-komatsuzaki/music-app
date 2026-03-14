module.exports = [
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/query_compiler_fast_bg.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var h = Object.defineProperty;
var T = Object.getOwnPropertyDescriptor;
var M = Object.getOwnPropertyNames;
var j = Object.prototype.hasOwnProperty;
var D = (e, t)=>{
    for(var n in t)h(e, n, {
        get: t[n],
        enumerable: !0
    });
}, O = (e, t, n, _)=>{
    if (t && typeof t == "object" || typeof t == "function") for (let r of M(t))!j.call(e, r) && r !== n && h(e, r, {
        get: ()=>t[r],
        enumerable: !(_ = T(t, r)) || _.enumerable
    });
    return e;
};
var B = (e)=>O(h({}, "__esModule", {
        value: !0
    }), e);
var xe = {};
D(xe, {
    QueryCompiler: ()=>F,
    __wbg_Error_e83987f665cf5504: ()=>q,
    __wbg_Number_bb48ca12f395cd08: ()=>C,
    __wbg_String_8f0eb39a4a4c2f66: ()=>k,
    __wbg___wbindgen_boolean_get_6d5a1ee65bab5f68: ()=>W,
    __wbg___wbindgen_debug_string_df47ffb5e35e6763: ()=>V,
    __wbg___wbindgen_in_bb933bd9e1b3bc0f: ()=>z,
    __wbg___wbindgen_is_object_c818261d21f283a4: ()=>L,
    __wbg___wbindgen_is_string_fbb76cb2940daafd: ()=>P,
    __wbg___wbindgen_is_undefined_2d472862bd29a478: ()=>Q,
    __wbg___wbindgen_jsval_loose_eq_b664b38a2f582147: ()=>Y,
    __wbg___wbindgen_number_get_a20bf9b85341449d: ()=>G,
    __wbg___wbindgen_string_get_e4f06c90489ad01b: ()=>J,
    __wbg___wbindgen_throw_b855445ff6a94295: ()=>X,
    __wbg_entries_e171b586f8f6bdbf: ()=>H,
    __wbg_getTime_14776bfb48a1bff9: ()=>K,
    __wbg_get_7bed016f185add81: ()=>Z,
    __wbg_get_with_ref_key_1dc361bd10053bfe: ()=>v,
    __wbg_instanceof_ArrayBuffer_70beb1189ca63b38: ()=>ee,
    __wbg_instanceof_Uint8Array_20c8e73002f7af98: ()=>te,
    __wbg_isSafeInteger_d216eda7911dde36: ()=>ne,
    __wbg_length_69bca3cb64fc8748: ()=>re,
    __wbg_length_cdd215e10d9dd507: ()=>_e,
    __wbg_new_0_f9740686d739025c: ()=>oe,
    __wbg_new_1acc0b6eea89d040: ()=>ce,
    __wbg_new_5a79be3ab53b8aa5: ()=>ie,
    __wbg_new_68651c719dcda04e: ()=>se,
    __wbg_new_e17d9f43105b08be: ()=>ue,
    __wbg_prototypesetcall_2a6620b6922694b2: ()=>fe,
    __wbg_set_3f1d0b984ed272ed: ()=>be,
    __wbg_set_907fb406c34a251d: ()=>de,
    __wbg_set_c213c871859d6500: ()=>ae,
    __wbg_set_message_82ae475bb413aa5c: ()=>ge,
    __wbg_set_wasm: ()=>N,
    __wbindgen_cast_2241b6af4c4b2941: ()=>le,
    __wbindgen_cast_4625c577ab2ec9ee: ()=>we,
    __wbindgen_cast_9ae0607507abb057: ()=>pe,
    __wbindgen_cast_d6cd19b81560fd6e: ()=>ye,
    __wbindgen_init_externref_table: ()=>me
});
module.exports = B(xe);
var A = ()=>{};
A.prototype = A;
let o;
function N(e) {
    o = e;
}
let p = null;
function a() {
    return (p === null || p.byteLength === 0) && (p = new Uint8Array(o.memory.buffer)), p;
}
let y = new TextDecoder("utf-8", {
    ignoreBOM: !0,
    fatal: !0
});
y.decode();
const U = 2146435072;
let S = 0;
function R(e, t) {
    return S += t, S >= U && (y = new TextDecoder("utf-8", {
        ignoreBOM: !0,
        fatal: !0
    }), y.decode(), S = t), y.decode(a().subarray(e, e + t));
}
function m(e, t) {
    return e = e >>> 0, R(e, t);
}
let f = 0;
const g = new TextEncoder;
"encodeInto" in g || (g.encodeInto = function(e, t) {
    const n = g.encode(e);
    return t.set(n), {
        read: e.length,
        written: n.length
    };
});
function l(e, t, n) {
    if (n === void 0) {
        const i = g.encode(e), d = t(i.length, 1) >>> 0;
        return a().subarray(d, d + i.length).set(i), f = i.length, d;
    }
    let _ = e.length, r = t(_, 1) >>> 0;
    const s = a();
    let c = 0;
    for(; c < _; c++){
        const i = e.charCodeAt(c);
        if (i > 127) break;
        s[r + c] = i;
    }
    if (c !== _) {
        c !== 0 && (e = e.slice(c)), r = n(r, _, _ = c + e.length * 3, 1) >>> 0;
        const i = a().subarray(r + c, r + _), d = g.encodeInto(e, i);
        c += d.written, r = n(r, _, c, 1) >>> 0;
    }
    return f = c, r;
}
let b = null;
function u() {
    return (b === null || b.buffer.detached === !0 || b.buffer.detached === void 0 && b.buffer !== o.memory.buffer) && (b = new DataView(o.memory.buffer)), b;
}
function x(e) {
    return e == null;
}
function I(e) {
    const t = typeof e;
    if (t == "number" || t == "boolean" || e == null) return `${e}`;
    if (t == "string") return `"${e}"`;
    if (t == "symbol") {
        const r = e.description;
        return r == null ? "Symbol" : `Symbol(${r})`;
    }
    if (t == "function") {
        const r = e.name;
        return typeof r == "string" && r.length > 0 ? `Function(${r})` : "Function";
    }
    if (Array.isArray(e)) {
        const r = e.length;
        let s = "[";
        r > 0 && (s += I(e[0]));
        for(let c = 1; c < r; c++)s += ", " + I(e[c]);
        return s += "]", s;
    }
    const n = /\[object ([^\]]+)\]/.exec(toString.call(e));
    let _;
    if (n && n.length > 1) _ = n[1];
    else return toString.call(e);
    if (_ == "Object") try {
        return "Object(" + JSON.stringify(e) + ")";
    } catch  {
        return "Object";
    }
    return e instanceof Error ? `${e.name}: ${e.message}
${e.stack}` : _;
}
function $(e, t) {
    return e = e >>> 0, a().subarray(e / 1, e / 1 + t);
}
function w(e) {
    const t = o.__wbindgen_externrefs.get(e);
    return o.__externref_table_dealloc(e), t;
}
const E = typeof FinalizationRegistry > "u" ? {
    register: ()=>{},
    unregister: ()=>{}
} : new FinalizationRegistry((e)=>o.__wbg_querycompiler_free(e >>> 0, 1));
class F {
    __destroy_into_raw() {
        const t = this.__wbg_ptr;
        return this.__wbg_ptr = 0, E.unregister(this), t;
    }
    free() {
        const t = this.__destroy_into_raw();
        o.__wbg_querycompiler_free(t, 0);
    }
    compileBatch(t) {
        const n = l(t, o.__wbindgen_malloc, o.__wbindgen_realloc), _ = f, r = o.querycompiler_compileBatch(this.__wbg_ptr, n, _);
        if (r[2]) throw w(r[1]);
        return w(r[0]);
    }
    constructor(t){
        const n = o.querycompiler_new(t);
        if (n[2]) throw w(n[1]);
        return this.__wbg_ptr = n[0] >>> 0, E.register(this, this.__wbg_ptr, this), this;
    }
    compile(t) {
        const n = l(t, o.__wbindgen_malloc, o.__wbindgen_realloc), _ = f, r = o.querycompiler_compile(this.__wbg_ptr, n, _);
        if (r[2]) throw w(r[1]);
        return w(r[0]);
    }
}
Symbol.dispose && (F.prototype[Symbol.dispose] = F.prototype.free);
function q(e, t) {
    return Error(m(e, t));
}
function C(e) {
    return Number(e);
}
function k(e, t) {
    const n = String(t), _ = l(n, o.__wbindgen_malloc, o.__wbindgen_realloc), r = f;
    u().setInt32(e + 4 * 1, r, !0), u().setInt32(e + 4 * 0, _, !0);
}
function W(e) {
    const t = e, n = typeof t == "boolean" ? t : void 0;
    return x(n) ? 16777215 : n ? 1 : 0;
}
function V(e, t) {
    const n = I(t), _ = l(n, o.__wbindgen_malloc, o.__wbindgen_realloc), r = f;
    u().setInt32(e + 4 * 1, r, !0), u().setInt32(e + 4 * 0, _, !0);
}
function z(e, t) {
    return e in t;
}
function L(e) {
    const t = e;
    return typeof t == "object" && t !== null;
}
function P(e) {
    return typeof e == "string";
}
function Q(e) {
    return e === void 0;
}
function Y(e, t) {
    return e == t;
}
function G(e, t) {
    const n = t, _ = typeof n == "number" ? n : void 0;
    u().setFloat64(e + 8 * 1, x(_) ? 0 : _, !0), u().setInt32(e + 4 * 0, !x(_), !0);
}
function J(e, t) {
    const n = t, _ = typeof n == "string" ? n : void 0;
    var r = x(_) ? 0 : l(_, o.__wbindgen_malloc, o.__wbindgen_realloc), s = f;
    u().setInt32(e + 4 * 1, s, !0), u().setInt32(e + 4 * 0, r, !0);
}
function X(e, t) {
    throw new Error(m(e, t));
}
function H(e) {
    return Object.entries(e);
}
function K(e) {
    return e.getTime();
}
function Z(e, t) {
    return e[t >>> 0];
}
function v(e, t) {
    return e[t];
}
function ee(e) {
    let t;
    try {
        t = e instanceof ArrayBuffer;
    } catch  {
        t = !1;
    }
    return t;
}
function te(e) {
    let t;
    try {
        t = e instanceof Uint8Array;
    } catch  {
        t = !1;
    }
    return t;
}
function ne(e) {
    return Number.isSafeInteger(e);
}
function re(e) {
    return e.length;
}
function _e(e) {
    return e.length;
}
function oe() {
    return new Date;
}
function ce() {
    return new Object;
}
function ie(e) {
    return new Uint8Array(e);
}
function se() {
    return new Map;
}
function ue() {
    return new Array;
}
function fe(e, t, n) {
    Uint8Array.prototype.set.call($(e, t), n);
}
function be(e, t, n) {
    e[t] = n;
}
function de(e, t, n) {
    return e.set(t, n);
}
function ae(e, t, n) {
    e[t >>> 0] = n;
}
function ge(e, t) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.PRISMA_WASM_PANIC_REGISTRY.set_message(m(e, t));
}
function le(e, t) {
    return m(e, t);
}
function we(e) {
    return BigInt.asUintN(64, e);
}
function pe(e) {
    return e;
}
function ye(e) {
    return e;
}
function me() {
    const e = o.__wbindgen_externrefs, t = e.grow(4);
    e.set(0, void 0), e.set(t + 0, void 0), e.set(t + 1, null), e.set(t + 2, !0), e.set(t + 3, !1);
}
0 && (module.exports = {
    QueryCompiler,
    __wbg_Error_e83987f665cf5504,
    __wbg_Number_bb48ca12f395cd08,
    __wbg_String_8f0eb39a4a4c2f66,
    __wbg___wbindgen_boolean_get_6d5a1ee65bab5f68,
    __wbg___wbindgen_debug_string_df47ffb5e35e6763,
    __wbg___wbindgen_in_bb933bd9e1b3bc0f,
    __wbg___wbindgen_is_object_c818261d21f283a4,
    __wbg___wbindgen_is_string_fbb76cb2940daafd,
    __wbg___wbindgen_is_undefined_2d472862bd29a478,
    __wbg___wbindgen_jsval_loose_eq_b664b38a2f582147,
    __wbg___wbindgen_number_get_a20bf9b85341449d,
    __wbg___wbindgen_string_get_e4f06c90489ad01b,
    __wbg___wbindgen_throw_b855445ff6a94295,
    __wbg_entries_e171b586f8f6bdbf,
    __wbg_getTime_14776bfb48a1bff9,
    __wbg_get_7bed016f185add81,
    __wbg_get_with_ref_key_1dc361bd10053bfe,
    __wbg_instanceof_ArrayBuffer_70beb1189ca63b38,
    __wbg_instanceof_Uint8Array_20c8e73002f7af98,
    __wbg_isSafeInteger_d216eda7911dde36,
    __wbg_length_69bca3cb64fc8748,
    __wbg_length_cdd215e10d9dd507,
    __wbg_new_0_f9740686d739025c,
    __wbg_new_1acc0b6eea89d040,
    __wbg_new_5a79be3ab53b8aa5,
    __wbg_new_68651c719dcda04e,
    __wbg_new_e17d9f43105b08be,
    __wbg_prototypesetcall_2a6620b6922694b2,
    __wbg_set_3f1d0b984ed272ed,
    __wbg_set_907fb406c34a251d,
    __wbg_set_c213c871859d6500,
    __wbg_set_message_82ae475bb413aa5c,
    __wbg_set_wasm,
    __wbindgen_cast_2241b6af4c4b2941,
    __wbindgen_cast_4625c577ab2ec9ee,
    __wbindgen_cast_9ae0607507abb057,
    __wbindgen_cast_d6cd19b81560fd6e,
    __wbindgen_init_externref_table
});
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

/* !!! This is code generated by Prisma. Do not edit directly. !!!
/* eslint-disable */ // biome-ignore-all lint: generated file
Object.defineProperty(exports, "__esModule", {
    value: true
});
const { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError, PrismaClientInitializationError, PrismaClientValidationError, getPrismaClient, sqltag, empty, join, raw, skip, Decimal, Debug, DbNull, JsonNull, AnyNull, NullTypes, makeStrictEnum, Extensions, warnOnce, defineDmmfProperty, Public, getRuntime, createParam } = __turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/runtime/client.js [app-rsc] (ecmascript)");
const Prisma = {};
exports.Prisma = Prisma;
exports.$Enums = {};
/**
 * Prisma Client JS version: 7.4.1
 * Query Engine version: 55ae170b1ced7fc6ed07a15f110549408c501bb3
 */ Prisma.prismaVersion = {
    client: "7.4.1",
    engine: "55ae170b1ced7fc6ed07a15f110549408c501bb3"
};
Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError;
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError;
Prisma.PrismaClientInitializationError = PrismaClientInitializationError;
Prisma.PrismaClientValidationError = PrismaClientValidationError;
Prisma.Decimal = Decimal;
/**
 * Re-export of sql-template-tag
 */ Prisma.sql = sqltag;
Prisma.empty = empty;
Prisma.join = join;
Prisma.raw = raw;
Prisma.validator = Public.validator;
/**
* Extensions
*/ Prisma.getExtensionContext = Extensions.getExtensionContext;
Prisma.defineExtension = Extensions.defineExtension;
/**
 * Shorthand utilities for JSON filtering
 */ Prisma.DbNull = DbNull;
Prisma.JsonNull = JsonNull;
Prisma.AnyNull = AnyNull;
Prisma.NullTypes = NullTypes;
const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
/**
 * Enums
 */ exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.Prisma.UserScalarFieldEnum = {
    id: 'id',
    supabaseUserId: 'supabaseUserId',
    name: 'name',
    role: 'role',
    plan: 'plan',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.Prisma.ScoreScalarFieldEnum = {
    id: 'id',
    createdById: 'createdById',
    title: 'title',
    composer: 'composer',
    arranger: 'arranger',
    originalXmlPath: 'originalXmlPath',
    generatedXmlPath: 'generatedXmlPath',
    analysisStatus: 'analysisStatus',
    buildStatus: 'buildStatus',
    keyTonic: 'keyTonic',
    keyMode: 'keyMode',
    timeNumerator: 'timeNumerator',
    timeDenominator: 'timeDenominator',
    defaultTempo: 'defaultTempo',
    createdAt: 'createdAt'
};
exports.Prisma.PerformanceScalarFieldEnum = {
    id: 'id',
    performanceType: 'performanceType',
    performanceStatus: 'performanceStatus',
    userId: 'userId',
    scoreId: 'scoreId',
    audioPath: 'audioPath',
    audioFeaturesPath: 'audioFeaturesPath',
    comparisonResultPath: 'comparisonResultPath',
    pseudoXmlPath: 'pseudoXmlPath',
    performanceDuration: 'performanceDuration',
    performanceDate: 'performanceDate',
    uploadedAt: 'uploadedAt',
    createdAt: 'createdAt'
};
exports.Prisma.PracticeItemScalarFieldEnum = {
    id: 'id',
    category: 'category',
    title: 'title',
    composer: 'composer',
    description: 'description',
    descriptionShort: 'descriptionShort',
    difficulty: 'difficulty',
    keyTonic: 'keyTonic',
    keyMode: 'keyMode',
    tempoMin: 'tempoMin',
    tempoMax: 'tempoMax',
    positions: 'positions',
    instrument: 'instrument',
    originalXmlPath: 'originalXmlPath',
    generatedXmlPath: 'generatedXmlPath',
    analysisPath: 'analysisPath',
    analysisStatus: 'analysisStatus',
    buildStatus: 'buildStatus',
    source: 'source',
    sortOrder: 'sortOrder',
    isPublished: 'isPublished',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.Prisma.TechniqueTagScalarFieldEnum = {
    id: 'id',
    category: 'category',
    name: 'name',
    nameEn: 'nameEn',
    description: 'description',
    xmlTags: 'xmlTags',
    isAnalyzable: 'isAnalyzable',
    implementStatus: 'implementStatus'
};
exports.Prisma.PracticeItemTechniqueScalarFieldEnum = {
    practiceItemId: 'practiceItemId',
    techniqueTagId: 'techniqueTagId',
    isPrimary: 'isPrimary'
};
exports.Prisma.PracticePerformanceScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    practiceItemId: 'practiceItemId',
    audioPath: 'audioPath',
    comparisonResultPath: 'comparisonResultPath',
    performanceDuration: 'performanceDuration',
    uploadedAt: 'uploadedAt'
};
exports.Prisma.UserWeaknessScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    weaknessType: 'weaknessType',
    weaknessKey: 'weaknessKey',
    techniqueTagId: 'techniqueTagId',
    severity: 'severity',
    sampleCount: 'sampleCount',
    lastUpdated: 'lastUpdated'
};
exports.Prisma.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.Prisma.NullableJsonNullValueInput = {
    DbNull: Prisma.DbNull,
    JsonNull: Prisma.JsonNull
};
exports.Prisma.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.Prisma.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.Prisma.JsonNullValueFilter = {
    DbNull: Prisma.DbNull,
    JsonNull: Prisma.JsonNull,
    AnyNull: Prisma.AnyNull
};
exports.JobStatus = exports.$Enums.JobStatus = {
    processing: 'processing',
    done: 'done',
    error: 'error'
};
exports.Role = exports.$Enums.Role = {
    student: 'student',
    teacher: 'teacher'
};
exports.PerformanceType = exports.$Enums.PerformanceType = {
    user: 'user',
    pro: 'pro'
};
exports.PerformanceStatus = exports.$Enums.PerformanceStatus = {
    uploaded: 'uploaded',
    invalid: 'invalid',
    deleted: 'deleted'
};
exports.PracticeCategory = exports.$Enums.PracticeCategory = {
    scale: 'scale',
    arpeggio: 'arpeggio',
    etude: 'etude'
};
exports.Prisma.ModelName = {
    User: 'User',
    Score: 'Score',
    Performance: 'Performance',
    PracticeItem: 'PracticeItem',
    TechniqueTag: 'TechniqueTag',
    PracticeItemTechnique: 'PracticeItemTechnique',
    PracticePerformance: 'PracticePerformance',
    UserWeakness: 'UserWeakness'
};
/**
 * Create the Client
 */ const config = {
    "previewFeatures": [],
    "clientVersion": "7.4.1",
    "engineVersion": "55ae170b1ced7fc6ed07a15f110549408c501bb3",
    "activeProvider": "postgresql",
    "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"../app/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\nenum JobStatus {\n  processing\n  done\n  error\n}\n\nmodel User {\n  id             String        @id @default(cuid())\n  supabaseUserId String        @unique\n  name           String\n  role           String\n  plan           String?\n  createdAt      DateTime      @default(now())\n  updatedAt      DateTime      @updatedAt\n  performances   Performance[]\n  scores         Score[]\n\n  // ▼ 練習メニュー追加分\n  practicePerformances PracticePerformance[]\n  weaknesses           UserWeakness[]\n\n  @@index([role])\n}\n\nmodel Score {\n  id               String        @id @default(cuid())\n  createdById      String\n  title            String\n  composer         String?\n  arranger         String?\n  originalXmlPath  String\n  generatedXmlPath String?\n  analysisStatus   JobStatus     @default(processing)\n  buildStatus      JobStatus     @default(processing)\n  keyTonic         String?\n  keyMode          String?\n  timeNumerator    Int?\n  timeDenominator  Int?\n  defaultTempo     Int?\n  createdAt        DateTime      @default(now())\n  performances     Performance[]\n  createdBy        User          @relation(fields: [createdById], references: [id])\n\n  @@index([createdById])\n}\n\nmodel Performance {\n  id                   String            @id @default(cuid())\n  performanceType      PerformanceType\n  performanceStatus    PerformanceStatus @default(uploaded)\n  userId               String\n  scoreId              String\n  audioPath            String\n  audioFeaturesPath    String?\n  comparisonResultPath String?\n  pseudoXmlPath        String?\n  performanceDuration  Float?\n  performanceDate      DateTime?\n  uploadedAt           DateTime          @default(now())\n  createdAt            DateTime          @default(now())\n  score                Score             @relation(fields: [scoreId], references: [id])\n  user                 User              @relation(fields: [userId], references: [id])\n\n  @@index([scoreId])\n  @@index([userId, uploadedAt])\n}\n\nenum Role {\n  student\n  teacher\n}\n\nenum PerformanceType {\n  user\n  pro\n}\n\nenum PerformanceStatus {\n  uploaded\n  invalid\n  deleted\n}\n\n// =============================================\n// ▼ 練習メニュー機能\n// =============================================\n\nenum PracticeCategory {\n  scale\n  arpeggio\n  etude\n}\n\n// ▼ 変更: Difficulty enum を削除 → difficulty は Int(1〜5) に変更\n\nmodel PracticeItem {\n  id               String           @id @default(cuid())\n  category         PracticeCategory\n  title            String\n  composer         String? // ▼ 追加\n  description      String?\n  descriptionShort String? // ▼ 追加\n  difficulty       Int              @default(1) // ▼ 変更: enum → Int（星1〜5）\n\n  keyTonic   String\n  keyMode    String\n  tempoMin   Int?\n  tempoMax   Int?\n  positions  String[]\n  instrument String   @default(\"violin\")\n\n  originalXmlPath  String\n  generatedXmlPath String?\n  analysisPath     String?\n  analysisStatus   JobStatus @default(processing)\n  buildStatus      JobStatus @default(processing)\n\n  source      String?\n  sortOrder   Int      @default(0)\n  isPublished Boolean  @default(true)\n  metadata    Json? // ▼ 追加\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  techniques           PracticeItemTechnique[]\n  practicePerformances PracticePerformance[]\n\n  @@index([category, keyTonic, keyMode])\n  @@index([category, difficulty])\n  @@index([category, isPublished, sortOrder])\n}\n\nmodel TechniqueTag {\n  id              String   @id @default(cuid())\n  category        String\n  name            String\n  nameEn          String?\n  description     String?\n  xmlTags         String[]\n  isAnalyzable    String\n  implementStatus String\n\n  practiceItems PracticeItemTechnique[]\n  weaknesses    UserWeakness[]\n\n  @@unique([category, name])\n  @@index([category])\n}\n\nmodel PracticeItemTechnique {\n  practiceItemId String\n  techniqueTagId String\n  isPrimary      Boolean @default(false)\n\n  practiceItem PracticeItem @relation(fields: [practiceItemId], references: [id])\n  techniqueTag TechniqueTag @relation(fields: [techniqueTagId], references: [id])\n\n  @@id([practiceItemId, techniqueTagId])\n}\n\nmodel PracticePerformance {\n  id                   String   @id @default(cuid())\n  userId               String\n  practiceItemId       String\n  audioPath            String\n  comparisonResultPath String?\n  performanceDuration  Float?\n  uploadedAt           DateTime @default(now())\n\n  user         User         @relation(fields: [userId], references: [id])\n  practiceItem PracticeItem @relation(fields: [practiceItemId], references: [id])\n\n  @@index([userId, practiceItemId, uploadedAt])\n  @@index([practiceItemId])\n}\n\nmodel UserWeakness {\n  id             String   @id @default(cuid())\n  userId         String\n  weaknessType   String\n  weaknessKey    String\n  techniqueTagId String?\n  severity       Float\n  sampleCount    Int\n  lastUpdated    DateTime @default(now())\n\n  user         User          @relation(fields: [userId], references: [id])\n  techniqueTag TechniqueTag? @relation(fields: [techniqueTagId], references: [id])\n\n  @@unique([userId, weaknessType, weaknessKey])\n  @@index([userId, severity])\n}\n"
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"supabaseUserId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"plan\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"performances\",\"kind\":\"object\",\"type\":\"Performance\",\"relationName\":\"PerformanceToUser\"},{\"name\":\"scores\",\"kind\":\"object\",\"type\":\"Score\",\"relationName\":\"ScoreToUser\"},{\"name\":\"practicePerformances\",\"kind\":\"object\",\"type\":\"PracticePerformance\",\"relationName\":\"PracticePerformanceToUser\"},{\"name\":\"weaknesses\",\"kind\":\"object\",\"type\":\"UserWeakness\",\"relationName\":\"UserToUserWeakness\"}],\"dbName\":null},\"Score\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"composer\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"arranger\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"originalXmlPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"generatedXmlPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"analysisStatus\",\"kind\":\"enum\",\"type\":\"JobStatus\"},{\"name\":\"buildStatus\",\"kind\":\"enum\",\"type\":\"JobStatus\"},{\"name\":\"keyTonic\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"keyMode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"timeNumerator\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"timeDenominator\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"defaultTempo\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"performances\",\"kind\":\"object\",\"type\":\"Performance\",\"relationName\":\"PerformanceToScore\"},{\"name\":\"createdBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"ScoreToUser\"}],\"dbName\":null},\"Performance\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"performanceType\",\"kind\":\"enum\",\"type\":\"PerformanceType\"},{\"name\":\"performanceStatus\",\"kind\":\"enum\",\"type\":\"PerformanceStatus\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scoreId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"audioPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"audioFeaturesPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"comparisonResultPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"pseudoXmlPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"performanceDuration\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"performanceDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"uploadedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"score\",\"kind\":\"object\",\"type\":\"Score\",\"relationName\":\"PerformanceToScore\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PerformanceToUser\"}],\"dbName\":null},\"PracticeItem\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"category\",\"kind\":\"enum\",\"type\":\"PracticeCategory\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"composer\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"descriptionShort\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"difficulty\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"keyTonic\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"keyMode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tempoMin\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tempoMax\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"positions\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"instrument\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"originalXmlPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"generatedXmlPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"analysisPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"analysisStatus\",\"kind\":\"enum\",\"type\":\"JobStatus\"},{\"name\":\"buildStatus\",\"kind\":\"enum\",\"type\":\"JobStatus\"},{\"name\":\"source\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sortOrder\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"isPublished\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"metadata\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"techniques\",\"kind\":\"object\",\"type\":\"PracticeItemTechnique\",\"relationName\":\"PracticeItemToPracticeItemTechnique\"},{\"name\":\"practicePerformances\",\"kind\":\"object\",\"type\":\"PracticePerformance\",\"relationName\":\"PracticeItemToPracticePerformance\"}],\"dbName\":null},\"TechniqueTag\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"category\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nameEn\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"xmlTags\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isAnalyzable\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"implementStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"practiceItems\",\"kind\":\"object\",\"type\":\"PracticeItemTechnique\",\"relationName\":\"PracticeItemTechniqueToTechniqueTag\"},{\"name\":\"weaknesses\",\"kind\":\"object\",\"type\":\"UserWeakness\",\"relationName\":\"TechniqueTagToUserWeakness\"}],\"dbName\":null},\"PracticeItemTechnique\":{\"fields\":[{\"name\":\"practiceItemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"techniqueTagId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isPrimary\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"practiceItem\",\"kind\":\"object\",\"type\":\"PracticeItem\",\"relationName\":\"PracticeItemToPracticeItemTechnique\"},{\"name\":\"techniqueTag\",\"kind\":\"object\",\"type\":\"TechniqueTag\",\"relationName\":\"PracticeItemTechniqueToTechniqueTag\"}],\"dbName\":null},\"PracticePerformance\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"practiceItemId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"audioPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"comparisonResultPath\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"performanceDuration\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"uploadedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PracticePerformanceToUser\"},{\"name\":\"practiceItem\",\"kind\":\"object\",\"type\":\"PracticeItem\",\"relationName\":\"PracticeItemToPracticePerformance\"}],\"dbName\":null},\"UserWeakness\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"weaknessType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"weaknessKey\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"techniqueTagId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"severity\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"sampleCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"lastUpdated\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToUserWeakness\"},{\"name\":\"techniqueTag\",\"kind\":\"object\",\"type\":\"TechniqueTag\",\"relationName\":\"TechniqueTagToUserWeakness\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
defineDmmfProperty(exports.Prisma, config.runtimeDataModel);
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"orderBy\",\"cursor\",\"performances\",\"createdBy\",\"_count\",\"score\",\"user\",\"scores\",\"practiceItem\",\"practiceItems\",\"techniqueTag\",\"weaknesses\",\"techniques\",\"practicePerformances\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.createManyAndReturn\",\"User.updateOne\",\"User.updateMany\",\"User.updateManyAndReturn\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"Score.findUnique\",\"Score.findUniqueOrThrow\",\"Score.findFirst\",\"Score.findFirstOrThrow\",\"Score.findMany\",\"Score.createOne\",\"Score.createMany\",\"Score.createManyAndReturn\",\"Score.updateOne\",\"Score.updateMany\",\"Score.updateManyAndReturn\",\"Score.upsertOne\",\"Score.deleteOne\",\"Score.deleteMany\",\"_avg\",\"_sum\",\"Score.groupBy\",\"Score.aggregate\",\"Performance.findUnique\",\"Performance.findUniqueOrThrow\",\"Performance.findFirst\",\"Performance.findFirstOrThrow\",\"Performance.findMany\",\"Performance.createOne\",\"Performance.createMany\",\"Performance.createManyAndReturn\",\"Performance.updateOne\",\"Performance.updateMany\",\"Performance.updateManyAndReturn\",\"Performance.upsertOne\",\"Performance.deleteOne\",\"Performance.deleteMany\",\"Performance.groupBy\",\"Performance.aggregate\",\"PracticeItem.findUnique\",\"PracticeItem.findUniqueOrThrow\",\"PracticeItem.findFirst\",\"PracticeItem.findFirstOrThrow\",\"PracticeItem.findMany\",\"PracticeItem.createOne\",\"PracticeItem.createMany\",\"PracticeItem.createManyAndReturn\",\"PracticeItem.updateOne\",\"PracticeItem.updateMany\",\"PracticeItem.updateManyAndReturn\",\"PracticeItem.upsertOne\",\"PracticeItem.deleteOne\",\"PracticeItem.deleteMany\",\"PracticeItem.groupBy\",\"PracticeItem.aggregate\",\"TechniqueTag.findUnique\",\"TechniqueTag.findUniqueOrThrow\",\"TechniqueTag.findFirst\",\"TechniqueTag.findFirstOrThrow\",\"TechniqueTag.findMany\",\"TechniqueTag.createOne\",\"TechniqueTag.createMany\",\"TechniqueTag.createManyAndReturn\",\"TechniqueTag.updateOne\",\"TechniqueTag.updateMany\",\"TechniqueTag.updateManyAndReturn\",\"TechniqueTag.upsertOne\",\"TechniqueTag.deleteOne\",\"TechniqueTag.deleteMany\",\"TechniqueTag.groupBy\",\"TechniqueTag.aggregate\",\"PracticeItemTechnique.findUnique\",\"PracticeItemTechnique.findUniqueOrThrow\",\"PracticeItemTechnique.findFirst\",\"PracticeItemTechnique.findFirstOrThrow\",\"PracticeItemTechnique.findMany\",\"PracticeItemTechnique.createOne\",\"PracticeItemTechnique.createMany\",\"PracticeItemTechnique.createManyAndReturn\",\"PracticeItemTechnique.updateOne\",\"PracticeItemTechnique.updateMany\",\"PracticeItemTechnique.updateManyAndReturn\",\"PracticeItemTechnique.upsertOne\",\"PracticeItemTechnique.deleteOne\",\"PracticeItemTechnique.deleteMany\",\"PracticeItemTechnique.groupBy\",\"PracticeItemTechnique.aggregate\",\"PracticePerformance.findUnique\",\"PracticePerformance.findUniqueOrThrow\",\"PracticePerformance.findFirst\",\"PracticePerformance.findFirstOrThrow\",\"PracticePerformance.findMany\",\"PracticePerformance.createOne\",\"PracticePerformance.createMany\",\"PracticePerformance.createManyAndReturn\",\"PracticePerformance.updateOne\",\"PracticePerformance.updateMany\",\"PracticePerformance.updateManyAndReturn\",\"PracticePerformance.upsertOne\",\"PracticePerformance.deleteOne\",\"PracticePerformance.deleteMany\",\"PracticePerformance.groupBy\",\"PracticePerformance.aggregate\",\"UserWeakness.findUnique\",\"UserWeakness.findUniqueOrThrow\",\"UserWeakness.findFirst\",\"UserWeakness.findFirstOrThrow\",\"UserWeakness.findMany\",\"UserWeakness.createOne\",\"UserWeakness.createMany\",\"UserWeakness.createManyAndReturn\",\"UserWeakness.updateOne\",\"UserWeakness.updateMany\",\"UserWeakness.updateManyAndReturn\",\"UserWeakness.upsertOne\",\"UserWeakness.deleteOne\",\"UserWeakness.deleteMany\",\"UserWeakness.groupBy\",\"UserWeakness.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"userId\",\"weaknessType\",\"weaknessKey\",\"techniqueTagId\",\"severity\",\"sampleCount\",\"lastUpdated\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"practiceItemId\",\"audioPath\",\"comparisonResultPath\",\"performanceDuration\",\"uploadedAt\",\"isPrimary\",\"category\",\"name\",\"nameEn\",\"description\",\"xmlTags\",\"isAnalyzable\",\"implementStatus\",\"has\",\"hasEvery\",\"hasSome\",\"category_name\",\"every\",\"some\",\"none\",\"PracticeCategory\",\"title\",\"composer\",\"descriptionShort\",\"difficulty\",\"keyTonic\",\"keyMode\",\"tempoMin\",\"tempoMax\",\"positions\",\"instrument\",\"originalXmlPath\",\"generatedXmlPath\",\"analysisPath\",\"JobStatus\",\"analysisStatus\",\"buildStatus\",\"source\",\"sortOrder\",\"isPublished\",\"metadata\",\"createdAt\",\"updatedAt\",\"string_contains\",\"string_starts_with\",\"string_ends_with\",\"array_starts_with\",\"array_ends_with\",\"array_contains\",\"PerformanceType\",\"performanceType\",\"PerformanceStatus\",\"performanceStatus\",\"scoreId\",\"audioFeaturesPath\",\"pseudoXmlPath\",\"performanceDate\",\"createdById\",\"arranger\",\"timeNumerator\",\"timeDenominator\",\"defaultTempo\",\"supabaseUserId\",\"role\",\"plan\",\"userId_weaknessType_weaknessKey\",\"practiceItemId_techniqueTagId\",\"is\",\"isNot\",\"connectOrCreate\",\"upsert\",\"createMany\",\"set\",\"disconnect\",\"delete\",\"connect\",\"updateMany\",\"deleteMany\",\"push\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "qQRPgAEOAwAAoAIAIAgAAKECACAMAAD-AQAgDgAAkgIAIJcBAACfAgAwmAEAACcAEJkBAACfAgAwmgEBAAAAAbQBAQD7AQAh1gFAAJECACHXAUAAkQIAIesBAQAAAAHsAQEA-wEAIe0BAQD8AQAhAQAAAAEAIBIGAACyAgAgBwAApQIAIJcBAACuAgAwmAEAAAMAEJkBAACuAgAwmgEBAPsBACGbAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAh1gFAAJECACHfAQAArwLfASLhAQAAsALhASLiAQEA-wEAIeMBAQD8AQAh5AEBAPwBACHlAUAAsQIAIQcGAADzAwAgBwAA8AMAIK8BAACzAgAgsAEAALMCACDjAQAAswIAIOQBAACzAgAg5QEAALMCACASBgAAsgIAIAcAAKUCACCXAQAArgIAMJgBAAADABCZAQAArgIAMJoBAQAAAAGbAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAh1gFAAJECACHfAQAArwLfASLhAQAAsALhASLiAQEA-wEAIeMBAQD8AQAh5AEBAPwBACHlAUAAsQIAIQMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgAQAAAAMAIBQDAACgAgAgBAAApQIAIJcBAACtAgAwmAEAAAkAEJkBAACtAgAwmgEBAPsBACHCAQEA-wEAIcMBAQD8AQAhxgEBAPwBACHHAQEA_AEAIcwBAQD7AQAhzQEBAPwBACHQAQAAjgLQASLRAQAAjgLQASLWAUAAkQIAIeYBAQD7AQAh5wEBAPwBACHoAQIAjQIAIekBAgCNAgAh6gECAI0CACEKAwAA7gMAIAQAAPADACDDAQAAswIAIMYBAACzAgAgxwEAALMCACDNAQAAswIAIOcBAACzAgAg6AEAALMCACDpAQAAswIAIOoBAACzAgAgFAMAAKACACAEAAClAgAglwEAAK0CADCYAQAACQAQmQEAAK0CADCaAQEAAAABwgEBAPsBACHDAQEA_AEAIcYBAQD8AQAhxwEBAPwBACHMAQEA-wEAIc0BAQD8AQAh0AEAAI4C0AEi0QEAAI4C0AEi1gFAAJECACHmAQEA-wEAIecBAQD8AQAh6AECAI0CACHpAQIAjQIAIeoBAgCNAgAhAwAAAAkAIAEAAAoAMAIAAAsAIAwHAAClAgAgCQAAqQIAIJcBAACrAgAwmAEAAA0AEJkBAACrAgAwmgEBAPsBACGbAQEA-wEAIa0BAQD7AQAhrgEBAPsBACGvAQEA_AEAIbABCACsAgAhsQFAAJECACEEBwAA8AMAIAkAAPIDACCvAQAAswIAILABAACzAgAgDAcAAKUCACAJAACpAgAglwEAAKsCADCYAQAADQAQmQEAAKsCADCaAQEAAAABmwEBAPsBACGtAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAhAwAAAA0AIAEAAA4AMAIAAA8AIAgJAACpAgAgCwAAqgIAIJcBAACoAgAwmAEAABEAEJkBAACoAgAwngEBAPsBACGtAQEA-wEAIbIBIACPAgAhAgkAAPIDACALAADxAwAgCQkAAKkCACALAACqAgAglwEAAKgCADCYAQAAEQAQmQEAAKgCADCeAQEA-wEAIa0BAQD7AQAhsgEgAI8CACHvAQAApwIAIAMAAAARACABAAASADACAAATACADAAAAEQAgAQAAEgAwAgAAEwAgDQcAAKUCACALAACmAgAglwEAAKMCADCYAQAAFgAQmQEAAKMCADCaAQEA-wEAIZsBAQD7AQAhnAEBAPsBACGdAQEA-wEAIZ4BAQD8AQAhnwEIAKQCACGgAQIAjAIAIaEBQACRAgAhAwcAAPADACALAADxAwAgngEAALMCACAOBwAApQIAIAsAAKYCACCXAQAAowIAMJgBAAAWABCZAQAAowIAMJoBAQAAAAGbAQEA-wEAIZwBAQD7AQAhnQEBAPsBACGeAQEA_AEAIZ8BCACkAgAhoAECAIwCACGhAUAAkQIAIe4BAACiAgAgAwAAABYAIAEAABcAMAIAABgAIA0KAAD9AQAgDAAA_gEAIJcBAAD6AQAwmAEAABoAEJkBAAD6AQAwmgEBAPsBACGzAQEA-wEAIbQBAQD7AQAhtQEBAPwBACG2AQEA_AEAIbcBAAD4AQAguAEBAPsBACG5AQEA-wEAIQEAAAAaACABAAAAEQAgAQAAABYAIAMAAAANACABAAAOADACAAAPACABAAAAEQAgAQAAAA0AIAMAAAAWACABAAAXADACAAAYACABAAAAAwAgAQAAAAkAIAEAAAANACABAAAAFgAgAQAAAAEAIA4DAACgAgAgCAAAoQIAIAwAAP4BACAOAACSAgAglwEAAJ8CADCYAQAAJwAQmQEAAJ8CADCaAQEA-wEAIbQBAQD7AQAh1gFAAJECACHXAUAAkQIAIesBAQD7AQAh7AEBAPsBACHtAQEA_AEAIQUDAADuAwAgCAAA7wMAIAwAAPYCACAOAACaAwAg7QEAALMCACADAAAAJwAgAQAAKAAwAgAAAQAgAwAAACcAIAEAACgAMAIAAAEAIAMAAAAnACABAAAoADACAAABACALAwAA6gMAIAgAAOsDACAMAADtAwAgDgAA7AMAIJoBAQAAAAG0AQEAAAAB1gFAAAAAAdcBQAAAAAHrAQEAAAAB7AEBAAAAAe0BAQAAAAEBFAAALAAgB5oBAQAAAAG0AQEAAAAB1gFAAAAAAdcBQAAAAAHrAQEAAAAB7AEBAAAAAe0BAQAAAAEBFAAALgAwARQAAC4AMAsDAAC_AwAgCAAAwAMAIAwAAMIDACAOAADBAwAgmgEBALkCACG0AQEAuQIAIdYBQAC8AgAh1wFAALwCACHrAQEAuQIAIewBAQC5AgAh7QEBAL0CACECAAAAAQAgFAAAMQAgB5oBAQC5AgAhtAEBALkCACHWAUAAvAIAIdcBQAC8AgAh6wEBALkCACHsAQEAuQIAIe0BAQC9AgAhAgAAACcAIBQAADMAIAIAAAAnACAUAAAzACADAAAAAQAgGwAALAAgHAAAMQAgAQAAAAEAIAEAAAAnACAEBQAAvAMAICEAAL4DACAiAAC9AwAg7QEAALMCACAKlwEAAJ4CADCYAQAAOgAQmQEAAJ4CADCaAQEA3wEAIbQBAQDfAQAh1gFAAOMBACHXAUAA4wEAIesBAQDfAQAh7AEBAN8BACHtAQEA4AEAIQMAAAAnACABAAA5ADAgAAA6ACADAAAAJwAgAQAAKAAwAgAAAQAgAQAAAAsAIAEAAAALACADAAAACQAgAQAACgAwAgAACwAgAwAAAAkAIAEAAAoAMAIAAAsAIAMAAAAJACABAAAKADACAAALACARAwAAugMAIAQAALsDACCaAQEAAAABwgEBAAAAAcMBAQAAAAHGAQEAAAABxwEBAAAAAcwBAQAAAAHNAQEAAAAB0AEAAADQAQLRAQAAANABAtYBQAAAAAHmAQEAAAAB5wEBAAAAAegBAgAAAAHpAQIAAAAB6gECAAAAAQEUAABCACAPmgEBAAAAAcIBAQAAAAHDAQEAAAABxgEBAAAAAccBAQAAAAHMAQEAAAABzQEBAAAAAdABAAAA0AEC0QEAAADQAQLWAUAAAAAB5gEBAAAAAecBAQAAAAHoAQIAAAAB6QECAAAAAeoBAgAAAAEBFAAARAAwARQAAEQAMBEDAACsAwAgBAAArQMAIJoBAQC5AgAhwgEBALkCACHDAQEAvQIAIcYBAQC9AgAhxwEBAL0CACHMAQEAuQIAIc0BAQC9AgAh0AEAAP8C0AEi0QEAAP8C0AEi1gFAALwCACHmAQEAuQIAIecBAQC9AgAh6AECAP0CACHpAQIA_QIAIeoBAgD9AgAhAgAAAAsAIBQAAEcAIA-aAQEAuQIAIcIBAQC5AgAhwwEBAL0CACHGAQEAvQIAIccBAQC9AgAhzAEBALkCACHNAQEAvQIAIdABAAD_AtABItEBAAD_AtABItYBQAC8AgAh5gEBALkCACHnAQEAvQIAIegBAgD9AgAh6QECAP0CACHqAQIA_QIAIQIAAAAJACAUAABJACACAAAACQAgFAAASQAgAwAAAAsAIBsAAEIAIBwAAEcAIAEAAAALACABAAAACQAgDQUAAKcDACAhAACqAwAgIgAAqQMAIDMAAKgDACA0AACrAwAgwwEAALMCACDGAQAAswIAIMcBAACzAgAgzQEAALMCACDnAQAAswIAIOgBAACzAgAg6QEAALMCACDqAQAAswIAIBKXAQAAnQIAMJgBAABQABCZAQAAnQIAMJoBAQDfAQAhwgEBAN8BACHDAQEA4AEAIcYBAQDgAQAhxwEBAOABACHMAQEA3wEAIc0BAQDgAQAh0AEAAIIC0AEi0QEAAIIC0AEi1gFAAOMBACHmAQEA3wEAIecBAQDgAQAh6AECAIECACHpAQIAgQIAIeoBAgCBAgAhAwAAAAkAIAEAAE8AMCAAAFAAIAMAAAAJACABAAAKADACAAALACABAAAABQAgAQAAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIA8GAAClAwAgBwAApgMAIJoBAQAAAAGbAQEAAAABrgEBAAAAAa8BAQAAAAGwAQgAAAABsQFAAAAAAdYBQAAAAAHfAQAAAN8BAuEBAAAA4QEC4gEBAAAAAeMBAQAAAAHkAQEAAAAB5QFAAAAAAQEUAABYACANmgEBAAAAAZsBAQAAAAGuAQEAAAABrwEBAAAAAbABCAAAAAGxAUAAAAAB1gFAAAAAAd8BAAAA3wEC4QEAAADhAQLiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAUAAAAABARQAAFoAMAEUAABaADAPBgAAowMAIAcAAKQDACCaAQEAuQIAIZsBAQC5AgAhrgEBALkCACGvAQEAvQIAIbABCADHAgAhsQFAALwCACHWAUAAvAIAId8BAACgA98BIuEBAAChA-EBIuIBAQC5AgAh4wEBAL0CACHkAQEAvQIAIeUBQACiAwAhAgAAAAUAIBQAAF0AIA2aAQEAuQIAIZsBAQC5AgAhrgEBALkCACGvAQEAvQIAIbABCADHAgAhsQFAALwCACHWAUAAvAIAId8BAACgA98BIuEBAAChA-EBIuIBAQC5AgAh4wEBAL0CACHkAQEAvQIAIeUBQACiAwAhAgAAAAMAIBQAAF8AIAIAAAADACAUAABfACADAAAABQAgGwAAWAAgHAAAXQAgAQAAAAUAIAEAAAADACAKBQAAmwMAICEAAJ4DACAiAACdAwAgMwAAnAMAIDQAAJ8DACCvAQAAswIAILABAACzAgAg4wEAALMCACDkAQAAswIAIOUBAACzAgAgEJcBAACTAgAwmAEAAGYAEJkBAACTAgAwmgEBAN8BACGbAQEA3wEAIa4BAQDfAQAhrwEBAOABACGwAQgA8AEAIbEBQADjAQAh1gFAAOMBACHfAQAAlALfASLhAQAAlQLhASLiAQEA3wEAIeMBAQDgAQAh5AEBAOABACHlAUAAlgIAIQMAAAADACABAABlADAgAABmACADAAAAAwAgAQAABAAwAgAABQAgHQ0AAP0BACAOAACSAgAglwEAAIoCADCYAQAAbAAQmQEAAIoCADCaAQEAAAABswEAAIsCwgEitgEBAPwBACHCAQEA-wEAIcMBAQD8AQAhxAEBAPwBACHFAQIAjAIAIcYBAQD7AQAhxwEBAPsBACHIAQIAjQIAIckBAgCNAgAhygEAAPgBACDLAQEA-wEAIcwBAQD7AQAhzQEBAPwBACHOAQEA_AEAIdABAACOAtABItEBAACOAtABItIBAQD8AQAh0wECAIwCACHUASAAjwIAIdUBAACQAgAg1gFAAJECACHXAUAAkQIAIQEAAABpACABAAAAaQAgHQ0AAP0BACAOAACSAgAglwEAAIoCADCYAQAAbAAQmQEAAIoCADCaAQEA-wEAIbMBAACLAsIBIrYBAQD8AQAhwgEBAPsBACHDAQEA_AEAIcQBAQD8AQAhxQECAIwCACHGAQEA-wEAIccBAQD7AQAhyAECAI0CACHJAQIAjQIAIcoBAAD4AQAgywEBAPsBACHMAQEA-wEAIc0BAQD8AQAhzgEBAPwBACHQAQAAjgLQASLRAQAAjgLQASLSAQEA_AEAIdMBAgCMAgAh1AEgAI8CACHVAQAAkAIAINYBQACRAgAh1wFAAJECACELDQAA9QIAIA4AAJoDACC2AQAAswIAIMMBAACzAgAgxAEAALMCACDIAQAAswIAIMkBAACzAgAgzQEAALMCACDOAQAAswIAINIBAACzAgAg1QEAALMCACADAAAAbAAgAQAAbQAwAgAAaQAgAwAAAGwAIAEAAG0AMAIAAGkAIAMAAABsACABAABtADACAABpACAaDQAAmAMAIA4AAJkDACCaAQEAAAABswEAAADCAQK2AQEAAAABwgEBAAAAAcMBAQAAAAHEAQEAAAABxQECAAAAAcYBAQAAAAHHAQEAAAAByAECAAAAAckBAgAAAAHKAQAAlwMAIMsBAQAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHQAQAAANABAtEBAAAA0AEC0gEBAAAAAdMBAgAAAAHUASAAAAAB1QGAAAAAAdYBQAAAAAHXAUAAAAABARQAAHEAIBiaAQEAAAABswEAAADCAQK2AQEAAAABwgEBAAAAAcMBAQAAAAHEAQEAAAABxQECAAAAAcYBAQAAAAHHAQEAAAAByAECAAAAAckBAgAAAAHKAQAAlwMAIMsBAQAAAAHMAQEAAAABzQEBAAAAAc4BAQAAAAHQAQAAANABAtEBAAAA0AEC0gEBAAAAAdMBAgAAAAHUASAAAAAB1QGAAAAAAdYBQAAAAAHXAUAAAAABARQAAHMAMAEUAABzADAaDQAAgAMAIA4AAIEDACCaAQEAuQIAIbMBAAD8AsIBIrYBAQC9AgAhwgEBALkCACHDAQEAvQIAIcQBAQC9AgAhxQECALsCACHGAQEAuQIAIccBAQC5AgAhyAECAP0CACHJAQIA_QIAIcoBAAD-AgAgywEBALkCACHMAQEAuQIAIc0BAQC9AgAhzgEBAL0CACHQAQAA_wLQASLRAQAA_wLQASLSAQEAvQIAIdMBAgC7AgAh1AEgAM8CACHVAYAAAAAB1gFAALwCACHXAUAAvAIAIQIAAABpACAUAAB2ACAYmgEBALkCACGzAQAA_ALCASK2AQEAvQIAIcIBAQC5AgAhwwEBAL0CACHEAQEAvQIAIcUBAgC7AgAhxgEBALkCACHHAQEAuQIAIcgBAgD9AgAhyQECAP0CACHKAQAA_gIAIMsBAQC5AgAhzAEBALkCACHNAQEAvQIAIc4BAQC9AgAh0AEAAP8C0AEi0QEAAP8C0AEi0gEBAL0CACHTAQIAuwIAIdQBIADPAgAh1QGAAAAAAdYBQAC8AgAh1wFAALwCACECAAAAbAAgFAAAeAAgAgAAAGwAIBQAAHgAIAMAAABpACAbAABxACAcAAB2ACABAAAAaQAgAQAAAGwAIA4FAAD3AgAgIQAA-gIAICIAAPkCACAzAAD4AgAgNAAA-wIAILYBAACzAgAgwwEAALMCACDEAQAAswIAIMgBAACzAgAgyQEAALMCACDNAQAAswIAIM4BAACzAgAg0gEAALMCACDVAQAAswIAIBuXAQAA_wEAMJgBAAB_ABCZAQAA_wEAMJoBAQDfAQAhswEAAIACwgEitgEBAOABACHCAQEA3wEAIcMBAQDgAQAhxAEBAOABACHFAQIA4gEAIcYBAQDfAQAhxwEBAN8BACHIAQIAgQIAIckBAgCBAgAhygEAAPgBACDLAQEA3wEAIcwBAQDfAQAhzQEBAOABACHOAQEA4AEAIdABAACCAtABItEBAACCAtABItIBAQDgAQAh0wECAOIBACHUASAA9AEAIdUBAACDAgAg1gFAAOMBACHXAUAA4wEAIQMAAABsACABAAB-ADAgAAB_ACADAAAAbAAgAQAAbQAwAgAAaQAgDgoAAP0BACAMAAD-AQAglwEAAPoBADCYAQAAGgAQmQEAAPoBADCaAQEAAAABswEBAPsBACG0AQEA-wEAIbUBAQD8AQAhtgEBAPwBACG3AQAA-AEAILgBAQD7AQAhuQEBAPsBACG9AQAA-QEAIAEAAACCAQAgAQAAAIIBACAECgAA9QIAIAwAAPYCACC1AQAAswIAILYBAACzAgAgAwAAABoAIAEAAIUBADACAACCAQAgAwAAABoAIAEAAIUBADACAACCAQAgAwAAABoAIAEAAIUBADACAACCAQAgCgoAAPMCACAMAAD0AgAgmgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQAA8gIAILgBAQAAAAG5AQEAAAABARQAAIkBACAImgEBAAAAAbMBAQAAAAG0AQEAAAABtQEBAAAAAbYBAQAAAAG3AQAA8gIAILgBAQAAAAG5AQEAAAABARQAAIsBADABFAAAiwEAMAoKAADYAgAgDAAA2QIAIJoBAQC5AgAhswEBALkCACG0AQEAuQIAIbUBAQC9AgAhtgEBAL0CACG3AQAA1wIAILgBAQC5AgAhuQEBALkCACECAAAAggEAIBQAAI4BACAImgEBALkCACGzAQEAuQIAIbQBAQC5AgAhtQEBAL0CACG2AQEAvQIAIbcBAADXAgAguAEBALkCACG5AQEAuQIAIQIAAAAaACAUAACQAQAgAgAAABoAIBQAAJABACADAAAAggEAIBsAAIkBACAcAACOAQAgAQAAAIIBACABAAAAGgAgBQUAANQCACAhAADWAgAgIgAA1QIAILUBAACzAgAgtgEAALMCACALlwEAAPcBADCYAQAAlwEAEJkBAAD3AQAwmgEBAN8BACGzAQEA3wEAIbQBAQDfAQAhtQEBAOABACG2AQEA4AEAIbcBAAD4AQAguAEBAN8BACG5AQEA3wEAIQMAAAAaACABAACWAQAwIAAAlwEAIAMAAAAaACABAACFAQAwAgAAggEAIAEAAAATACABAAAAEwAgAwAAABEAIAEAABIAMAIAABMAIAMAAAARACABAAASADACAAATACADAAAAEQAgAQAAEgAwAgAAEwAgBQkAANICACALAADTAgAgngEBAAAAAa0BAQAAAAGyASAAAAABARQAAJ8BACADngEBAAAAAa0BAQAAAAGyASAAAAABARQAAKEBADABFAAAoQEAMAUJAADQAgAgCwAA0QIAIJ4BAQC5AgAhrQEBALkCACGyASAAzwIAIQIAAAATACAUAACkAQAgA54BAQC5AgAhrQEBALkCACGyASAAzwIAIQIAAAARACAUA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CCiAQIAAAABowECAAAABKQBAgAAAASlAQIAAAABpgECAAAAAacBAgAAAAGoAQIAAAABqQECAOcBACELBQAA5QEAICEAAOYBACAiAADmAQAgogFAAAAAAaMBQAAAAASkAUAAAAAEpQFAAAAAAaYBQAAAAAGnAUAAAAABqAFAAAAAAakBQADkAQAhCwUAAOUBACAhAADmAQAgIgAA5gEAIKIBQAAAAAGjAUAAAAAEpAFAAAAABKUBQAAAAAGmAUAAAAABpwFAAAAAAagBQAAAAAGpAUAA5AEAIQiiAQIAAAABowECAAAABKQBAgAAAASlAQIAAAABpgECAAAAAacBAgAAAAGoAQIAAAABqQECAOUBACEIogFAAAAAAaMBQAAAAASkAUAAAAAEpQFAAAAAAaYBQAAAAAGnAUAAAAABqAFAAAAAAakBQADmAQAhDQUAAOUBACAhAADlAQAgIgAA5QEAIDMAAOgBACA0AADlAQAgogECAAAAAaMBAgAAAASkAQIAAAAEpQECAAAAAaYBAgAAAAGnAQIAAAABqAECAAAAAakBAgDnAQAhCKIBCAAAAAGjAQgAAAAEpAEIAAAABKUBCAAAAAGmAQgAAAABpwEIAAAAAagBCAAAAAGpAQgA6AEAIQ0FAADlAQAgIQAA6AEAICIAAOgBACAzAADoAQAgNAAA6AEAIKIBCAAAAAGjAQgAAAAEpAEIAAAABKUBCAAAAAGmAQgAAAABpwEIAAAAAagBCAAAAAGpAQgA6QEAIQ4FAADrAQAgIQAA7AEAICIAAOwBACCiAQEAAAABowEBAAAABaQBAQAAAAWlAQEAAAABpgEBAAAAAacBAQAAAAGoAQEAAAABqQEBAOoBACGqAQEAAAABqwEBAAAAAawBAQAAAAEIogECAAAAAaMBAgAAAAWkAQIAAAAFpQECAAAAAaYBAgAAAAGnAQIAAAABqAECAAAAAakBAgDrAQAhC6IBAQAAAAGjAQEAAAAFpAEBAAAABaUBAQAAAAGmAQEAAAABpwEBAAAAAagBAQAAAAGpAQEA7AEAIaoBAQAAAAGrAQEAAAABrAEBAAAAAQ4FAADlAQAgIQAA7gEAICIAAO4BACCiAQEAAAABowEBAAAABKQBAQAAAASlAQEAAAABpgEBAAAAAacBAQAAAAGoAQEAAAABqQEBAO0BACGqAQEAAAABqwEBAAAAAawBAQAAAAELogEBAAAAAaMBAQAAAASkAQEAAAAEpQEBAAAAAaYBAQAAAAGnAQEAAAABqAEBAAAAAakBAQDuAQAhqgEBAAAAAasBAQAAAAGsAQEAAAABCpcBAADvAQAwmAEAAMMBABCZAQAA7wEAMJoBAQDfAQAhmwEBAN8BACGtAQEA3wEAIa4BAQDfAQAhrwEBAOABACGwAQgA8AEAIbEBQADjAQAhDQUAAOsBACAhAADyAQAgIgAA8gEAIDMAAPIBACA0AADyAQAgogEIAAAAAaMBCAAAAAWkAQgAAAAFpQEIAAAAAaYBCAAAAAGnAQgAAAABqAEIAAAAAakBCADxAQAhDQUAAOsBACAhAADyAQAgIgAA8gEAIDMAAPIBACA0AADyAQAgogEIAAAAAaMBCAAAAAWkAQgAAAAFpQEIAAAAAaYBCAAAAAGnAQgAAAABqAEIAAAAAakBCADxAQAhCKIBCAAAAAGjAQgAAAAFpAEIAAAABaUBCAAAAAGmAQgAAAABpwEIAAAAAagBCAAAAAGpAQgA8gEAIQaXAQAA8wEAMJgBAACtAQAQmQEAAPMBADCeAQEA3wEAIa0BAQDfAQAhsgEgAPQBACEFBQAA5QEAICEAAPYBACAiAAD2AQAgogEgAAAAAakBIAD1AQAhBQUAAOUBACAhAAD2AQAgIgAA9gEAIKIBIAAAAAGpASAA9QEAIQKiASAAAAABqQEgAPYBACELlwEAAPcBADCYAQAAlwEAEJkBAAD3AQAwmgEBAN8BACGzAQEA3wEAIbQBAQDfAQAhtQEBAOABACG2AQEA4AEAIbcBAAD4AQAguAEBAN8BACG5AQEA3wEAIQSiAQEAAAAFugEBAAAAAbsBAQAAAAS8AQEAAAAEArMBAQAAAAG0AQEAAAABDQoAAP0BACAMAAD-AQAglwEAAPoBADCYAQAAGgAQmQEAAPoBADCaAQEA-wEAIbMBAQD7AQAhtAEBAPsBACG1AQEA_AEAIbYBAQD8AQAhtwEAAPgBACC4AQEA-wEAIbkBAQD7AQAhC6IBAQAAAAGjAQEAAAAEpAEBAAAABKUBAQAAAAGmAQEAAAABpwEBAAAAAagBAQAAAAGpAQEA7gEAIaoBAQAAAAGrAQEAAAABrAEBAAAAAQuiAQEAAAABowEBAAAABaQBAQAAAAWlAQEAAAABpgEBAAAAAacBAQAAAAGoAQEAAAABqQEBAOwBACGqAQEAAAABqwEBAAAAAawBAQAAAAEDvgEAABEAIL8BAAARACDAAQAAEQAgA74BAAAWACC_AQAAFgAgwAEAABYAIBuXAQAA_wEAMJgBAAB_ABCZAQAA_wEAMJoBAQDfAQAhswEAAIACwgEitgEBAOABACHCAQEA3wEAIcMBAQDgAQAhxAEBAOABACHFAQIA4gEAIcYBAQDfAQAhxwEBAN8BACHIAQIAgQIAIckBAgCBAgAhygEAAPgBACDLAQEA3wEAIcwBAQDfAQAhzQEBAOABACHOAQEA4AEAIdABAACCAtABItEBAACCAtABItIBAQDgAQAh0wECAOIBACHUASAA9AEAIdUBAACDAgAg1gFAAOMBACHXAUAA4wEAIQcFAADlAQAgIQAAiQIAICIAAIkCACCiAQAAAMIBAqMBAAAAwgEIpAEAAADCAQipAQAAiALCASINBQAA6wEAICEAAOsBACAiAADrAQAgMwAA8gEAIDQAAOsBACCiAQIAAAABowECAAAABaQBAgAAAAWlAQIAAAABpgECAAAAAacBAgAAAAGoAQIAAAABqQECAIcCACEHBQAA5QEAICEAAIYCACAiAACGAgAgogEAAADQAQKjAQAAANABCKQBAAAA0AEIqQEAAIUC0AEiDwUAAOsBACAhAACEAgAgIgAAhAIAIKIBgAAAAAGlAYAAAAABpgGAAAAAAacBgAAAAAGoAYAAAAABqQGAAAAAAdgBAQAAAAHZAQEAAAAB2gEBAAAAAdsBgAAAAAHcAYAAAAAB3QGAAAAAAQyiAYAAAAABpQGAAAAAAaYBgAAAAAGnAYAAAAABqAGAAAAAAakBgAAAAAHYAQEAAAAB2QEBAAAAAdoBAQAAAAHbAYAAAAAB3AGAAAAAAd0BgAAAAAEHBQAA5QEAICEAAIYCACAiAACGAgAgogEAAADQAQKjAQAAANABCKQBAAAA0AEIqQEAAIUC0AEiBKIBAAAA0AECowEAAADQAQikAQAAANABCKkBAACGAtABIg0FAADrAQAgIQAA6wEAICIAAOsBACAzAADyAQAgNAAA6wEAIKIBAgAAAAGjAQIAAAAFpAECAAAABaUBAgAAAAGmAQIAAAABpwECAAAAAagBAgAAAAGpAQIAhwIAIQcFAADlAQAgIQAAiQIAICIAAIkCACCiAQAAAMIBAqMBAAAAwgEIpAEAAADCAQipAQAAiALCASIEogEAAADCAQKjAQAAAMIBCKQBAAAAwgEIqQEAAIkCwgEiHQ0AAP0BACAOAACSAgAglwEAAIoCADCYAQAAbAAQmQEAAIoCADCaAQEA-wEAIbMBAACLAsIBIrYBAQD8AQAhwgEBAPsBACHDAQEA_AEAIcQBAQD8AQAhxQECAIwCACHGAQEA-wEAIccBAQD7AQAhyAECAI0CACHJAQIAjQIAIcoBAAD4AQAgywEBAPsBACHMAQEA-wEAIc0BAQD8AQAhzgEBAPwBACHQAQAAjgLQASLRAQAAjgLQASLSAQEA_AEAIdMBAgCMAgAh1AEgAI8CACHVAQAAkAIAINYBQACRAgAh1wFAAJECACEEogEAAADCAQKjAQAAAMIBCKQBAAAAwgEIqQEAAIkCwgEiCKIBAgAAAAGjAQIAAAAEpAECAAAABKUBAgAAAAGmAQIAAAABpwECAAAAAagBAgAAAAGpAQIA5QEAIQiiAQIAAAABowECAAAABaQBAgAAAAWlAQIAAAABpgECAAAAAacBAgAAAAGoAQIAAAABqQECAOsBACEEogEAAADQAQKjAQAAANABCKQBAAAA0AEIqQEAAIYC0AEiAqIBIAAAAAGpASAA9gEAIQyiAYAAAAABpQGAAAAAAaYBgAAAAAGnAYAAAAABqAGAAAAAAakBgAAAAAHYAQEAAAAB2QEBAAAAAdoBAQAAAAHbAYAAAAAB3AGAAAAAAd0BgAAAAAEIogFAAAAAAaMBQAAAAASkAUAAAAAEpQFAAAAAAaYBQAAAAAGnAUAAAAABqAFAAAAAAakBQADmAQAhA74BAAANACC_AQAADQAgwAEAAA0AIBCXAQAAkwIAMJgBAABmABCZAQAAkwIAMJoBAQDfAQAhmwEBAN8BACGuAQEA3wEAIa8BAQDgAQAhsAEIAPABACGxAUAA4wEAIdYBQADjAQAh3wEAAJQC3wEi4QEAAJUC4QEi4gEBAN8BACHjAQEA4AEAIeQBAQDgAQAh5QFAAJYCACEHBQAA5QEAICEAAJwCACAiAACcAgAgogEAAADfAQKjAQAAAN8BCKQBAAAA3wEIqQEAAJsC3wEiBwUAAOUBACAhAACaAgAgIgAAmgIAIKIBAAAA4QECowEAAADhAQikAQAAAOEBCKkBAACZAuEBIgsFAADrAQAgIQAAmAIAICIAAJgCACCiAUAAAAABowFAAAAABaQBQAAAAAWlAUAAAAABpgFAAAAAAacBQAAAAAGoAUAAAAABqQFAAJcCACELBQAA6wEAICEAAJgCACAiAACYAgAgogFAAAAAAaMBQAAAAAWkAUAAAAAFpQFAAAAAAaYBQAAAAAGnAUAAAAABqAFAAAAAAakBQACXAgAhCKIBQAAAAAGjAUAAAAAFpAFAAAAABaUBQAAAAAGmAUAAAAABpwFAAAAAAagBQAAAAAGpAUAAmAIAIQcFAADlAQAgIQAAmgIAICIAAJoCACCiAQAAAOEBAqMBAAAA4QEIpAEAAADhAQipAQAAmQLhASIEogEAAADhAQKjAQAAAOEBCKQBAAAA4QEIqQEAAJoC4QEiBwUAAOUBACAhAACcAgAgIgAAnAIAIKIBAAAA3wECowEAAADfAQikAQAAAN8BCKkBAACbAt8BIgSiAQAAAN8BAqMBAAAA3wEIpAEAAADfAQipAQAAnALfASISlwEAAJ0CADCYAQAAUAAQmQEAAJ0CADCaAQEA3wEAIcIBAQDfAQAhwwEBAOABACHGAQEA4AEAIccBAQDgAQAhzAEBAN8BACHNAQEA4AEAIdABAACCAtABItEBAACCAtABItYBQADjAQAh5gEBAN8BACHnAQEA4AEAIegBAgCBAgAh6QECAIECACHqAQIAgQIAIQqXAQAAngIAMJgBAAA6ABCZAQAAngIAMJoBAQDfAQAhtAEBAN8BACHWAUAA4wEAIdcBQADjAQAh6wEBAN8BACHsAQEA3wEAIe0BAQDgAQAhDgMAAKACACAIAAChAgAgDAAA_gEAIA4AAJICACCXAQAAnwIAMJgBAAAnABCZAQAAnwIAMJoBAQD7AQAhtAEBAPsBACHWAUAAkQIAIdcBQACRAgAh6wEBAPsBACHsAQEA-wEAIe0BAQD8AQAhA74BAAADACC_AQAAAwAgwAEAAAMAIAO-AQAACQAgvwEAAAkAIMABAAAJACADmwEBAAAAAZwBAQAAAAGdAQEAAAABDQcAAKUCACALAACmAgAglwEAAKMCADCYAQAAFgAQmQEAAKMCADCaAQEA-wEAIZsBAQD7AQAhnAEBAPsBACGdAQEA-wEAIZ4BAQD8AQAhnwEIAKQCACGgAQIAjAIAIaEBQACRAgAhCKIBCAAAAAGjAQgAAAAEpAEIAAAABKUBCAAAAAGmAQgAAAABpwEIAAAAAagBCAAAAAGpAQgA6AEAIRADAACgAgAgCAAAoQIAIAwAAP4BACAOAACSAgAglwEAAJ8CADCYAQAAJwAQmQEAAJ8CADCaAQEA-wEAIbQBAQD7AQAh1gFAAJECACHXAUAAkQIAIesBAQD7AQAh7AEBAPsBACHtAQEA_AEAIfABAAAnACDxAQAAJwAgDwoAAP0BACAMAAD-AQAglwEAAPoBADCYAQAAGgAQmQEAAPoBADCaAQEA-wEAIbMBAQD7AQAhtAEBAPsBACG1AQEA_AEAIbYBAQD8AQAhtwEAAPgBACC4AQEA-wEAIbkBAQD7AQAh8AEAABoAIPEBAAAaACACngEBAAAAAa0BAQAAAAEICQAAqQIAIAsAAKoCACCXAQAAqAIAMJgBAAARABCZAQAAqAIAMJ4BAQD7AQAhrQEBAPsBACGyASAAjwIAIR8NAAD9AQAgDgAAkgIAIJcBAACKAgAwmAEAAGwAEJkBAACKAgAwmgEBAPsBACGzAQAAiwLCASK2AQEA_AEAIcIBAQD7AQAhwwEBAPwBACHEAQEA_AEAIcUBAgCMAgAhxgEBAPsBACHHAQEA-wEAIcgBAgCNAgAhyQECAI0CACHKAQAA-AEAIMsBAQD7AQAhzAEBAPsBACHNAQEA_AEAIc4BAQD8AQAh0AEAAI4C0AEi0QEAAI4C0AEi0gEBAPwBACHTAQIAjAIAIdQBIACPAgAh1QEAAJACACDWAUAAkQIAIdcBQACRAgAh8AEAAGwAIPEBAABsACAPCgAA_QEAIAwAAP4BACCXAQAA-gEAMJgBAAAaABCZAQAA-gEAMJoBAQD7AQAhswEBAPsBACG0AQEA-wEAIbUBAQD8AQAhtgEBAPwBACG3AQAA-AEAILgBAQD7AQAhuQEBAPsBACHwAQAAGgAg8QEAABoAIAwHAAClAgAgCQAAqQIAIJcBAACrAgAwmAEAAA0AEJkBAACrAgAwmgEBAPsBACGbAQEA-wEAIa0BAQD7AQAhrgEBAPsBACGvAQEA_AEAIbABCACsAgAhsQFAAJECACEIogEIAAAAAaMBCAAAAAWkAQgAAAAFpQEIAAAAAaYBCAAAAAGnAQgAAAABqAEIAAAAAakBCADyAQAhFAMAAKACACAEAAClAgAglwEAAK0CADCYAQAACQAQmQEAAK0CADCaAQEA-wEAIcIBAQD7AQAhwwEBAPwBACHGAQEA_AEAIccBAQD8AQAhzAEBAPsBACHNAQEA_AEAIdABAACOAtABItEBAACOAtABItYBQACRAgAh5gEBAPsBACHnAQEA_AEAIegBAgCNAgAh6QECAI0CACHqAQIAjQIAIRIGAACyAgAgBwAApQIAIJcBAACuAgAwmAEAAAMAEJkBAACuAgAwmgEBAPsBACGbAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAh1gFAAJECACHfAQAArwLfASLhAQAAsALhASLiAQEA-wEAIeMBAQD8AQAh5AEBAPwBACHlAUAAsQIAIQSiAQAAAN8BAqMBAAAA3wEIpAEAAADfAQipAQAAnALfASIEogEAAADhAQKjAQAAAOEBCKQBAAAA4QEIqQEAAJoC4QEiCKIBQAAAAAGjAUAAAAAFpAFAAAAABaUBQAAAAAGmAUAAAAABpwFAAAAAAagBQAAAAAGpAUAAmAIAIRYDAACgAgAgBAAApQIAIJcBAACtAgAwmAEAAAkAEJkBAACtAgAwmgEBAPsBACHCAQEA-wEAIcMBAQD8AQAhxgEBAPwBACHHAQEA_AEAIcwBAQD7AQAhzQEBAPwBACHQAQAAjgLQASLRAQAAjgLQASLWAUAAkQIAIeYBAQD7AQAh5wEBAPwBACHoAQIAjQIAIekBAgCNAgAh6gECAI0CACHwAQAACQAg8QEAAAkAIAAAAAAAAAH1AQEAAAABBfUBCAAAAAH8AQgAAAAB_QEIAAAAAf4BCAAAAAH_AQgAAAABBfUBAgAAAAH8AQIAAAAB_QECAAAAAf4BAgAAAAH_AQIAAAABAfUBQAAAAAEB9QEBAAAAAQUbAACiBAAgHAAAqAQAIPIBAACjBAAg8wEAAKcEACD4AQAAAQAgBxsAAKAEACAcAAClBAAg8gEAAKEEACDzAQAApAQAIPYBAAAaACD3AQAAGgAg-AEAAIIBACADGwAAogQAIPIBAACjBAAg-AEAAAEAIAMbAACgBAAg8gEAAKEEACD4AQAAggEAIAAAAAAABfUBCAAAAAH8AQgAAAAB_QEIAAAAAf4BCAAAAAH_AQgAAAABBRsAAJgEACAcAACeBAAg8gEAAJkEACDzAQAAnQQAIPgBAAABACAFGwAAlgQAIBwAAJsEACDyAQAAlwQAIPMBAACaBAAg-AEAAGkAIAMbAACYBAAg8gEAAJkEACD4AQAAAQAgAxsAAJYEACDyAQAAlwQAIPgBAABpACAAAAAB9QEgAAAAAQUbAACOBAAgHAAAlAQAIPIBAACPBAAg8wEAAJMEACD4AQAAaQAgBRsAAIwEACAcAACRBAAg8gEAAI0EACDzAQAAkAQAIPgBAACCAQAgAxsAAI4EACDyAQAAjwQAIPgBAABpACADGwAAjAQAIPIBAACNBAAg-AEAAIIBACAAAAAC9QEBAAAABPsBAQAAAAULGwAA5gIAMBwAAOsCADDyAQAA5wIAMPMBAADoAgAw9AEAAOkCACD1AQAA6gIAMPYBAADqAgAw9wEAAOoCADD4AQAA6gIAMPkBAADsAgAw-gEAAO0CADALGwAA2gIAMBwAAN8CADDyAQAA2wIAMPMBAADcAgAw9AEAAN0CACD1AQAA3gIAMPYBAADeAgAw9wEAAN4CADD4AQAA3gIAMPkBAADgAgAw-gEAAOECADAIBwAAwAIAIJoBAQAAAAGbAQEAAAABnAEBAAAAAZ0BAQAAAAGfAQgAAAABoAECAAAAAaEBQAAAAAECAAAAGAAgGwAA5QIAIAMAAAAYACAbAADlAgAgHAAA5AIAIAEUAACLBAAwDgcAAKUCACALAACmAgAglwEAAKMCADCYAQAAFgAQmQEAAKMCADCaAQEAAAABmwEBAPsBACGcAQEA-wEAIZ0BAQD7AQAhngEBAPwBACGfAQgApAIAIaABAgCMAgAhoQFAAJECACHuAQAAogIAIAIAAAAYACAUAADkAgAgAgAAAOICACAUAADjAgAgC5cBAADhAgAwmAEAAOICABCZAQAA4QIAMJoBAQD7AQAhmwEBAPsBACGcAQEA-wEAIZ0BAQD7AQAhngEBAPwBACGfAQgApAIAIaABAgCMAgAhoQFAAJECACELlwEAAOECADCYAQAA4gIAEJkBAADhAgAwmgEBAPsBACGbAQEA-wEAIZwBAQD7AQAhnQEBAPsBACGeAQEA_AEAIZ8BCACkAgAhoAECAIwCACGhAUAAkQIAIQeaAQEAuQIAIZsBAQC5AgAhnAEBALkCACGdAQEAuQIAIZ8BCAC6AgAhoAECALsCACGhAUAAvAIAIQgHAAC-AgAgmgEBALkCACGbAQEAuQIAIZwBAQC5AgAhnQEBALkCACGfAQgAugIAIaABAgC7AgAhoQFAALwCACEIBwAAwAIAIJoBAQAAAAGbAQEAAAABnAEBAAAAAZ0BAQAAAAGfAQgAAAABoAECAAAAAaEBQAAAAAEDCQAA0gIAIK0BAQAAAAGyASAAAAABAgAAABMAIBsAAPECACADAAAAEwAgGwAA8QIAIBwAAPACACABFAAAigQAMAkJAACpAgAgCwAAqgIAIJcBAACoAgAwmAEAABEAEJkBAACoAgAwngEBAPsBACGtAQEA-wEAIbIBIACPAgAh7wEAAKcCACACAAAAEwAgFAAA8AIAIAIAAADuAgAgFAAA7wIAIAaXAQAA7QIAMJgBAADuAgAQmQEAAO0CADCeAQEA-wEAIa0BAQD7AQAhsgEgAI8CACEGlwEAAO0CADCYAQAA7gIAEJkBAADtAgAwngEBAPsBACGtAQEA-wEAIbIBIACPAgAhAq0BAQC5AgAhsgEgAM8CACEDCQAA0AIAIK0BAQC5AgAhsgEgAM8CACEDCQAA0gIAIK0BAQAAAAGyASAAAAABAfUBAQAAAAQEGwAA5gIAMPIBAADnAgAw9AEAAOkCACD4AQAA6gIAMAQbAADaAgAw8gEAANsCADD0AQAA3QIAIPgBAADeAgAwAAAAAAAAAAH1AQAAAMIBAgX1AQIAAAAB_AECAAAAAf0BAgAAAAH-AQIAAAAB_wECAAAAAQL1AQEAAAAE-wEBAAAABQH1AQAAANABAgsbAACOAwAwHAAAkgMAMPIBAACPAwAw8wEAAJADADD0AQAAkQMAIPUBAADqAgAw9gEAAOoCADD3AQAA6gIAMPgBAADqAgAw-QEAAJMDADD6AQAA7QIAMAsbAACCAwAwHAAAhwMAMPIBAACDAwAw8wEAAIQDADD0AQAAhQMAIPUBAACGAwAw9gEAAIYDADD3AQAAhgMAMPgBAACGAwAw-QEAAIgDADD6AQAAiQMAMAcHAADKAgAgmgEBAAAAAZsBAQAAAAGuAQEAAAABrwEBAAAAAbABCAAAAAGxAUAAAAABAgAAAA8AIBsAAI0DACADAAAADwAgGwAAjQMAIBwAAIwDACABFAAAiQQAMAwHAAClAgAgCQAAqQIAIJcBAACrAgAwmAEAAA0AEJkBAACrAgAwmgEBAAAAAZsBAQD7AQAhrQEBAPsBACGuAQEA-wEAIa8BAQD8AQAhsAEIAKwCACGxAUAAkQIAIQIAAAAPACAUAACMAwAgAgAAAIoDACAUAACLAwAgCpcBAACJAwAwmAEAAIoDABCZAQAAiQMAMJoBAQD7AQAhmwEBAPsBACGtAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAhCpcBAACJAwAwmAEAAIoDABCZAQAAiQMAMJoBAQD7AQAhmwEBAPsBACGtAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAhBpoBAQC5AgAhmwEBALkCACGuAQEAuQIAIa8BAQC9AgAhsAEIAMcCACGxAUAAvAIAIQcHAADIAgAgmgEBALkCACGbAQEAuQIAIa4BAQC5AgAhrwEBAL0CACGwAQgAxwIAIbEBQAC8AgAhBwcAAMoCACCaAQEAAAABmwEBAAAAAa4BAQAAAAGvAQEAAAABsAEIAAAAAbEBQAAAAAEDCwAA0wIAIJ4BAQAAAAGyASAAAAABAgAAABMAIBsAAJYDACADAAAAEwAgGwAAlgMAIBwAAJUDACABFAAAiAQAMAIAAAATACAUAACVAwAgAgAAAO4CACAUAACUAwAgAp4BAQC5AgAhsgEgAM8CACEDCwAA0QIAIJ4BAQC5AgAhsgEgAM8CACEDCwAA0wIAIJ4BAQAAAAGyASAAAAABAfUBAQAAAAQEGwAAjgMAMPIBAACPAwAw9AEAAJEDACD4AQAA6gIAMAQbAACCAwAw8gEAAIMDADD0AQAAhQMAIPgBAACGAwAwAAAAAAAAAfUBAAAA3wECAfUBAAAA4QECAfUBQAAAAAEFGwAAgAQAIBwAAIYEACDyAQAAgQQAIPMBAACFBAAg-AEAAAsAIAUbAAD-AwAgHAAAgwQAIPIBAAD_AwAg8wEAAIIEACD4AQAAAQAgAxsAAIAEACDyAQAAgQQAIPgBAAALACADGwAA_gMAIPIBAAD_AwAg-AEAAAEAIAAAAAAACxsAAK4DADAcAACzAwAw8gEAAK8DADDzAQAAsAMAMPQBAACxAwAg9QEAALIDADD2AQAAsgMAMPcBAACyAwAw-AEAALIDADD5AQAAtAMAMPoBAAC1AwAwBRsAAPgDACAcAAD8AwAg8gEAAPkDACDzAQAA-wMAIPgBAAABACANBwAApgMAIJoBAQAAAAGbAQEAAAABrgEBAAAAAa8BAQAAAAGwAQgAAAABsQFAAAAAAdYBQAAAAAHfAQAAAN8BAuEBAAAA4QEC4wEBAAAAAeQBAQAAAAHlAUAAAAABAgAAAAUAIBsAALkDACADAAAABQAgGwAAuQMAIBwAALgDACABFAAA-gMAMBIGAACyAgAgBwAApQIAIJcBAACuAgAwmAEAAAMAEJkBAACuAgAwmgEBAAAAAZsBAQD7AQAhrgEBAPsBACGvAQEA_AEAIbABCACsAgAhsQFAAJECACHWAUAAkQIAId8BAACvAt8BIuEBAACwAuEBIuIBAQD7AQAh4wEBAPwBACHkAQEA_AEAIeUBQACxAgAhAgAAAAUAIBQAALgDACACAAAAtgMAIBQAALcDACAQlwEAALUDADCYAQAAtgMAEJkBAAC1AwAwmgEBAPsBACGbAQEA-wEAIa4BAQD7AQAhrwEBAPwBACGwAQgArAIAIbEBQACRAgAh1gFAAJECACHfAQAArwLfASLhAQAAsALhASLiAQEA-wEAIeMBAQD8AQAh5AEBAPwBACHlAUAAsQIAIRCXAQAAtQMAMJgBAAC2AwAQmQEAALUDADCaAQEA-wEAIZsBAQD7AQAhrgEBAPsBACGvAQEA_AEAIbABCACsAgAhsQFAAJECACHWAUAAkQIAId8BAACvAt8BIuEBAACwAuEBIuIBAQD7AQAh4wEBAPwBACHkAQEA_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_AEAIcYBAQD8AQAhxwEBAPwBACHMAQEA-wEAIc0BAQD8AQAh0AEAAI4C0AEi0QEAAI4C0AEi1gFAAJECACHmAQEA-wEAIecBAQD8AQAh6AECAI0CACHpAQIAjQIAIeoBAgCNAgAhAgAAAAsAIBQAAN8DACACAAAA3QMAIBQAAN4DACASlwEAANwDADCYAQAA3QMAEJkBAADcAwAwmgEBAPsBACHCAQEA-wEAIcMBAQD8AQAhxgEBAPwBACHHAQEA_AEAIcwBAQD7AQAhzQEBAPwBACHQAQAAjgLQASLRAQAAjgLQASLWAUAAkQIAIeYBAQD7AQAh5wEBAPwBACHoAQIAjQIAIekBAgCNAgAh6gECAI0CACESlwEAANwDADCYAQAA3QMAEJkBAADcAwAwmgEBAPsBACHCAQEA-wEAIcMBAQD8AQAhxgEBAPwBACHHAQEA_AEAIcwBAQD7AQAhzQEBAPwBACHQAQAAjgLQASLRAQAAjgLQASLWAUAAkQIAIeYBAQD7AQAh5wEBAPwBACHoAQIAjQIAIekBAgCNAgAh6gECAI0CACEOmgEBALkCACHCAQEAuQIAIcMBAQC9AgAhxgEBAL0CACHHAQEAvQIAIcwBAQC5AgAhzQEBAL0CACHQAQAA_wLQASLRAQAA_wLQASLWAUAAvAIAIecBAQC9AgAh6AECAP0CACHpAQIA_QIAIeoBAgD9AgAhDwMAAKwDACCaAQEAuQIAIcIBAQC5AgAhwwEBAL0CACHGAQEAvQIAIccBAQC9AgAhzAEBALkCACHNAQEAvQIAIdABAAD_AtABItEBAAD_AtABItYBQAC8AgAh5wEBAL0CACHoAQIA_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_AwAgDAAAwgMAIA4AAMEDACCaAQEAuQIAIbQBAQC5AgAh1gFAALwCACHXAUAAvAIAIesBAQC5AgAh7AEBALkCACHtAQEAvQIAIQoIAADrAwAgDAAA7QMAIA4AAOwDACCaAQEAAAABtAEBAAAAAdYBQAAAAAHXAUAAAAAB6wEBAAAAAewBAQAAAAHtAQEAAAABAgAAAAEAIBsAAP4DACAQBAAAuwMAIJoBAQAAAAHCAQEAAAABwwEBAAAAAcYBAQAAAAHHAQEAAAABzAEBAAAAAc0BAQAAAAHQAQAAANABAtEBAAAA0AEC1gFAAAAAAeYBAQAAAAHnAQEAAAAB6AECAAAAAekBAgAAAAHqAQIAAAABAgAAAAsAIBsAAIAEACADAAAAJwAgGwAA_gMAIBwAAIQEACAMAAAAJwAgCAAAwAMAIAwAAMIDACAOAADBAwAgFAAAhAQAIJoBAQC5AgAhtAEBALkCACHWAUAAvAIAIdcBQAC8AgAh6wEBALkCACHsAQEAuQIAIe0BAQC9AgAhCggAAMADACAMAADCAwAgDgAAwQMAIJoBAQC5AgAhtAEBALkCACHWAUAAvAIAIdcBQAC8AgAh6wEBALkCACHsAQEAuQIAIe0BAQC9AgAhAwAAAAkAIBsAAIAEACAcAACHBAAgEgAAAAkAIAQAAK0DACAUAACHBAAgmgEBALkCACHCAQEAuQIAIcMBAQC9AgAhxgEBAL0CACHHAQEAvQIAIcwBAQC5AgAhzQEBAL0CACHQAQAA_wLQASLRAQAA_wLQASLWAUAAvAIAIeYBAQC5AgAh5wEBAL0CACHoAQIA_QIAIekBAgD9AgAh6gECAP0CACEQBAAArQMAIJoBAQC5AgAhwgEBALkCACHDAQEAvQIAIcYBAQC9AgAhxwEBAL0CACHMAQEAuQIAIc0BAQC9AgAh0AEAAP8C0AEi0QEAAP8C0AEi1gFAALwCACHmAQEAuQIAIecBAQC9AgAh6AECAP0CACHpAQIA_QIAIeoBAgD9AgAhAp4BAQAAAAGyASAAAAABBpoBAQAAAAGbAQEAAAABrgEBAAAAAa8BAQAAAAGwAQgAAAABsQFAAAAAAQKtAQEAAAABsgEgAAAAAQeaAQEAAAABmwEBAAAAAZwBAQAAAAGdAQEAAAABnwEIAAAAAaABAgAAAAGhAUAAAAABCQwAAPQCACCaAQEAAAABswEBAAAAAbQBAQAAAAG1AQEAAAABtgEBAAAAAbcBAADyAgAguAEBAAAAAbkBAQAAAAECAAAAggEAIBsAAIwEACAZDgAAmQMAIJoBAQAAAAGzAQAAAMIBArYBAQAAAAHCAQEAAAABwwEBAAAAAcQBAQAAAAHFAQIAAAABxgEBAAAAAccBAQAAAAHIAQIAAAAByQECAAAAAcoBAACXAwAgywEBAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAdABAAAA0AEC0QEAAADQAQLSAQEAAAAB0wECAAAAAdQBIAAAAAHVAYAAAAAB1gFAAAAAAdcBQAAAAAECAAAAaQAgGwAAjgQAIAMAAAAaACAbAACMBAAgHAAAkgQAIAsAAAAaACAMAADZAgAgFAAAkgQAIJoBAQC5AgAhswEBALkCACG0AQEAuQIAIbUBAQC9AgAhtgEBAL0CACG3AQAA1wIAILgBAQC5AgAhuQEBALkCACEJDAAA2QIAIJoBAQC5AgAhswEBALkCACG0AQEAuQIAIbUBAQC9AgAhtgEBAL0CACG3AQAA1wIAILgBAQC5AgAhuQEBALkCACEDAAAAbAAgGwAAjgQAIBwAAJUEACAbAAAAbAAgDgAAgQMAIBQAAJUEACCaAQEAuQIAIbMBAAD8AsIBIrYBAQC9AgAhwgEBALkCACHDAQEAvQIAIcQBAQC9AgAhxQECALsCACHGAQEAuQIAIccBAQC5AgAhyAECAP0CACHJAQIA_QIAIcoBAAD-AgAgywEBALkCACHMAQEAuQIAIc0BAQC9AgAhzgEBAL0CACHQAQAA_wLQASLRAQAA_wLQASLSAQEAvQIAIdMBAgC7AgAh1AEgAM8CACHVAYAAAAAB1gFAALwCACHXAUAAvAIAIRkOAACBAwAgmgEBALkCACGzAQAA_ALCASK2AQEAvQIAIcIBAQC5AgAhwwEBAL0CACHEAQEAvQIAIcUBAgC7AgAhxgEBALkCACHHAQEAuQIAIcgBAgD9AgAhyQECAP0CACHKAQAA_gIAIMsBAQC5AgAhzAEBALkCACHNAQEAvQIAIc4BAQC9AgAh0AEAAP8C0AEi0QEAAP8C0AEi0gEBAL0CACHTAQIAuwIAIdQBIADPAgAh1QGAAAAAAdYBQAC8AgAh1wFAALwCACEZDQAAmAMAIJoBAQAAAAGzAQAAAMIBArYBAQAAAAHCAQEAAAABwwEBAAAAAcQBAQAAAAHFAQIAAAABxgEBAAAAAccBAQAAAAHIAQIAAAAByQECAAAAAcoBAACXAwAgywEBAAAAAcwBAQAAAAHNAQEAAAABzgEBAAAAAdABAAAA0AEC0QEAAADQAQLSAQEAAAAB0wECAAAAAdQBIAAAAAHVAYAAAAAB1gFAAAAAAdcBQAAAAAECAAAAaQAgGwAAlgQAIAoDAADqAwAgCAAA6wMAIAwAAO0DACCaAQEAAAABtAEBAAAAAdYBQAAAAAHXAUAAAAAB6wEBAAAAAewBAQAAAAHtAQEAAAABAgAAAAEAIBsAAJgEACADAAAAbAAgGwAAlgQAIBwAAJwEACAbAAAAbAAgDQAAgAMAIBQAAJwEACCaAQEAuQIAIbMBAAD8AsIBIrYBAQC9AgAhwgEBALkCACHDAQEAvQIAIcQBAQC9AgAhxQECALsCACHGAQEAuQIAIccBAQC5AgAhyAECAP0CACHJAQIA_QIAIcoBAAD-AgAgywEBALkCACHMAQEAuQIAIc0BAQC9AgAhzgEBAL0CACHQAQAA_wLQASLRAQAA_wLQASLSAQEAvQIAIdMBAgC7AgAh1AEgAM8CACHVAYAAAAAB1gFAALwCACHXAUAAvAIAIRkNAACAAwAgmgEBALkCACGzAQAA_ALCASK2AQEAvQIAIcIBAQC5AgAhwwEBAL0CACHEAQEAvQIAIcUBAgC7AgAhxgEBALkCACHHAQEAuQIAIcgBAgD9AgAhyQECAP0CACHKAQAA_gIAIMsBAQC5AgAhzAEBALkCACHNAQEAvQIAIc4BAQC9AgAh0AEAAP8C0AEi0QEAAP8C0AEi0gEBAL0CACHTAQIAuwIAIdQBIADPAgAh1QGAAAAAAdYBQAC8AgAh1wFAALwCACEDAAAAJwAgGwAAmAQAIBwAAJ8EACAMAAAAJwAgAwAAvwMAIAgAAMADACAMAADCAwAgFAAAnwQAIJoBAQC5AgAhtAEBALkCACHWAUAAvAIAIdcBQAC8AgAh6wEBALkCACHsAQEAuQIAIe0BAQC9AgAhCgMAAL8DACAIAADAAwAgDAAAwgMAIJoBAQC5AgAhtAEBALkCACHWAUAAvAIAIdcBQAC8AgAh6wEBALkCACHsAQEAuQIAIe0BAQC9AgAhCQoAAPMCACCaAQEAAAABswEBAAAAAbQBAQAAAAG1AQEAAAABtgEBAAAAAbcBAADyAgAguAEBAAAAAbkBAQAAAAECAAAAggEAIBsAAKAEACAKAwAA6gMAIAgAAOsDACAOAADsAwAgmgEBAAAAAbQBAQAAAAHWAUAAAAAB1wFAAAAAAesBAQAAAAHsAQEAAAAB7QEBAAAAAQIAAAABACAbAACiBAAgAwAAABoAIBsAAKAEACAcAACmBAAgCwAAABoAIAoAANgCACAUAACmBAAgmgEBALkCACGzAQEAuQIAIbQBAQC5AgAhtQEBAL0CACG2AQEAvQIAIbcBAADXAgAguAEBALkCACG5AQEAuQIAIQkKAADYAgAgmgEBALkCACGzAQEAuQIAIbQBAQC5AgAhtQEBAL0CACG2AQEAvQIAIbcBAADXAgAguAEBALkCACG5AQEAuQIAIQMAAAAnACAbAACiBAAgHAAAqQQAIAwAAAAnACADAAC_AwAgCAAAwAMAIA4AAMEDACAUAACpBAAgmgEBALkCACG0AQEAuQIAIdYBQAC8AgAh1wFAALwCACHrAQEAuQIAIewBAQC5AgAh7QEBAL0CACEKAwAAvwMAIAgAAMADACAOAADBAwAgmgEBALkCACG0AQEAuQIAIdYBQAC8AgAh1wFAALwCACHrAQEAuQIAIewBAQC5AgAh7QEBAL0CACEFAwYCBQAMCAwDDCEJDhAFAgYAAwcAAQMDBwIEAAEFAAQBAwgAAgcAAQkABgMFAAsNFAcOHgUCCQAGCwAIAwUACgoVBwwZCQIHAAELGwgCChwADB0AAg0fAA4gAAQDIgAIIwAMJQAOJAAAAAADBQARIQASIgATAAAAAwUAESEAEiIAEwEEAAEBBAABBQUAGCEAGyIAHDMAGTQAGgAAAAAABQUAGCEAGyIAHDMAGTQAGgIGAAMHAAECBgADBwABBQUAISEAJCIAJTMAIjQAIwAAAAAABQUAISEAJCIAJTMAIjQAIwAABQUAKiEALSIALjMAKzQALAAAAAAABQUAKiEALSIALjMAKzQALAAAAwUAMyEANCIANQAAAAMFADMhADQiADUCCQAGCwAIAgkABgsACAMFADohADsiADwAAAADBQA6IQA7IgA8AgcAAQkABgIHAAEJAAYFBQBBIQBEIgBFMwBCNABDAAAAAAAFBQBBIQBEIgBFMwBCNABDAgcAAQvQAQgCBwABC9YBCAUFAEohAE0iAE4zAEs0AEwAAAAAAAUFAEohAE0iAE4zAEs0AEwPAgEQJgERKQESKgETKwEVLQEWLw0XMA4YMgEZNA0aNQ8dNgEeNwEfOA0jOxAkPBQlPQMmPgMnPwMoQAMpQQMqQwMrRQ0sRhUtSAMuSg0vSxYwTAMxTQMyTg01URc2Uh03UwI4VAI5VQI6VgI7VwI8WQI9Ww0-XB4_XgJAYA1BYR9CYgJDYwJEZA1FZyBGaCZHagZIawZJbgZKbwZLcAZMcgZNdA1OdSdPdwZQeQ1ReihSewZTfAZUfQ1VgAEpVoEBL1eDAQhYhAEIWYYBCFqHAQhbiAEIXIoBCF2MAQ1ejQEwX48BCGCRAQ1hkgExYpMBCGOUAQhklQENZZgBMmaZATZnmgEHaJsBB2mcAQdqnQEHa54BB2ygAQdtogENbqMBN2-lAQdwpwENcagBOHKpAQdzqgEHdKsBDXWuATl2rwE9d7ABBXixAQV5sgEFerMBBXu0AQV8tgEFfbgBDX65AT5_uwEFgAG9AQ2BAb4BP4IBvwEFgwHAAQWEAcEBDYUBxAFAhgHFAUaHAcYBCYgBxwEJiQHIAQmKAckBCYsBygEJjAHMAQmNAc4BDY4BzwFHjwHSAQmQAdQBDZEB1QFIkgHXAQmTAdgBCZQB2QENlQHcAUmWAd0BTw"
};
config.compilerWasm = {
    getRuntime: async ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/query_compiler_fast_bg.js [app-rsc] (ecmascript)"),
    getQueryCompilerWasmModule: async ()=>{
        const { Buffer } = __turbopack_context__.r("[externals]/node:buffer [external] (node:buffer, cjs)");
        const { wasm } = __turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/query_compiler_fast_bg.wasm-base64.js [app-rsc] (ecmascript)");
        const queryCompilerWasmFileBytes = Buffer.from(wasm, 'base64');
        return new WebAssembly.Module(queryCompilerWasmFileBytes);
    },
    importName: './query_compiler_fast_bg.js'
};
const PrismaClient = getPrismaClient(config);
exports.PrismaClient = PrismaClient;
Object.assign(exports, Prisma);
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/client.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

/* !!! This is code generated by Prisma. Do not edit directly. !!!
/* eslint-disable */ // biome-ignore-all lint: generated file
module.exports = {
    ...__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/generated/prisma/index.js [app-rsc] (ecmascript)")
};
}),
];

//# sourceMappingURL=OneDrive_Desktop_shiftB_music-app_music-app_app_generated_prisma_fb3c3c8d._.js.map