module.exports = [
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/lib/metadata/get-metadata-route.js [app-rsc] (ecmascript, Next.js server utility)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/lib/metadata/get-metadata-route.js [app-rsc] (ecmascript)"));}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-kind.js [app-rsc] (ecmascript, Next.js server utility)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-kind.js [app-rsc] (ecmascript)"));}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/instrumentation/utils.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRevalidateReason",
    ()=>getRevalidateReason
]);
function getRevalidateReason(params) {
    if (params.isOnDemandRevalidate) {
        return 'on-demand';
    }
    if (params.isStaticGeneration) {
        return 'stale';
    }
    return undefined;
} //# sourceMappingURL=utils.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/interop-default.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Interop between "export default" and "module.exports".
 */ __turbopack_context__.s([
    "interopDefault",
    ()=>interopDefault
]);
function interopDefault(mod) {
    return mod.default || mod;
} //# sourceMappingURL=interop-default.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/strip-flight-headers.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "stripFlightHeaders",
    ()=>stripFlightHeaders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/client/components/app-router-headers.js [app-rsc] (ecmascript)");
;
function stripFlightHeaders(headers) {
    for (const header of __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FLIGHT_HEADERS"]){
        delete headers[header];
    }
} //# sourceMappingURL=strip-flight-headers.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/web/spec-extension/adapters/headers.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeadersAdapter",
    ()=>HeadersAdapter,
    "ReadonlyHeadersError",
    ()=>ReadonlyHeadersError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/web/spec-extension/adapters/reflect.js [app-rsc] (ecmascript)");
;
class ReadonlyHeadersError extends Error {
    constructor(){
        super('Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers');
    }
    static callable() {
        throw new ReadonlyHeadersError();
    }
}
class HeadersAdapter extends Headers {
    constructor(headers){
        // We've already overridden the methods that would be called, so we're just
        // calling the super constructor to ensure that the instanceof check works.
        super();
        this.headers = new Proxy(headers, {
            get (target, prop, receiver) {
                // Because this is just an object, we expect that all "get" operations
                // are for properties. If it's a "get" for a symbol, we'll just return
                // the symbol.
                if (typeof prop === 'symbol') {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].get(target, prop, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return undefined.
                if (typeof original === 'undefined') return;
                // If the original casing exists, return the value.
                return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].get(target, original, receiver);
            },
            set (target, prop, value, receiver) {
                if (typeof prop === 'symbol') {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].set(target, prop, value, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, use the prop as the key.
                return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].set(target, original ?? prop, value, receiver);
            },
            has (target, prop) {
                if (typeof prop === 'symbol') return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].has(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return false.
                if (typeof original === 'undefined') return false;
                // If the original casing exists, return true.
                return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].has(target, original);
            },
            deleteProperty (target, prop) {
                if (typeof prop === 'symbol') return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].deleteProperty(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return true.
                if (typeof original === 'undefined') return true;
                // If the original casing exists, delete the property.
                return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].deleteProperty(target, original);
            }
        });
    }
    /**
   * Seals a Headers instance to prevent modification by throwing an error when
   * any mutating method is called.
   */ static seal(headers) {
        return new Proxy(headers, {
            get (target, prop, receiver) {
                switch(prop){
                    case 'append':
                    case 'delete':
                    case 'set':
                        return ReadonlyHeadersError.callable;
                    default:
                        return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$reflect$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReflectAdapter"].get(target, prop, receiver);
                }
            }
        });
    }
    /**
   * Merges a header value into a string. This stores multiple values as an
   * array, so we need to merge them into a string.
   *
   * @param value a header value
   * @returns a merged header value (a string)
   */ merge(value) {
        if (Array.isArray(value)) return value.join(', ');
        return value;
    }
    /**
   * Creates a Headers instance from a plain object or a Headers instance.
   *
   * @param headers a plain object or a Headers instance
   * @returns a headers instance
   */ static from(headers) {
        if (headers instanceof Headers) return headers;
        return new HeadersAdapter(headers);
    }
    append(name, value) {
        const existing = this.headers[name];
        if (typeof existing === 'string') {
            this.headers[name] = [
                existing,
                value
            ];
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            this.headers[name] = value;
        }
    }
    delete(name) {
        delete this.headers[name];
    }
    get(name) {
        const value = this.headers[name];
        if (typeof value !== 'undefined') return this.merge(value);
        return null;
    }
    has(name) {
        return typeof this.headers[name] !== 'undefined';
    }
    set(name, value) {
        this.headers[name] = value;
    }
    forEach(callbackfn, thisArg) {
        for (const [name, value] of this.entries()){
            callbackfn.call(thisArg, value, name, this);
        }
    }
    *entries() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(name);
            yield [
                name,
                value
            ];
        }
    }
    *keys() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            yield name;
        }
    }
    *values() {
        for (const key of Object.keys(this.headers)){
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(key);
            yield value;
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
} //# sourceMappingURL=headers.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/api-utils/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApiError",
    ()=>ApiError,
    "COOKIE_NAME_PRERENDER_BYPASS",
    ()=>COOKIE_NAME_PRERENDER_BYPASS,
    "COOKIE_NAME_PRERENDER_DATA",
    ()=>COOKIE_NAME_PRERENDER_DATA,
    "RESPONSE_LIMIT_DEFAULT",
    ()=>RESPONSE_LIMIT_DEFAULT,
    "SYMBOL_CLEARED_COOKIES",
    ()=>SYMBOL_CLEARED_COOKIES,
    "SYMBOL_PREVIEW_DATA",
    ()=>SYMBOL_PREVIEW_DATA,
    "checkIsOnDemandRevalidate",
    ()=>checkIsOnDemandRevalidate,
    "clearPreviewData",
    ()=>clearPreviewData,
    "redirect",
    ()=>redirect,
    "sendError",
    ()=>sendError,
    "sendStatusCode",
    ()=>sendStatusCode,
    "setLazyProp",
    ()=>setLazyProp,
    "wrapApiHandler",
    ()=>wrapApiHandler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/web/spec-extension/adapters/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/constants.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$tracer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/trace/tracer.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/trace/constants.js [app-rsc] (ecmascript)");
;
;
;
;
function wrapApiHandler(page, handler) {
    return (...args)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$tracer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTracer"])().setRootSpanAttribute('next.route', page);
        // Call API route method
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$tracer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTracer"])().trace(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NodeSpan"].runHandler, {
            spanName: `executing api route (pages) ${page}`
        }, ()=>handler(...args));
    };
}
function sendStatusCode(res, statusCode) {
    res.statusCode = statusCode;
    return res;
}
function redirect(res, statusOrUrl, url) {
    if (typeof statusOrUrl === 'string') {
        url = statusOrUrl;
        statusOrUrl = 307;
    }
    if (typeof statusOrUrl !== 'number' || typeof url !== 'string') {
        throw Object.defineProperty(new Error(`Invalid redirect arguments. Please use a single argument URL, e.g. res.redirect('/destination') or use a status code and URL, e.g. res.redirect(307, '/destination').`), "__NEXT_ERROR_CODE", {
            value: "E389",
            enumerable: false,
            configurable: true
        });
    }
    res.writeHead(statusOrUrl, {
        Location: url
    });
    res.write(url);
    res.end();
    return res;
}
function checkIsOnDemandRevalidate(req, previewProps) {
    const headers = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$adapters$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HeadersAdapter"].from(req.headers);
    const previewModeId = headers.get(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PRERENDER_REVALIDATE_HEADER"]);
    const isOnDemandRevalidate = previewModeId === previewProps.previewModeId;
    const revalidateOnlyGenerated = headers.has(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER"]);
    return {
        isOnDemandRevalidate,
        revalidateOnlyGenerated
    };
}
const COOKIE_NAME_PRERENDER_BYPASS = `__prerender_bypass`;
const COOKIE_NAME_PRERENDER_DATA = `__next_preview_data`;
const RESPONSE_LIMIT_DEFAULT = 4 * 1024 * 1024;
const SYMBOL_PREVIEW_DATA = Symbol(COOKIE_NAME_PRERENDER_DATA);
const SYMBOL_CLEARED_COOKIES = Symbol(COOKIE_NAME_PRERENDER_BYPASS);
function clearPreviewData(res, options = {}) {
    if (SYMBOL_CLEARED_COOKIES in res) {
        return res;
    }
    const { serialize } = __turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/cookie/index.js [app-rsc] (ecmascript)");
    const previous = res.getHeader('Set-Cookie');
    res.setHeader(`Set-Cookie`, [
        ...typeof previous === 'string' ? [
            previous
        ] : Array.isArray(previous) ? previous : [],
        serialize(COOKIE_NAME_PRERENDER_BYPASS, '', {
            // To delete a cookie, set `expires` to a date in the past:
            // https://tools.ietf.org/html/rfc6265#section-4.1.1
            // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
            expires: new Date(0),
            httpOnly: true,
            sameSite: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'lax',
            secure: ("TURBOPACK compile-time value", "development") !== 'development',
            path: '/',
            ...options.path !== undefined ? {
                path: options.path
            } : undefined
        }),
        serialize(COOKIE_NAME_PRERENDER_DATA, '', {
            // To delete a cookie, set `expires` to a date in the past:
            // https://tools.ietf.org/html/rfc6265#section-4.1.1
            // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
            expires: new Date(0),
            httpOnly: true,
            sameSite: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'lax',
            secure: ("TURBOPACK compile-time value", "development") !== 'development',
            path: '/',
            ...options.path !== undefined ? {
                path: options.path
            } : undefined
        })
    ]);
    Object.defineProperty(res, SYMBOL_CLEARED_COOKIES, {
        value: true,
        enumerable: false
    });
    return res;
}
class ApiError extends Error {
    constructor(statusCode, message){
        super(message);
        this.statusCode = statusCode;
    }
}
function sendError(res, statusCode, message) {
    res.statusCode = statusCode;
    res.statusMessage = message;
    res.end(message);
}
function setLazyProp({ req }, prop, getter) {
    const opts = {
        configurable: true,
        enumerable: true
    };
    const optsReset = {
        ...opts,
        writable: true
    };
    Object.defineProperty(req, prop, {
        ...opts,
        get: ()=>{
            const value = getter();
            // we set the property on the object to avoid recalculating it
            Object.defineProperty(req, prop, {
                ...optsReset,
                value
            });
            return value;
        },
        set: (value)=>{
            Object.defineProperty(req, prop, {
                ...optsReset,
                value
            });
        }
    });
} //# sourceMappingURL=index.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/api-utils/get-cookie-parser.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Parse cookies from the `headers` of request
 * @param req request object
 */ __turbopack_context__.s([
    "getCookieParser",
    ()=>getCookieParser
]);
function getCookieParser(headers) {
    return function parseCookie() {
        const { cookie } = headers;
        if (!cookie) {
            return {};
        }
        const { parse: parseCookieFn } = __turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/cookie/index.js [app-rsc] (ecmascript)");
        return parseCookieFn(Array.isArray(cookie) ? cookie.join('; ') : cookie);
    };
} //# sourceMappingURL=get-cookie-parser.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/base-http/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseNextRequest",
    ()=>BaseNextRequest,
    "BaseNextResponse",
    ()=>BaseNextResponse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$redirect$2d$status$2d$code$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/client/components/redirect-status-code.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$api$2d$utils$2f$get$2d$cookie$2d$parser$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/api-utils/get-cookie-parser.js [app-rsc] (ecmascript)");
;
;
class BaseNextRequest {
    constructor(method, url, body){
        this.method = method;
        this.url = url;
        this.body = body;
    }
    // Utils implemented using the abstract methods above
    get cookies() {
        if (this._cookies) return this._cookies;
        return this._cookies = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$api$2d$utils$2f$get$2d$cookie$2d$parser$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCookieParser"])(this.headers)();
    }
}
class BaseNextResponse {
    constructor(destination){
        this.destination = destination;
    }
    // Utils implemented using the abstract methods above
    redirect(destination, statusCode) {
        this.setHeader('Location', destination);
        this.statusCode = statusCode;
        // Since IE11 doesn't support the 308 header add backwards
        // compatibility using refresh header
        if (statusCode === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$redirect$2d$status$2d$code$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RedirectStatusCode"].PermanentRedirect) {
            this.setHeader('Refresh', `0;url=${destination}`);
        }
        return this;
    }
} //# sourceMappingURL=index.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/base-http/node.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NodeNextRequest",
    ()=>NodeNextRequest,
    "NodeNextResponse",
    ()=>NodeNextResponse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$api$2d$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/api-utils/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/request-meta.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$base$2d$http$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/base-http/index.js [app-rsc] (ecmascript)");
;
;
;
let prop;
class NodeNextRequest extends __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$base$2d$http$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BaseNextRequest"] {
    static #_ = prop = _NEXT_REQUEST_META = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_REQUEST_META"];
    constructor(_req){
        var _this__req;
        super(_req.method.toUpperCase(), _req.url, _req), this._req = _req, this.headers = this._req.headers, this.fetchMetrics = (_this__req = this._req) == null ? void 0 : _this__req.fetchMetrics, this[_NEXT_REQUEST_META] = this._req[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_REQUEST_META"]] || {}, this.streaming = false;
    }
    get originalRequest() {
        // Need to mimic these changes to the original req object for places where we use it:
        // render.tsx, api/ssg requests
        this._req[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_REQUEST_META"]] = this[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_REQUEST_META"]];
        this._req.url = this.url;
        this._req.cookies = this.cookies;
        return this._req;
    }
    set originalRequest(value) {
        this._req = value;
    }
    /**
   * Returns the request body as a Web Readable Stream. The body here can only
   * be read once as the body will start flowing as soon as the data handler
   * is attached.
   *
   * @internal
   */ stream() {
        if (this.streaming) {
            throw Object.defineProperty(new Error('Invariant: NodeNextRequest.stream() can only be called once'), "__NEXT_ERROR_CODE", {
                value: "E467",
                enumerable: false,
                configurable: true
            });
        }
        this.streaming = true;
        return new ReadableStream({
            start: (controller)=>{
                this._req.on('data', (chunk)=>{
                    controller.enqueue(new Uint8Array(chunk));
                });
                this._req.on('end', ()=>{
                    controller.close();
                });
                this._req.on('error', (err)=>{
                    controller.error(err);
                });
            }
        });
    }
}
class NodeNextResponse extends __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$base$2d$http$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BaseNextResponse"] {
    get originalResponse() {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$api$2d$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SYMBOL_CLEARED_COOKIES"] in this) {
            this._res[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$api$2d$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SYMBOL_CLEARED_COOKIES"]] = this[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$api$2d$utils$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SYMBOL_CLEARED_COOKIES"]];
        }
        return this._res;
    }
    constructor(_res){
        super(_res), this._res = _res, this.textBody = undefined;
    }
    get sent() {
        return this._res.finished || this._res.headersSent;
    }
    get statusCode() {
        return this._res.statusCode;
    }
    set statusCode(value) {
        this._res.statusCode = value;
    }
    get statusMessage() {
        return this._res.statusMessage;
    }
    set statusMessage(value) {
        this._res.statusMessage = value;
    }
    setHeader(name, value) {
        this._res.setHeader(name, value);
        return this;
    }
    removeHeader(name) {
        this._res.removeHeader(name);
        return this;
    }
    getHeaderValues(name) {
        const values = this._res.getHeader(name);
        if (values === undefined) return undefined;
        return (Array.isArray(values) ? values : [
            values
        ]).map((value)=>value.toString());
    }
    hasHeader(name) {
        return this._res.hasHeader(name);
    }
    getHeader(name) {
        const values = this.getHeaderValues(name);
        return Array.isArray(values) ? values.join(',') : undefined;
    }
    getHeaders() {
        return this._res.getHeaders();
    }
    appendHeader(name, value) {
        const currentValues = this.getHeaderValues(name) ?? [];
        if (!currentValues.includes(value)) {
            this._res.setHeader(name, [
                ...currentValues,
                value
            ]);
        }
        return this;
    }
    body(value) {
        this.textBody = value;
        return this;
    }
    send() {
        this._res.end(this.textBody);
    }
    onClose(callback) {
        this.originalResponse.on('close', callback);
    }
}
var _NEXT_REQUEST_META; //# sourceMappingURL=node.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/experimental/ppr.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * If set to `incremental`, only those leaf pages that export
 * `experimental_ppr = true` will have partial prerendering enabled. If any
 * page exports this value as `false` or does not export it at all will not
 * have partial prerendering enabled. If set to a boolean, the options for
 * `experimental_ppr` will be ignored.
 */ /**
 * Returns true if partial prerendering is enabled for the application. It does
 * not tell you if a given route has PPR enabled, as that requires analysis of
 * the route's configuration.
 *
 * @see {@link checkIsRoutePPREnabled} - for checking if a specific route has PPR enabled.
 */ __turbopack_context__.s([
    "checkIsAppPPREnabled",
    ()=>checkIsAppPPREnabled,
    "checkIsRoutePPREnabled",
    ()=>checkIsRoutePPREnabled
]);
function checkIsAppPPREnabled(config) {
    // If the config is undefined, partial prerendering is disabled.
    if (typeof config === 'undefined') return false;
    // If the config is a boolean, use it directly.
    if (typeof config === 'boolean') return config;
    // If the config is a string, it must be 'incremental' to enable partial
    // prerendering.
    if (config === 'incremental') return true;
    return false;
}
function checkIsRoutePPREnabled(config) {
    // If the config is undefined, partial prerendering is disabled.
    if (typeof config === 'undefined') return false;
    // If the config is a boolean, use it directly.
    if (typeof config === 'boolean') return config;
    return false;
} //# sourceMappingURL=ppr.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-modules/checks.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isAppPageRouteModule",
    ()=>isAppPageRouteModule,
    "isAppRouteRouteModule",
    ()=>isAppRouteRouteModule,
    "isPagesAPIRouteModule",
    ()=>isPagesAPIRouteModule,
    "isPagesRouteModule",
    ()=>isPagesRouteModule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-kind.js [app-rsc] (ecmascript)");
;
function isAppRouteRouteModule(routeModule) {
    return routeModule.definition.kind === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RouteKind"].APP_ROUTE;
}
function isAppPageRouteModule(routeModule) {
    return routeModule.definition.kind === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RouteKind"].APP_PAGE;
}
function isPagesRouteModule(routeModule) {
    return routeModule.definition.kind === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RouteKind"].PAGES;
}
function isPagesAPIRouteModule(routeModule) {
    return routeModule.definition.kind === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RouteKind"].PAGES_API;
} //# sourceMappingURL=checks.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/page-path/ensure-leading-slash.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * For a given page path, this function ensures that there is a leading slash.
 * If there is not a leading slash, one is added, otherwise it is noop.
 */ __turbopack_context__.s([
    "ensureLeadingSlash",
    ()=>ensureLeadingSlash
]);
function ensureLeadingSlash(path) {
    return path.startsWith('/') ? path : `/${path}`;
} //# sourceMappingURL=ensure-leading-slash.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizeAppPath",
    ()=>normalizeAppPath,
    "normalizeRscURL",
    ()=>normalizeRscURL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$page$2d$path$2f$ensure$2d$leading$2d$slash$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/page-path/ensure-leading-slash.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$segment$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/segment.js [app-rsc] (ecmascript)");
;
;
function normalizeAppPath(route) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$page$2d$path$2f$ensure$2d$leading$2d$slash$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureLeadingSlash"])(route.split('/').reduce((pathname, segment, index, segments)=>{
        // Empty segments are ignored.
        if (!segment) {
            return pathname;
        }
        // Groups are ignored.
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$segment$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isGroupSegment"])(segment)) {
            return pathname;
        }
        // Parallel segments are ignored.
        if (segment[0] === '@') {
            return pathname;
        }
        // The last segment (if it's a leaf) should be ignored.
        if ((segment === 'page' || segment === 'route') && index === segments.length - 1) {
            return pathname;
        }
        return `${pathname}/${segment}`;
    }, ''));
}
function normalizeRscURL(url) {
    return url.replace(/\.rsc($|\?)/, '$1');
} //# sourceMappingURL=app-paths.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/interception-routes.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INTERCEPTION_ROUTE_MARKERS",
    ()=>INTERCEPTION_ROUTE_MARKERS,
    "extractInterceptionRouteInformation",
    ()=>extractInterceptionRouteInformation,
    "isInterceptionRouteAppPath",
    ()=>isInterceptionRouteAppPath
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js [app-rsc] (ecmascript)");
;
const INTERCEPTION_ROUTE_MARKERS = [
    '(..)(..)',
    '(.)',
    '(..)',
    '(...)'
];
function isInterceptionRouteAppPath(path) {
    // TODO-APP: add more serious validation
    return path.split('/').find((segment)=>INTERCEPTION_ROUTE_MARKERS.find((m)=>segment.startsWith(m))) !== undefined;
}
function extractInterceptionRouteInformation(path) {
    let interceptingRoute;
    let marker;
    let interceptedRoute;
    for (const segment of path.split('/')){
        marker = INTERCEPTION_ROUTE_MARKERS.find((m)=>segment.startsWith(m));
        if (marker) {
            ;
            [interceptingRoute, interceptedRoute] = path.split(marker, 2);
            break;
        }
    }
    if (!interceptingRoute || !marker || !interceptedRoute) {
        throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Must be in the format /<intercepting route>/(..|...|..)(..)/<intercepted route>`), "__NEXT_ERROR_CODE", {
            value: "E269",
            enumerable: false,
            configurable: true
        });
    }
    interceptingRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeAppPath"])(interceptingRoute) // normalize the path, e.g. /(blog)/feed -> /feed
    ;
    switch(marker){
        case '(.)':
            // (.) indicates that we should match with sibling routes, so we just need to append the intercepted route to the intercepting route
            if (interceptingRoute === '/') {
                interceptedRoute = `/${interceptedRoute}`;
            } else {
                interceptedRoute = interceptingRoute + '/' + interceptedRoute;
            }
            break;
        case '(..)':
            // (..) indicates that we should match at one level up, so we need to remove the last segment of the intercepting route
            if (interceptingRoute === '/') {
                throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Cannot use (..) marker at the root level, use (.) instead.`), "__NEXT_ERROR_CODE", {
                    value: "E207",
                    enumerable: false,
                    configurable: true
                });
            }
            interceptedRoute = interceptingRoute.split('/').slice(0, -1).concat(interceptedRoute).join('/');
            break;
        case '(...)':
            // (...) will match the route segment in the root directory, so we need to use the root directory to prepend the intercepted route
            interceptedRoute = '/' + interceptedRoute;
            break;
        case '(..)(..)':
            // (..)(..) indicates that we should match at two levels up, so we need to remove the last two segments of the intercepting route
            const splitInterceptingRoute = interceptingRoute.split('/');
            if (splitInterceptingRoute.length <= 2) {
                throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Cannot use (..)(..) marker at the root level or one level up.`), "__NEXT_ERROR_CODE", {
                    value: "E486",
                    enumerable: false,
                    configurable: true
                });
            }
            interceptedRoute = splitInterceptingRoute.slice(0, -2).concat(interceptedRoute).join('/');
            break;
        default:
            throw Object.defineProperty(new Error('Invariant: unexpected marker'), "__NEXT_ERROR_CODE", {
                value: "E112",
                enumerable: false,
                configurable: true
            });
    }
    return {
        interceptingRoute,
        interceptedRoute
    };
} //# sourceMappingURL=interception-routes.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/get-segment-param.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getParamProperties",
    ()=>getParamProperties,
    "getSegmentParam",
    ()=>getSegmentParam,
    "isCatchAll",
    ()=>isCatchAll
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$routes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/interception-routes.js [app-rsc] (ecmascript)");
;
function getSegmentParam(segment) {
    const interceptionMarker = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$routes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["INTERCEPTION_ROUTE_MARKERS"].find((marker)=>segment.startsWith(marker));
    // if an interception marker is part of the path segment, we need to jump ahead
    // to the relevant portion for param parsing
    if (interceptionMarker) {
        segment = segment.slice(interceptionMarker.length);
    }
    if (segment.startsWith('[[...') && segment.endsWith(']]')) {
        return {
            // TODO-APP: Optional catchall does not currently work with parallel routes,
            // so for now aren't handling a potential interception marker.
            paramType: 'optional-catchall',
            paramName: segment.slice(5, -2)
        };
    }
    if (segment.startsWith('[...') && segment.endsWith(']')) {
        return {
            paramType: interceptionMarker ? `catchall-intercepted-${interceptionMarker}` : 'catchall',
            paramName: segment.slice(4, -1)
        };
    }
    if (segment.startsWith('[') && segment.endsWith(']')) {
        return {
            paramType: interceptionMarker ? `dynamic-intercepted-${interceptionMarker}` : 'dynamic',
            paramName: segment.slice(1, -1)
        };
    }
    return null;
}
function isCatchAll(type) {
    return type === 'catchall' || type === 'catchall-intercepted-(..)(..)' || type === 'catchall-intercepted-(.)' || type === 'catchall-intercepted-(..)' || type === 'catchall-intercepted-(...)' || type === 'optional-catchall';
}
function getParamProperties(paramType) {
    let repeat = false;
    let optional = false;
    switch(paramType){
        case 'catchall':
        case 'catchall-intercepted-(..)(..)':
        case 'catchall-intercepted-(.)':
        case 'catchall-intercepted-(..)':
        case 'catchall-intercepted-(...)':
            repeat = true;
            break;
        case 'optional-catchall':
            repeat = true;
            optional = true;
            break;
        case 'dynamic':
        case 'dynamic-intercepted-(..)(..)':
        case 'dynamic-intercepted-(.)':
        case 'dynamic-intercepted-(..)':
        case 'dynamic-intercepted-(...)':
            break;
        default:
            paramType;
    }
    return {
        repeat,
        optional
    };
} //# sourceMappingURL=get-segment-param.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/routes/app.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isInterceptionAppRoute",
    ()=>isInterceptionAppRoute,
    "isNormalizedAppRoute",
    ()=>isNormalizedAppRoute,
    "parseAppRoute",
    ()=>parseAppRoute,
    "parseAppRouteSegment",
    ()=>parseAppRouteSegment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$get$2d$segment$2d$param$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/get-segment-param.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$routes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/interception-routes.js [app-rsc] (ecmascript)");
;
;
;
function parseAppRouteSegment(segment) {
    if (segment === '') {
        return null;
    }
    // Check if the segment starts with an interception marker
    const interceptionMarker = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$routes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["INTERCEPTION_ROUTE_MARKERS"].find((m)=>segment.startsWith(m));
    const param = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$get$2d$segment$2d$param$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSegmentParam"])(segment);
    if (param) {
        return {
            type: 'dynamic',
            name: segment,
            param,
            interceptionMarker
        };
    } else if (segment.startsWith('(') && segment.endsWith(')')) {
        return {
            type: 'route-group',
            name: segment,
            interceptionMarker
        };
    } else if (segment.startsWith('@')) {
        return {
            type: 'parallel-route',
            name: segment,
            interceptionMarker
        };
    } else {
        return {
            type: 'static',
            name: segment,
            interceptionMarker
        };
    }
}
function isNormalizedAppRoute(route) {
    return route.normalized;
}
function isInterceptionAppRoute(route) {
    return route.interceptionMarker !== undefined && route.interceptingRoute !== undefined && route.interceptedRoute !== undefined;
}
function parseAppRoute(pathname, normalized) {
    const pathnameSegments = pathname.split('/').filter(Boolean);
    // Build segments array with static and dynamic segments
    const segments = [];
    // Parse if this is an interception route.
    let interceptionMarker;
    let interceptingRoute;
    let interceptedRoute;
    for (const segment of pathnameSegments){
        // Parse the segment into an AppSegment.
        const appSegment = parseAppRouteSegment(segment);
        if (!appSegment) {
            continue;
        }
        if (normalized && (appSegment.type === 'route-group' || appSegment.type === 'parallel-route')) {
            throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"](`${pathname} is being parsed as a normalized route, but it has a route group or parallel route segment.`), "__NEXT_ERROR_CODE", {
                value: "E923",
                enumerable: false,
                configurable: true
            });
        }
        segments.push(appSegment);
        if (appSegment.interceptionMarker) {
            const parts = pathname.split(appSegment.interceptionMarker);
            if (parts.length !== 2) {
                throw Object.defineProperty(new Error(`Invalid interception route: ${pathname}`), "__NEXT_ERROR_CODE", {
                    value: "E924",
                    enumerable: false,
                    configurable: true
                });
            }
            interceptingRoute = normalized ? parseAppRoute(parts[0], true) : parseAppRoute(parts[0], false);
            interceptedRoute = normalized ? parseAppRoute(parts[1], true) : parseAppRoute(parts[1], false);
            interceptionMarker = appSegment.interceptionMarker;
        }
    }
    const dynamicSegments = segments.filter((segment)=>segment.type === 'dynamic');
    return {
        normalized,
        pathname,
        segments,
        dynamicSegments,
        interceptionMarker,
        interceptingRoute,
        interceptedRoute
    };
} //# sourceMappingURL=app.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/parse-loader-tree.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseLoaderTree",
    ()=>parseLoaderTree
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$segment$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/segment.js [app-rsc] (ecmascript)");
;
function parseLoaderTree(tree) {
    const [segment, parallelRoutes, modules] = tree;
    const { layout, template } = modules;
    let { page } = modules;
    // a __DEFAULT__ segment means that this route didn't match any of the
    // segments in the route, so we should use the default page
    page = segment === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$segment$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_SEGMENT_KEY"] ? modules.defaultPage : page;
    const conventionPath = layout?.[1] || template?.[1] || page?.[1];
    return {
        page,
        segment,
        modules,
        /* it can be either layout / template / page */ conventionPath,
        parallelRoutes
    };
} //# sourceMappingURL=parse-loader-tree.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/interception-prefix-from-param-type.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "interceptionPrefixFromParamType",
    ()=>interceptionPrefixFromParamType
]);
function interceptionPrefixFromParamType(paramType) {
    switch(paramType){
        case 'catchall-intercepted-(..)(..)':
        case 'dynamic-intercepted-(..)(..)':
            return '(..)(..)';
        case 'catchall-intercepted-(.)':
        case 'dynamic-intercepted-(.)':
            return '(.)';
        case 'catchall-intercepted-(..)':
        case 'dynamic-intercepted-(..)':
            return '(..)';
        case 'catchall-intercepted-(...)':
        case 'dynamic-intercepted-(...)':
            return '(...)';
        case 'catchall':
        case 'dynamic':
        case 'optional-catchall':
        default:
            return null;
    }
} //# sourceMappingURL=interception-prefix-from-param-type.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/resolve-param-value.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveParamValue",
    ()=>resolveParamValue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$prefix$2d$from$2d$param$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/interception-prefix-from-param-type.js [app-rsc] (ecmascript)");
;
;
/**
 * Extracts the param value from a path segment, handling interception markers
 * based on the expected param type.
 *
 * @param pathSegment - The path segment to extract the value from
 * @param params - The current params object for resolving dynamic param references
 * @param paramType - The expected param type which may include interception marker info
 * @returns The extracted param value
 */ function getParamValueFromSegment(pathSegment, params, paramType) {
    // If the segment is dynamic, resolve it from the params object
    if (pathSegment.type === 'dynamic') {
        return params[pathSegment.param.paramName];
    }
    // If the paramType indicates this is an intercepted param, strip the marker
    // that matches the interception marker in the param type
    const interceptionPrefix = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$prefix$2d$from$2d$param$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["interceptionPrefixFromParamType"])(paramType);
    if (interceptionPrefix === pathSegment.interceptionMarker) {
        return pathSegment.name.replace(pathSegment.interceptionMarker, '');
    }
    // For static segments, use the name
    return pathSegment.name;
}
function resolveParamValue(paramName, paramType, depth, route, params) {
    switch(paramType){
        case 'catchall':
        case 'optional-catchall':
        case 'catchall-intercepted-(..)(..)':
        case 'catchall-intercepted-(.)':
        case 'catchall-intercepted-(..)':
        case 'catchall-intercepted-(...)':
            // For catchall routes, derive from pathname using depth to determine
            // which segments to use
            const processedSegments = [];
            // Process segments to handle any embedded dynamic params
            for(let index = depth; index < route.segments.length; index++){
                const pathSegment = route.segments[index];
                if (pathSegment.type === 'static') {
                    let value = pathSegment.name;
                    // For intercepted catch-all params, strip the marker from the first segment
                    const interceptionPrefix = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$prefix$2d$from$2d$param$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["interceptionPrefixFromParamType"])(paramType);
                    if (interceptionPrefix && index === depth && interceptionPrefix === pathSegment.interceptionMarker) {
                        // Strip the interception marker from the value
                        value = value.replace(pathSegment.interceptionMarker, '');
                    }
                    processedSegments.push(value);
                } else {
                    // If the segment is a param placeholder, check if we have its value
                    if (!params.hasOwnProperty(pathSegment.param.paramName)) {
                        // If the segment is an optional catchall, we can break out of the
                        // loop because it's optional!
                        if (pathSegment.param.paramType === 'optional-catchall') {
                            break;
                        }
                        // Unknown param placeholder in pathname - can't derive full value
                        return undefined;
                    }
                    // If the segment matches a param, use the param value
                    // We don't encode values here as that's handled during retrieval.
                    const paramValue = params[pathSegment.param.paramName];
                    if (Array.isArray(paramValue)) {
                        processedSegments.push(...paramValue);
                    } else {
                        processedSegments.push(paramValue);
                    }
                }
            }
            if (processedSegments.length > 0) {
                return processedSegments;
            } else if (paramType === 'optional-catchall') {
                return undefined;
            } else {
                // We shouldn't be able to match a catchall segment without any path
                // segments if it's not an optional catchall
                throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"](`Unexpected empty path segments match for a route "${route.pathname}" with param "${paramName}" of type "${paramType}"`), "__NEXT_ERROR_CODE", {
                    value: "E931",
                    enumerable: false,
                    configurable: true
                });
            }
        case 'dynamic':
        case 'dynamic-intercepted-(..)(..)':
        case 'dynamic-intercepted-(.)':
        case 'dynamic-intercepted-(..)':
        case 'dynamic-intercepted-(...)':
            // For regular dynamic parameters, take the segment at this depth
            if (depth < route.segments.length) {
                const pathSegment = route.segments[depth];
                // Check if the segment at this depth is a placeholder for an unknown param
                if (pathSegment.type === 'dynamic' && !params.hasOwnProperty(pathSegment.param.paramName)) {
                    // The segment is a placeholder like [category] and we don't have the value
                    return undefined;
                }
                // If the segment matches a param, use the param value from params object
                // Otherwise it's a static segment, just use it directly
                // We don't encode values here as that's handled during retrieval
                return getParamValueFromSegment(pathSegment, params, paramType);
            }
            return undefined;
        default:
            paramType;
    }
} //# sourceMappingURL=resolve-param-value.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/static-paths/app/extract-pathname-route-param-segments-from-loader-tree.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractPathnameRouteParamSegmentsFromLoaderTree",
    ()=>extractPathnameRouteParamSegmentsFromLoaderTree
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$routes$2f$app$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/routes/app.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$parse$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/parse-loader-tree.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$resolve$2d$param$2d$value$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/resolve-param-value.js [app-rsc] (ecmascript)");
;
;
;
/**
 * Validates that the static segments in currentPath match the corresponding
 * segments in targetSegments. This ensures we only extract dynamic parameters
 * that are part of the target pathname structure.
 *
 * Segments are compared literally - interception markers like "(.)photo" are
 * part of the pathname and must match exactly.
 *
 * @example
 * // Matching paths
 * currentPath: ['blog', '(.)photo']
 * targetSegments: ['blog', '(.)photo', '[id]']
 * → Returns true (both static segments match exactly)
 *
 * @example
 * // Non-matching paths
 * currentPath: ['blog', '(.)photo']
 * targetSegments: ['blog', 'photo', '[id]']
 * → Returns false (segments don't match - marker is part of pathname)
 *
 * @param currentPath - The accumulated path segments from the loader tree
 * @param targetSegments - The target pathname split into segments
 * @returns true if all static segments match, false otherwise
 */ function validatePrefixMatch(currentPath, route) {
    for(let i = 0; i < currentPath.length; i++){
        const pathSegment = currentPath[i];
        const targetPathSegment = route.segments[i];
        // Type mismatch - one is static, one is dynamic
        if (pathSegment.type !== targetPathSegment.type) {
            return false;
        }
        // One has an interception marker, the other doesn't.
        if (pathSegment.interceptionMarker !== targetPathSegment.interceptionMarker) {
            return false;
        }
        // Both are static but names don't match
        if (pathSegment.type === 'static' && targetPathSegment.type === 'static' && pathSegment.name !== targetPathSegment.name) {
            return false;
        } else if (pathSegment.type === 'dynamic' && targetPathSegment.type === 'dynamic' && pathSegment.param.paramType !== targetPathSegment.param.paramType && pathSegment.param.paramName !== targetPathSegment.param.paramName) {
            return false;
        }
    }
    return true;
}
function extractPathnameRouteParamSegmentsFromLoaderTree(loaderTree, route) {
    const pathnameRouteParamSegments = [];
    const params = {};
    // BFS traversal with depth and path tracking
    const queue = [
        {
            tree: loaderTree,
            depth: 0,
            currentPath: []
        }
    ];
    while(queue.length > 0){
        const { tree, depth, currentPath } = queue.shift();
        const { segment, parallelRoutes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$parse$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseLoaderTree"])(tree);
        // Build the path for the current node
        let updatedPath = currentPath;
        let nextDepth = depth;
        const appSegment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$routes$2f$app$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAppRouteSegment"])(segment);
        // Only add to path if it's a real segment that appears in the URL
        // Route groups and parallel markers don't contribute to URL pathname
        if (appSegment && appSegment.type !== 'route-group' && appSegment.type !== 'parallel-route') {
            updatedPath = [
                ...currentPath,
                appSegment
            ];
            nextDepth = depth + 1;
        }
        // Check if this segment has a param and matches the target pathname at this depth
        if ((appSegment == null ? void 0 : appSegment.type) === 'dynamic') {
            const { paramName, paramType } = appSegment.param;
            // Check if this segment is at the correct depth in the target pathname
            // A segment matches if:
            // 1. There's a dynamic segment at this depth in the pathname
            // 2. The parameter names match (e.g., [id] matches [id], not [category])
            // 3. The static segments leading up to this point match (prefix check)
            if (depth < route.segments.length) {
                const targetSegment = route.segments[depth];
                // Match if the target pathname has a dynamic segment at this depth
                if (targetSegment.type === 'dynamic') {
                    // Check that parameter names match exactly
                    // This prevents [category] from matching against /[id]
                    if (paramName !== targetSegment.param.paramName) {
                        continue; // Different param names, skip this segment
                    }
                    // Validate that the path leading up to this dynamic segment matches
                    // the target pathname. This prevents false matches like extracting
                    // [slug] from "/news/[slug]" when the tree has "/blog/[slug]"
                    if (validatePrefixMatch(currentPath, route)) {
                        pathnameRouteParamSegments.push({
                            name: segment,
                            paramName,
                            paramType
                        });
                    }
                }
            }
            // Resolve parameter value if it's not already known.
            if (!params.hasOwnProperty(paramName)) {
                const paramValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$resolve$2d$param$2d$value$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveParamValue"])(paramName, paramType, depth, route, params);
                if (paramValue !== undefined) {
                    params[paramName] = paramValue;
                }
            }
        }
        // Continue traversing all parallel routes to find matching segments
        for (const parallelRoute of Object.values(parallelRoutes)){
            queue.push({
                tree: parallelRoute,
                depth: nextDepth,
                currentPath: updatedPath
            });
        }
    }
    return {
        pathnameRouteParamSegments,
        params
    };
} //# sourceMappingURL=extract-pathname-route-param-segments-from-loader-tree.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/static-paths/utils.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "encodeParam",
    ()=>encodeParam,
    "extractPathnameRouteParamSegments",
    ()=>extractPathnameRouteParamSegments,
    "extractPathnameRouteParamSegmentsFromSegments",
    ()=>extractPathnameRouteParamSegmentsFromSegments,
    "normalizePathname",
    ()=>normalizePathname,
    "resolveRouteParamsFromTree",
    ()=>resolveRouteParamsFromTree
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$checks$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-modules/checks.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$routes$2f$app$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/routes/app.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$parse$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/parse-loader-tree.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$static$2d$paths$2f$app$2f$extract$2d$pathname$2d$route$2d$param$2d$segments$2d$from$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/static-paths/app/extract-pathname-route-param-segments-from-loader-tree.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$resolve$2d$param$2d$value$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/resolve-param-value.js [app-rsc] (ecmascript)");
;
;
;
;
;
function encodeParam(value, encoder) {
    let replaceValue;
    if (Array.isArray(value)) {
        replaceValue = value.map(encoder).join('/');
    } else {
        replaceValue = encoder(value);
    }
    return replaceValue;
}
function normalizePathname(pathname) {
    return pathname.replace(/\\/g, '/').replace(/(?!^)\/$/, '');
}
function extractPathnameRouteParamSegments(routeModule, segments, route) {
    // For AppPageRouteModule, use the loaderTree traversal approach
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$checks$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAppPageRouteModule"])(routeModule)) {
        const { pathnameRouteParamSegments } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$static$2d$paths$2f$app$2f$extract$2d$pathname$2d$route$2d$param$2d$segments$2d$from$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["extractPathnameRouteParamSegmentsFromLoaderTree"])(routeModule.userland.loaderTree, route);
        return pathnameRouteParamSegments;
    }
    return extractPathnameRouteParamSegmentsFromSegments(segments);
}
function extractPathnameRouteParamSegmentsFromSegments(segments) {
    // TODO: should we consider what values are already present in the page?
    // For AppRouteRouteModule, filter the segments array to get the route params
    // that contribute to the pathname.
    const result = [];
    for (const segment of segments){
        // Skip segments without param info.
        if (!segment.paramName || !segment.paramType) continue;
        // Collect all the route param keys that contribute to the pathname.
        result.push({
            name: segment.name,
            paramName: segment.paramName,
            paramType: segment.paramType
        });
    }
    return result;
}
function resolveRouteParamsFromTree(loaderTree, params, route, fallbackRouteParams) {
    // Stack-based traversal with depth tracking
    const stack = [
        {
            tree: loaderTree,
            depth: 0
        }
    ];
    while(stack.length > 0){
        const { tree, depth } = stack.pop();
        const { segment, parallelRoutes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$parse$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseLoaderTree"])(tree);
        const appSegment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$routes$2f$app$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAppRouteSegment"])(segment);
        // If this segment is a route parameter, then we should process it if it's
        // not already known and is not already marked as a fallback route param.
        if ((appSegment == null ? void 0 : appSegment.type) === 'dynamic' && !params.hasOwnProperty(appSegment.param.paramName) && !fallbackRouteParams.some((param)=>param.paramName === appSegment.param.paramName)) {
            const { paramName, paramType } = appSegment.param;
            const paramValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$resolve$2d$param$2d$value$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveParamValue"])(paramName, paramType, depth, route, params);
            if (paramValue !== undefined) {
                params[paramName] = paramValue;
            } else if (paramType !== 'optional-catchall') {
                // If we couldn't resolve the param, mark it as a fallback
                fallbackRouteParams.push({
                    paramName,
                    paramType
                });
            }
        }
        // Calculate next depth - increment if this is not a route group and not empty
        let nextDepth = depth;
        if (appSegment && appSegment.type !== 'route-group' && appSegment.type !== 'parallel-route') {
            nextDepth++;
        }
        // Add all parallel routes to the stack for processing.
        for (const parallelRoute of Object.values(parallelRoutes)){
            stack.push({
                tree: parallelRoute,
                depth: nextDepth
            });
        }
    }
} //# sourceMappingURL=utils.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/get-short-dynamic-param-type.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dynamicParamTypes",
    ()=>dynamicParamTypes
]);
const dynamicParamTypes = {
    catchall: 'c',
    'catchall-intercepted-(..)(..)': 'ci(..)(..)',
    'catchall-intercepted-(.)': 'ci(.)',
    'catchall-intercepted-(..)': 'ci(..)',
    'catchall-intercepted-(...)': 'ci(...)',
    'optional-catchall': 'oc',
    dynamic: 'd',
    'dynamic-intercepted-(..)(..)': 'di(..)(..)',
    'dynamic-intercepted-(.)': 'di(.)',
    'dynamic-intercepted-(..)': 'di(..)',
    'dynamic-intercepted-(...)': 'di(...)'
}; //# sourceMappingURL=get-short-dynamic-param-type.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/request/fallback-params.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createOpaqueFallbackRouteParams",
    ()=>createOpaqueFallbackRouteParams,
    "getFallbackRouteParams",
    ()=>getFallbackRouteParams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$static$2d$paths$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/static-paths/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$get$2d$short$2d$dynamic$2d$param$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/get-short-dynamic-param-type.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$routes$2f$app$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/routes/app.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$static$2d$paths$2f$app$2f$extract$2d$pathname$2d$route$2d$param$2d$segments$2d$from$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/static-paths/app/extract-pathname-route-param-segments-from-loader-tree.js [app-rsc] (ecmascript)");
;
;
;
;
function createOpaqueFallbackRouteParams(fallbackRouteParams) {
    // If there are no fallback route params, we can return early.
    if (fallbackRouteParams.length === 0) return null;
    // As we're creating unique keys for each of the dynamic route params, we only
    // need to generate a unique ID once per request because each of the keys will
    // be also be unique.
    const uniqueID = Math.random().toString(16).slice(2);
    const keys = new Map();
    // Generate a unique key for the fallback route param, if this key is found
    // in the static output, it represents a bug in cache components.
    for (const { paramName, paramType } of fallbackRouteParams){
        keys.set(paramName, [
            `%%drp:${paramName}:${uniqueID}%%`,
            __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$get$2d$short$2d$dynamic$2d$param$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["dynamicParamTypes"][paramType]
        ]);
    }
    return keys;
}
function getFallbackRouteParams(page, routeModule) {
    const route = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$routes$2f$app$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAppRoute"])(page, true);
    // Extract the pathname-contributing segments from the loader tree. This
    // mirrors the logic in buildAppStaticPaths where we determine which segments
    // actually contribute to the pathname.
    const { pathnameRouteParamSegments, params } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$static$2d$paths$2f$app$2f$extract$2d$pathname$2d$route$2d$param$2d$segments$2d$from$2d$loader$2d$tree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["extractPathnameRouteParamSegmentsFromLoaderTree"])(routeModule.userland.loaderTree, route);
    // Create fallback route params for the pathname segments.
    const fallbackRouteParams = pathnameRouteParamSegments.map(({ paramName, paramType })=>({
            paramName,
            paramType
        }));
    // Resolve route params from the loader tree. This mutates the
    // fallbackRouteParams array to add any route params that are
    // unknown at request time.
    //
    // The page parameter contains placeholders like [slug], which helps
    // resolveRouteParamsFromTree determine which params are unknown.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$static$2d$paths$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveRouteParamsFromTree"])(routeModule.userland.loaderTree, params, route, fallbackRouteParams // Will be mutated to add route params
    );
    // Convert the fallback route params to an opaque format that can be safely
    // used in the postponed state without exposing implementation details.
    return createOpaqueFallbackRouteParams(fallbackRouteParams);
} //# sourceMappingURL=fallback-params.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/manifests-singleton.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getClientReferenceManifest",
    ()=>getClientReferenceManifest,
    "getServerActionsManifest",
    ()=>getServerActionsManifest,
    "getServerModuleMap",
    ()=>getServerModuleMap,
    "selectWorkerForForwarding",
    ()=>selectWorkerForForwarding,
    "setManifestsSingleton",
    ()=>setManifestsSingleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$path$2d$has$2d$prefix$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/path-has-prefix.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$remove$2d$path$2d$prefix$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/remove-path-prefix.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
;
;
;
;
;
// This is a global singleton that is, among other things, also used to
// encode/decode bound args of server function closures. This can't be using a
// AsyncLocalStorage as it might happen at the module level.
const MANIFESTS_SINGLETON = Symbol.for('next.server.manifests');
const globalThisWithManifests = globalThis;
function createProxiedClientReferenceManifest(clientReferenceManifestsPerRoute) {
    const createMappingProxy = (prop)=>{
        return new Proxy({}, {
            get (_, id) {
                const workStore = __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js$2c$__cjs$29$__["workAsyncStorage"].getStore();
                if (workStore) {
                    const currentManifest = clientReferenceManifestsPerRoute.get(workStore.route);
                    if (currentManifest == null ? void 0 : currentManifest[prop][id]) {
                        return currentManifest[prop][id];
                    }
                    // In development, we also check all other manifests to see if the
                    // module exists there. This is to support a scenario where React's
                    // I/O tracking (dev-only) creates a connection from one page to
                    // another through an emitted async I/O node that references client
                    // components from the other page, e.g. in owner props.
                    // TODO: Maybe we need to add a `debugBundlerConfig` option to React
                    // to avoid this workaround. The current workaround has the
                    // disadvantage that one might accidentally or intentionally share
                    // client references across pages (e.g. by storing them in a global
                    // variable), which would then only be caught in production.
                    if ("TURBOPACK compile-time truthy", 1) {
                        for (const [route, manifest] of clientReferenceManifestsPerRoute){
                            if (route === workStore.route) {
                                continue;
                            }
                            const entry = manifest[prop][id];
                            if (entry !== undefined) {
                                return entry;
                            }
                        }
                    }
                } else {
                    // If there's no work store defined, we can assume that a client
                    // reference manifest is needed during module evaluation, e.g. to
                    // create a server function using a higher-order function. This
                    // might also use client components which need to be serialized by
                    // Flight, and therefore client references need to be resolvable. In
                    // that case we search all page manifests to find the module.
                    for (const manifest of clientReferenceManifestsPerRoute.values()){
                        const entry = manifest[prop][id];
                        if (entry !== undefined) {
                            return entry;
                        }
                    }
                }
                return undefined;
            }
        });
    };
    const mappingProxies = new Map();
    return new Proxy({}, {
        get (_, prop) {
            const workStore = __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js$2c$__cjs$29$__["workAsyncStorage"].getStore();
            switch(prop){
                case 'moduleLoading':
                case 'entryCSSFiles':
                case 'entryJSFiles':
                    {
                        if (!workStore) {
                            throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"](`Cannot access "${prop}" without a work store.`), "__NEXT_ERROR_CODE", {
                                value: "E952",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        const currentManifest = clientReferenceManifestsPerRoute.get(workStore.route);
                        if (!currentManifest) {
                            throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"](`The client reference manifest for route "${workStore.route}" does not exist.`), "__NEXT_ERROR_CODE", {
                                value: "E951",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        return currentManifest[prop];
                    }
                case 'clientModules':
                case 'rscModuleMapping':
                case 'edgeRscModuleMapping':
                case 'ssrModuleMapping':
                case 'edgeSSRModuleMapping':
                    {
                        let proxy = mappingProxies.get(prop);
                        if (!proxy) {
                            proxy = createMappingProxy(prop);
                            mappingProxies.set(prop, proxy);
                        }
                        return proxy;
                    }
                default:
                    {
                        throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"](`This is a proxied client reference manifest. The property "${String(prop)}" is not handled.`), "__NEXT_ERROR_CODE", {
                            value: "E953",
                            enumerable: false,
                            configurable: true
                        });
                    }
            }
        }
    });
}
/**
 * This function creates a Flight-acceptable server module map proxy from our
 * Server Reference Manifest similar to our client module map. This is because
 * our manifest contains a lot of internal Next.js data that are relevant to the
 * runtime, workers, etc. that React doesn't need to know.
 */ function createServerModuleMap() {
    return new Proxy({}, {
        get: (_, id)=>{
            var _getServerActionsManifest__id, _getServerActionsManifest_;
            const workers = (_getServerActionsManifest_ = getServerActionsManifest()[("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'node']) == null ? void 0 : (_getServerActionsManifest__id = _getServerActionsManifest_[id]) == null ? void 0 : _getServerActionsManifest__id.workers;
            if (!workers) {
                return undefined;
            }
            const workStore = __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$server$2f$app$2d$render$2f$work$2d$async$2d$storage$2e$external$2e$js$2c$__cjs$29$__["workAsyncStorage"].getStore();
            let workerEntry;
            if (workStore) {
                workerEntry = workers[normalizeWorkerPageName(workStore.page)];
            } else {
                // If there's no work store defined, we can assume that a server
                // module map is needed during module evaluation, e.g. to create a
                // server action using a higher-order function. Therefore it should be
                // safe to return any entry from the manifest that matches the action
                // ID. They all refer to the same module ID, which must also exist in
                // the current page bundle. TODO: This is currently not guaranteed in
                // Turbopack, and needs to be fixed.
                workerEntry = Object.values(workers).at(0);
            }
            if (!workerEntry) {
                return undefined;
            }
            const { moduleId, async } = workerEntry;
            return {
                id: moduleId,
                name: id,
                chunks: [],
                async
            };
        }
    });
}
/**
 * The flight entry loader keys actions by bundlePath. bundlePath corresponds
 * with the relative path (including 'app') to the page entrypoint.
 */ function normalizeWorkerPageName(pageName) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$path$2d$has$2d$prefix$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pathHasPrefix"])(pageName, 'app')) {
        return pageName;
    }
    return 'app' + pageName;
}
/**
 * Converts a bundlePath (relative path to the entrypoint) to a routable page
 * name.
 */ function denormalizeWorkerPageName(bundlePath) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeAppPath"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$remove$2d$path$2d$prefix$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removePathPrefix"])(bundlePath, 'app'));
}
function selectWorkerForForwarding(actionId, pageName) {
    var _serverActionsManifest__actionId;
    const serverActionsManifest = getServerActionsManifest();
    const workers = (_serverActionsManifest__actionId = serverActionsManifest[("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'node'][actionId]) == null ? void 0 : _serverActionsManifest__actionId.workers;
    // There are no workers to handle this action, nothing to forward to.
    if (!workers) {
        return;
    }
    // If there is an entry for the current page, we don't need to forward.
    if (workers[normalizeWorkerPageName(pageName)]) {
        return;
    }
    // Otherwise, grab the first worker that has a handler for this action id.
    return denormalizeWorkerPageName(Object.keys(workers)[0]);
}
function setManifestsSingleton({ page, clientReferenceManifest, serverActionsManifest }) {
    const existingSingleton = globalThisWithManifests[MANIFESTS_SINGLETON];
    if (existingSingleton) {
        existingSingleton.clientReferenceManifestsPerRoute.set((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeAppPath"])(page), clientReferenceManifest);
        existingSingleton.serverActionsManifest = serverActionsManifest;
    } else {
        const clientReferenceManifestsPerRoute = new Map([
            [
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeAppPath"])(page),
                clientReferenceManifest
            ]
        ]);
        const proxiedClientReferenceManifest = createProxiedClientReferenceManifest(clientReferenceManifestsPerRoute);
        globalThisWithManifests[MANIFESTS_SINGLETON] = {
            clientReferenceManifestsPerRoute,
            proxiedClientReferenceManifest,
            serverActionsManifest,
            serverModuleMap: createServerModuleMap()
        };
    }
}
function getManifestsSingleton() {
    const manifestSingleton = globalThisWithManifests[MANIFESTS_SINGLETON];
    if (!manifestSingleton) {
        throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"]('The manifests singleton was not initialized.'), "__NEXT_ERROR_CODE", {
            value: "E950",
            enumerable: false,
            configurable: true
        });
    }
    return manifestSingleton;
}
function getClientReferenceManifest() {
    return getManifestsSingleton().proxiedClientReferenceManifest;
}
function getServerActionsManifest() {
    return getManifestsSingleton().serverActionsManifest;
}
function getServerModuleMap() {
    return getManifestsSingleton().serverModuleMap;
} //# sourceMappingURL=manifests-singleton.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/html-bots.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This regex contains the bots that we need to do a blocking render for and can't safely stream the response
// due to how they parse the DOM. For example, they might explicitly check for metadata in the `head` tag, so we can't stream metadata tags after the `head` was sent.
// Note: The pattern [\w-]+-Google captures all Google crawlers with "-Google" suffix (e.g., Mediapartners-Google, AdsBot-Google, Storebot-Google)
// as well as crawlers starting with "Google-" (e.g., Google-PageRenderer, Google-InspectionTool)
__turbopack_context__.s([
    "HTML_LIMITED_BOT_UA_RE",
    ()=>HTML_LIMITED_BOT_UA_RE
]);
const HTML_LIMITED_BOT_UA_RE = /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i; //# sourceMappingURL=html-bots.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/is-bot.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HTML_LIMITED_BOT_UA_RE_STRING",
    ()=>HTML_LIMITED_BOT_UA_RE_STRING,
    "getBotType",
    ()=>getBotType,
    "isBot",
    ()=>isBot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$html$2d$bots$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/html-bots.js [app-rsc] (ecmascript)");
;
// Bot crawler that will spin up a headless browser and execute JS.
// Only the main Googlebot search crawler executes JavaScript, not other Google crawlers.
// x-ref: https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
// This regex specifically matches "Googlebot" but NOT "Mediapartners-Google", "AdsBot-Google", etc.
const HEADLESS_BROWSER_BOT_UA_RE = /Googlebot(?!-)|Googlebot$/i;
const HTML_LIMITED_BOT_UA_RE_STRING = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$html$2d$bots$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HTML_LIMITED_BOT_UA_RE"].source;
;
function isDomBotUA(userAgent) {
    return HEADLESS_BROWSER_BOT_UA_RE.test(userAgent);
}
function isHtmlLimitedBotUA(userAgent) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$html$2d$bots$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HTML_LIMITED_BOT_UA_RE"].test(userAgent);
}
function isBot(userAgent) {
    return isDomBotUA(userAgent) || isHtmlLimitedBotUA(userAgent);
}
function getBotType(userAgent) {
    if (isDomBotUA(userAgent)) {
        return 'dom';
    }
    if (isHtmlLimitedBotUA(userAgent)) {
        return 'html';
    }
    return undefined;
} //# sourceMappingURL=is-bot.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/streaming-metadata.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isHtmlBotRequest",
    ()=>isHtmlBotRequest,
    "shouldServeStreamingMetadata",
    ()=>shouldServeStreamingMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$is$2d$bot$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/is-bot.js [app-rsc] (ecmascript) <locals>");
;
function shouldServeStreamingMetadata(userAgent, htmlLimitedBots) {
    const blockingMetadataUARegex = new RegExp(htmlLimitedBots || __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$is$2d$bot$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["HTML_LIMITED_BOT_UA_RE_STRING"], 'i');
    // Only block metadata for HTML-limited bots
    if (userAgent && blockingMetadataUARegex.test(userAgent)) {
        return false;
    }
    return true;
}
function isHtmlBotRequest(req) {
    const ua = req.headers['user-agent'] || '';
    const botType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$is$2d$bot$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getBotType"])(ua);
    return botType === 'html';
} //# sourceMappingURL=streaming-metadata.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/server-action-request-meta.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getIsPossibleServerAction",
    ()=>getIsPossibleServerAction,
    "getServerActionRequestMetadata",
    ()=>getServerActionRequestMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/client/components/app-router-headers.js [app-rsc] (ecmascript)");
;
function getServerActionRequestMetadata(req) {
    let actionId;
    let contentType;
    if (req.headers instanceof Headers) {
        actionId = req.headers.get(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ACTION_HEADER"]) ?? null;
        contentType = req.headers.get('content-type');
    } else {
        actionId = req.headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ACTION_HEADER"]] ?? null;
        contentType = req.headers['content-type'] ?? null;
    }
    // We don't actually support URL encoded actions, and the action handler will bail out if it sees one.
    // But we still want it to flow through to the action handler, to prevent changes in behavior when a regular
    // page component tries to handle a POST.
    const isURLEncodedAction = Boolean(req.method === 'POST' && contentType === 'application/x-www-form-urlencoded');
    const isMultipartAction = Boolean(req.method === 'POST' && (contentType == null ? void 0 : contentType.startsWith('multipart/form-data')));
    const isFetchAction = Boolean(actionId !== undefined && typeof actionId === 'string' && req.method === 'POST');
    const isPossibleServerAction = Boolean(isFetchAction || isURLEncodedAction || isMultipartAction);
    return {
        actionId,
        isURLEncodedAction,
        isMultipartAction,
        isFetchAction,
        isPossibleServerAction
    };
}
function getIsPossibleServerAction(req) {
    return getServerActionRequestMetadata(req).isPossibleServerAction;
} //# sourceMappingURL=server-action-request-meta.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/fallback.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Describes the different fallback modes that a given page can have.
 */ __turbopack_context__.s([
    "FallbackMode",
    ()=>FallbackMode,
    "fallbackModeToFallbackField",
    ()=>fallbackModeToFallbackField,
    "parseFallbackField",
    ()=>parseFallbackField,
    "parseStaticPathsResult",
    ()=>parseStaticPathsResult
]);
var FallbackMode = /*#__PURE__*/ function(FallbackMode) {
    /**
   * A BLOCKING_STATIC_RENDER fallback will block the request until the page is
   * generated. No fallback page will be rendered, and users will have to wait
   * to render the page.
   */ FallbackMode["BLOCKING_STATIC_RENDER"] = "BLOCKING_STATIC_RENDER";
    /**
   * When set to PRERENDER, a fallback page will be sent to users in place of
   * forcing them to wait for the page to be generated. This allows the user to
   * see a rendered page earlier.
   */ FallbackMode["PRERENDER"] = "PRERENDER";
    /**
   * When set to NOT_FOUND, pages that are not already prerendered will result
   * in a not found response.
   */ FallbackMode["NOT_FOUND"] = "NOT_FOUND";
    return FallbackMode;
}({});
function parseFallbackField(fallbackField) {
    if (typeof fallbackField === 'string') {
        return "PRERENDER";
    } else if (fallbackField === null) {
        return "BLOCKING_STATIC_RENDER";
    } else if (fallbackField === false) {
        return "NOT_FOUND";
    } else if (fallbackField === undefined) {
        return undefined;
    } else {
        throw Object.defineProperty(new Error(`Invalid fallback option: ${fallbackField}. Fallback option must be a string, null, undefined, or false.`), "__NEXT_ERROR_CODE", {
            value: "E285",
            enumerable: false,
            configurable: true
        });
    }
}
function fallbackModeToFallbackField(fallback, page) {
    switch(fallback){
        case "BLOCKING_STATIC_RENDER":
            return null;
        case "NOT_FOUND":
            return false;
        case "PRERENDER":
            if (!page) {
                throw Object.defineProperty(new Error(`Invariant: expected a page to be provided when fallback mode is "${fallback}"`), "__NEXT_ERROR_CODE", {
                    value: "E422",
                    enumerable: false,
                    configurable: true
                });
            }
            return page;
        default:
            throw Object.defineProperty(new Error(`Invalid fallback mode: ${fallback}`), "__NEXT_ERROR_CODE", {
                value: "E254",
                enumerable: false,
                configurable: true
            });
    }
}
function parseStaticPathsResult(result) {
    if (result === true) {
        return "PRERENDER";
    } else if (result === 'blocking') {
        return "BLOCKING_STATIC_RENDER";
    } else {
        return "NOT_FOUND";
    }
} //# sourceMappingURL=fallback.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/utils.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Web vitals provided to _app.reportWebVitals by Core Web Vitals plugin developed by Google Chrome team.
 * https://nextjs.org/blog/next-9-4#integrated-web-vitals-reporting
 */ __turbopack_context__.s([
    "DecodeError",
    ()=>DecodeError,
    "MiddlewareNotFoundError",
    ()=>MiddlewareNotFoundError,
    "MissingStaticPage",
    ()=>MissingStaticPage,
    "NormalizeError",
    ()=>NormalizeError,
    "PageNotFoundError",
    ()=>PageNotFoundError,
    "SP",
    ()=>SP,
    "ST",
    ()=>ST,
    "WEB_VITALS",
    ()=>WEB_VITALS,
    "execOnce",
    ()=>execOnce,
    "getDisplayName",
    ()=>getDisplayName,
    "getLocationOrigin",
    ()=>getLocationOrigin,
    "getURL",
    ()=>getURL,
    "isAbsoluteUrl",
    ()=>isAbsoluteUrl,
    "isResSent",
    ()=>isResSent,
    "loadGetInitialProps",
    ()=>loadGetInitialProps,
    "normalizeRepeatedSlashes",
    ()=>normalizeRepeatedSlashes,
    "stringifyError",
    ()=>stringifyError
]);
const WEB_VITALS = [
    'CLS',
    'FCP',
    'FID',
    'INP',
    'LCP',
    'TTFB'
];
function execOnce(fn) {
    let used = false;
    let result;
    return (...args)=>{
        if (!used) {
            used = true;
            result = fn(...args);
        }
        return result;
    };
}
// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
const isAbsoluteUrl = (url)=>ABSOLUTE_URL_REGEX.test(url);
function getLocationOrigin() {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}
function getURL() {
    const { href } = window.location;
    const origin = getLocationOrigin();
    return href.substring(origin.length);
}
function getDisplayName(Component) {
    return typeof Component === 'string' ? Component : Component.displayName || Component.name || 'Unknown';
}
function isResSent(res) {
    return res.finished || res.headersSent;
}
function normalizeRepeatedSlashes(url) {
    const urlParts = url.split('?');
    const urlNoQuery = urlParts[0];
    return urlNoQuery // first we replace any non-encoded backslashes with forward
    // then normalize repeated forward slashes
    .replace(/\\/g, '/').replace(/\/\/+/g, '/') + (urlParts[1] ? `?${urlParts.slice(1).join('?')}` : '');
}
async function loadGetInitialProps(App, ctx) {
    if ("TURBOPACK compile-time truthy", 1) {
        if (App.prototype?.getInitialProps) {
            const message = `"${getDisplayName(App)}.getInitialProps()" is defined as an instance method - visit https://nextjs.org/docs/messages/get-initial-props-as-an-instance-method for more information.`;
            throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
                value: "E394",
                enumerable: false,
                configurable: true
            });
        }
    }
    // when called from _app `ctx` is nested in `ctx`
    const res = ctx.res || ctx.ctx && ctx.ctx.res;
    if (!App.getInitialProps) {
        if (ctx.ctx && ctx.Component) {
            // @ts-ignore pageProps default
            return {
                pageProps: await loadGetInitialProps(ctx.Component, ctx.ctx)
            };
        }
        return {};
    }
    const props = await App.getInitialProps(ctx);
    if (res && isResSent(res)) {
        return props;
    }
    if (!props) {
        const message = `"${getDisplayName(App)}.getInitialProps()" should resolve to an object. But found "${props}" instead.`;
        throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
    }
    if ("TURBOPACK compile-time truthy", 1) {
        if (Object.keys(props).length === 0 && !ctx.ctx) {
            console.warn(`${getDisplayName(App)} returned an empty object from \`getInitialProps\`. This de-optimizes and prevents automatic static optimization. https://nextjs.org/docs/messages/empty-object-getInitialProps`);
        }
    }
    return props;
}
const SP = typeof performance !== 'undefined';
const ST = SP && [
    'mark',
    'measure',
    'getEntriesByName'
].every((method)=>typeof performance[method] === 'function');
class DecodeError extends Error {
}
class NormalizeError extends Error {
}
class PageNotFoundError extends Error {
    constructor(page){
        super();
        this.code = 'ENOENT';
        this.name = 'PageNotFoundError';
        this.message = `Cannot find module for page: ${page}`;
    }
}
class MissingStaticPage extends Error {
    constructor(page, message){
        super();
        this.message = `Failed to load static file for page: ${page} ${message}`;
    }
}
class MiddlewareNotFoundError extends Error {
    constructor(){
        super();
        this.code = 'ENOENT';
        this.message = `Cannot find the middleware module`;
    }
}
function stringifyError(error) {
    return JSON.stringify({
        message: error.message,
        stack: error.stack
    });
} //# sourceMappingURL=utils.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/etag.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * FNV-1a Hash implementation
 * @author Travis Webb (tjwebb) <me@traviswebb.com>
 *
 * Ported from https://github.com/tjwebb/fnv-plus/blob/master/index.js
 *
 * Simplified, optimized and add modified for 52 bit, which provides a larger hash space
 * and still making use of Javascript's 53-bit integer space.
 */ __turbopack_context__.s([
    "fnv1a52",
    ()=>fnv1a52,
    "generateETag",
    ()=>generateETag
]);
const fnv1a52 = (str)=>{
    const len = str.length;
    let i = 0, t0 = 0, v0 = 0x2325, t1 = 0, v1 = 0x8422, t2 = 0, v2 = 0x9ce4, t3 = 0, v3 = 0xcbf2;
    while(i < len){
        v0 ^= str.charCodeAt(i++);
        t0 = v0 * 435;
        t1 = v1 * 435;
        t2 = v2 * 435;
        t3 = v3 * 435;
        t2 += v0 << 8;
        t3 += v1 << 8;
        t1 += t0 >>> 16;
        v0 = t0 & 65535;
        t2 += t1 >>> 16;
        v1 = t1 & 65535;
        v3 = t3 + (t2 >>> 16) & 65535;
        v2 = t2 & 65535;
    }
    return (v3 & 15) * 281474976710656 + v2 * 4294967296 + v1 * 65536 + (v0 ^ v3 >> 4);
};
const generateETag = (payload, weak = false)=>{
    const prefix = weak ? 'W/"' : '"';
    return prefix + fnv1a52(payload).toString(36) + payload.length.toString(36) + '"';
}; //# sourceMappingURL=etag.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/fresh/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

(()=>{
    "use strict";
    var e = {
        695: (e)=>{
            /*!
 * fresh
 * Copyright(c) 2012 TJ Holowaychuk
 * Copyright(c) 2016-2017 Douglas Christopher Wilson
 * MIT Licensed
 */ var r = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;
            e.exports = fresh;
            function fresh(e, a) {
                var t = e["if-modified-since"];
                var s = e["if-none-match"];
                if (!t && !s) {
                    return false;
                }
                var i = e["cache-control"];
                if (i && r.test(i)) {
                    return false;
                }
                if (s && s !== "*") {
                    var f = a["etag"];
                    if (!f) {
                        return false;
                    }
                    var n = true;
                    var u = parseTokenList(s);
                    for(var _ = 0; _ < u.length; _++){
                        var o = u[_];
                        if (o === f || o === "W/" + f || "W/" + o === f) {
                            n = false;
                            break;
                        }
                    }
                    if (n) {
                        return false;
                    }
                }
                if (t) {
                    var p = a["last-modified"];
                    var v = !p || !(parseHttpDate(p) <= parseHttpDate(t));
                    if (v) {
                        return false;
                    }
                }
                return true;
            }
            function parseHttpDate(e) {
                var r = e && Date.parse(e);
                return typeof r === "number" ? r : NaN;
            }
            function parseTokenList(e) {
                var r = 0;
                var a = [];
                var t = 0;
                for(var s = 0, i = e.length; s < i; s++){
                    switch(e.charCodeAt(s)){
                        case 32:
                            if (t === r) {
                                t = r = s + 1;
                            }
                            break;
                        case 44:
                            a.push(e.substring(t, r));
                            t = r = s + 1;
                            break;
                        default:
                            r = s + 1;
                            break;
                    }
                }
                a.push(e.substring(t, r));
                return a;
            }
        }
    };
    var r = {};
    function __nccwpck_require__(a) {
        var t = r[a];
        if (t !== undefined) {
            return t.exports;
        }
        var s = r[a] = {
            exports: {}
        };
        var i = true;
        try {
            e[a](s, s.exports, __nccwpck_require__);
            i = false;
        } finally{
            if (i) delete r[a];
        }
        return s.exports;
    }
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = ("TURBOPACK compile-time value", "/ROOT/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/fresh") + "/";
    var a = __nccwpck_require__(695);
    module.exports = a;
})();
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/cache-control.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCacheControlHeader",
    ()=>getCacheControlHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/constants.js [app-rsc] (ecmascript)");
;
function getCacheControlHeader({ revalidate, expire }) {
    const swrHeader = typeof revalidate === 'number' && expire !== undefined && revalidate < expire ? `, stale-while-revalidate=${expire - revalidate}` : '';
    if (revalidate === 0) {
        return 'private, no-cache, no-store, max-age=0, must-revalidate';
    } else if (typeof revalidate === 'number') {
        return `s-maxage=${revalidate}${swrHeader}`;
    }
    return `s-maxage=${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CACHE_ONE_YEAR"]}${swrHeader}`;
} //# sourceMappingURL=cache-control.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/send-payload.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendEtagResponse",
    ()=>sendEtagResponse,
    "sendRenderResult",
    ()=>sendRenderResult
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$etag$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/etag.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$fresh$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/fresh/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$cache$2d$control$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/cache-control.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/constants.js [app-rsc] (ecmascript)");
;
;
;
;
;
function sendEtagResponse(req, res, etag) {
    if (etag) {
        /**
     * The server generating a 304 response MUST generate any of the
     * following header fields that would have been sent in a 200 (OK)
     * response to the same request: Cache-Control, Content-Location, Date,
     * ETag, Expires, and Vary. https://tools.ietf.org/html/rfc7232#section-4.1
     */ res.setHeader('ETag', etag);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$fresh$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(req.headers, {
        etag
    })) {
        res.statusCode = 304;
        res.end();
        return true;
    }
    return false;
}
async function sendRenderResult({ req, res, result, generateEtags, poweredByHeader, cacheControl }) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isResSent"])(res)) {
        return;
    }
    if (poweredByHeader && result.contentType === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HTML_CONTENT_TYPE_HEADER"]) {
        res.setHeader('X-Powered-By', 'Next.js');
    }
    // If cache control is already set on the response we don't
    // override it to allow users to customize it via next.config
    if (cacheControl && !res.getHeader('Cache-Control')) {
        res.setHeader('Cache-Control', (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$cache$2d$control$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCacheControlHeader"])(cacheControl));
    }
    const payload = result.isDynamic ? null : result.toUnchunkedString();
    if (generateEtags && payload !== null) {
        const etag = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$etag$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateETag"])(payload);
        if (sendEtagResponse(req, res, etag)) {
            return;
        }
    }
    if (!res.getHeader('Content-Type') && result.contentType) {
        res.setHeader('Content-Type', result.contentType);
    }
    if (payload) {
        res.setHeader('Content-Length', Buffer.byteLength(payload));
    }
    if (req.method === 'HEAD') {
        res.end(null);
        return;
    }
    if (payload !== null) {
        res.end(payload);
        return;
    }
    // Pipe the render result to the response after we get a writer for it.
    await result.pipeToNodeResponse(res);
} //# sourceMappingURL=send-payload.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/bytes/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

(()=>{
    "use strict";
    var e = {
        56: (e)=>{
            /*!
 * bytes
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015 Jed Watson
 * MIT Licensed
 */ e.exports = bytes;
            e.exports.format = format;
            e.exports.parse = parse;
            var r = /\B(?=(\d{3})+(?!\d))/g;
            var a = /(?:\.0*|(\.[^0]+)0+)$/;
            var t = {
                b: 1,
                kb: 1 << 10,
                mb: 1 << 20,
                gb: 1 << 30,
                tb: Math.pow(1024, 4),
                pb: Math.pow(1024, 5)
            };
            var i = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i;
            function bytes(e, r) {
                if (typeof e === "string") {
                    return parse(e);
                }
                if (typeof e === "number") {
                    return format(e, r);
                }
                return null;
            }
            function format(e, i) {
                if (!Number.isFinite(e)) {
                    return null;
                }
                var n = Math.abs(e);
                var o = i && i.thousandsSeparator || "";
                var s = i && i.unitSeparator || "";
                var f = i && i.decimalPlaces !== undefined ? i.decimalPlaces : 2;
                var u = Boolean(i && i.fixedDecimals);
                var p = i && i.unit || "";
                if (!p || !t[p.toLowerCase()]) {
                    if (n >= t.pb) {
                        p = "PB";
                    } else if (n >= t.tb) {
                        p = "TB";
                    } else if (n >= t.gb) {
                        p = "GB";
                    } else if (n >= t.mb) {
                        p = "MB";
                    } else if (n >= t.kb) {
                        p = "KB";
                    } else {
                        p = "B";
                    }
                }
                var b = e / t[p.toLowerCase()];
                var l = b.toFixed(f);
                if (!u) {
                    l = l.replace(a, "$1");
                }
                if (o) {
                    l = l.split(".").map(function(e, a) {
                        return a === 0 ? e.replace(r, o) : e;
                    }).join(".");
                }
                return l + s + p;
            }
            function parse(e) {
                if (typeof e === "number" && !isNaN(e)) {
                    return e;
                }
                if (typeof e !== "string") {
                    return null;
                }
                var r = i.exec(e);
                var a;
                var n = "b";
                if (!r) {
                    a = parseInt(e, 10);
                    n = "b";
                } else {
                    a = parseFloat(r[1]);
                    n = r[4].toLowerCase();
                }
                return Math.floor(t[n] * a);
            }
        }
    };
    var r = {};
    function __nccwpck_require__(a) {
        var t = r[a];
        if (t !== undefined) {
            return t.exports;
        }
        var i = r[a] = {
            exports: {}
        };
        var n = true;
        try {
            e[a](i, i.exports, __nccwpck_require__);
            n = false;
        } finally{
            if (n) delete r[a];
        }
        return i.exports;
    }
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = ("TURBOPACK compile-time value", "/ROOT/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/bytes") + "/";
    var a = __nccwpck_require__(56);
    module.exports = a;
})();
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/size-limit.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_MAX_POSTPONED_STATE_SIZE",
    ()=>DEFAULT_MAX_POSTPONED_STATE_SIZE,
    "parseMaxPostponedStateSize",
    ()=>parseMaxPostponedStateSize
]);
const DEFAULT_MAX_POSTPONED_STATE_SIZE = '100 MB';
function parseSizeLimit(size) {
    const bytes = __turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/compiled/bytes/index.js [app-rsc] (ecmascript)").parse(size);
    if (bytes === null || isNaN(bytes) || bytes < 1) {
        return undefined;
    }
    return bytes;
}
function parseMaxPostponedStateSize(size) {
    return parseSizeLimit(size ?? DEFAULT_MAX_POSTPONED_STATE_SIZE);
} //# sourceMappingURL=size-limit.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript)"));
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript, Next.js server utility) <locals>", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript) <locals>"));}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript, Next.js server utility)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript)"));}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js [app-rsc] (ecmascript)"));
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js [app-rsc] (ecmascript)"));
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js [app-rsc] (ecmascript)"));
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/client-runtime-utils/dist/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod2)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod2);
// src/index.ts
var index_exports = {};
__export(index_exports, {
    AnyNull: ()=>AnyNull,
    AnyNullClass: ()=>AnyNullClass,
    DbNull: ()=>DbNull,
    DbNullClass: ()=>DbNullClass,
    Decimal: ()=>Decimal,
    JsonNull: ()=>JsonNull,
    JsonNullClass: ()=>JsonNullClass,
    NullTypes: ()=>NullTypes,
    ObjectEnumValue: ()=>ObjectEnumValue,
    PrismaClientInitializationError: ()=>PrismaClientInitializationError,
    PrismaClientKnownRequestError: ()=>PrismaClientKnownRequestError,
    PrismaClientRustError: ()=>PrismaClientRustError,
    PrismaClientRustPanicError: ()=>PrismaClientRustPanicError,
    PrismaClientUnknownRequestError: ()=>PrismaClientUnknownRequestError,
    PrismaClientValidationError: ()=>PrismaClientValidationError,
    Sql: ()=>Sql,
    empty: ()=>empty,
    hasBatchIndex: ()=>hasBatchIndex,
    isAnyNull: ()=>isAnyNull,
    isDbNull: ()=>isDbNull,
    isJsonNull: ()=>isJsonNull,
    join: ()=>join,
    raw: ()=>raw,
    sql: ()=>sql
});
module.exports = __toCommonJS(index_exports);
// src/errors/ErrorWithBatchIndex.ts
function hasBatchIndex(value) {
    return typeof value["batchRequestIdx"] === "number";
}
// src/errors/setClassName.ts
function setClassName(classObject, name) {
    Object.defineProperty(classObject, "name", {
        value: name,
        configurable: true
    });
}
// src/errors/PrismaClientInitializationError.ts
var PrismaClientInitializationError = class _PrismaClientInitializationError extends Error {
    clientVersion;
    errorCode;
    retryable;
    constructor(message, clientVersion, errorCode){
        super(message);
        this.name = "PrismaClientInitializationError";
        this.clientVersion = clientVersion;
        this.errorCode = errorCode;
        Error.captureStackTrace(_PrismaClientInitializationError);
    }
    get [Symbol.toStringTag]() {
        return "PrismaClientInitializationError";
    }
};
setClassName(PrismaClientInitializationError, "PrismaClientInitializationError");
// src/errors/PrismaClientKnownRequestError.ts
var PrismaClientKnownRequestError = class extends Error {
    code;
    meta;
    clientVersion;
    batchRequestIdx;
    constructor(message, { code, clientVersion, meta, batchRequestIdx }){
        super(message);
        this.name = "PrismaClientKnownRequestError";
        this.code = code;
        this.clientVersion = clientVersion;
        this.meta = meta;
        Object.defineProperty(this, "batchRequestIdx", {
            value: batchRequestIdx,
            enumerable: false,
            writable: true
        });
    }
    get [Symbol.toStringTag]() {
        return "PrismaClientKnownRequestError";
    }
};
setClassName(PrismaClientKnownRequestError, "PrismaClientKnownRequestError");
// src/errors/log.ts
function getBacktrace(log3) {
    if (log3.fields?.message) {
        let str = log3.fields?.message;
        if (log3.fields?.file) {
            str += ` in ${log3.fields.file}`;
            if (log3.fields?.line) {
                str += `:${log3.fields.line}`;
            }
            if (log3.fields?.column) {
                str += `:${log3.fields.column}`;
            }
        }
        if (log3.fields?.reason) {
            str += `
${log3.fields?.reason}`;
        }
        return str;
    }
    return "Unknown error";
}
function isPanic(err) {
    return err.fields?.message === "PANIC";
}
// src/errors/PrismaClientRustError.ts
var PrismaClientRustError = class extends Error {
    clientVersion;
    _isPanic;
    constructor({ clientVersion, error }){
        const backtrace = getBacktrace(error);
        super(backtrace ?? "Unknown error");
        this._isPanic = isPanic(error);
        this.clientVersion = clientVersion;
    }
    get [Symbol.toStringTag]() {
        return "PrismaClientRustError";
    }
    isPanic() {
        return this._isPanic;
    }
};
setClassName(PrismaClientRustError, "PrismaClientRustError");
// src/errors/PrismaClientRustPanicError.ts
var PrismaClientRustPanicError = class extends Error {
    clientVersion;
    constructor(message, clientVersion){
        super(message);
        this.name = "PrismaClientRustPanicError";
        this.clientVersion = clientVersion;
    }
    get [Symbol.toStringTag]() {
        return "PrismaClientRustPanicError";
    }
};
setClassName(PrismaClientRustPanicError, "PrismaClientRustPanicError");
// src/errors/PrismaClientUnknownRequestError.ts
var PrismaClientUnknownRequestError = class extends Error {
    clientVersion;
    batchRequestIdx;
    constructor(message, { clientVersion, batchRequestIdx }){
        super(message);
        this.name = "PrismaClientUnknownRequestError";
        this.clientVersion = clientVersion;
        Object.defineProperty(this, "batchRequestIdx", {
            value: batchRequestIdx,
            writable: true,
            enumerable: false
        });
    }
    get [Symbol.toStringTag]() {
        return "PrismaClientUnknownRequestError";
    }
};
setClassName(PrismaClientUnknownRequestError, "PrismaClientUnknownRequestError");
// src/errors/PrismaClientValidationError.ts
var PrismaClientValidationError = class extends Error {
    name = "PrismaClientValidationError";
    clientVersion;
    constructor(message, { clientVersion }){
        super(message);
        this.clientVersion = clientVersion;
    }
    get [Symbol.toStringTag]() {
        return "PrismaClientValidationError";
    }
};
setClassName(PrismaClientValidationError, "PrismaClientValidationError");
// src/nullTypes.ts
var secret = Symbol();
var representations = /* @__PURE__ */ new WeakMap();
var ObjectEnumValue = class {
    constructor(arg){
        if (arg === secret) {
            representations.set(this, `Prisma.${this._getName()}`);
        } else {
            representations.set(this, `new Prisma.${this._getNamespace()}.${this._getName()}()`);
        }
    }
    _getName() {
        return this.constructor.name;
    }
    toString() {
        return representations.get(this);
    }
};
function setClassName2(classObject, name) {
    Object.defineProperty(classObject, "name", {
        value: name,
        configurable: true
    });
}
var NullTypesEnumValue = class extends ObjectEnumValue {
    _getNamespace() {
        return "NullTypes";
    }
};
var DbNullClass = class extends NullTypesEnumValue {
    // Phantom private property to prevent structural type equality
    // eslint-disable-next-line no-unused-private-class-members
    #_brand_DbNull;
};
setClassName2(DbNullClass, "DbNull");
var JsonNullClass = class extends NullTypesEnumValue {
    // Phantom private property to prevent structural type equality
    // eslint-disable-next-line no-unused-private-class-members
    #_brand_JsonNull;
};
setClassName2(JsonNullClass, "JsonNull");
var AnyNullClass = class extends NullTypesEnumValue {
    // Phantom private property to prevent structural type equality
    // eslint-disable-next-line no-unused-private-class-members
    #_brand_AnyNull;
};
setClassName2(AnyNullClass, "AnyNull");
var NullTypes = {
    DbNull: DbNullClass,
    JsonNull: JsonNullClass,
    AnyNull: AnyNullClass
};
var DbNull = new DbNullClass(secret);
var JsonNull = new JsonNullClass(secret);
var AnyNull = new AnyNullClass(secret);
function isDbNull(value) {
    return value === DbNull;
}
function isJsonNull(value) {
    return value === JsonNull;
}
function isAnyNull(value) {
    return value === AnyNull;
}
// ../../node_modules/.pnpm/decimal.js@10.5.0/node_modules/decimal.js/decimal.mjs
var EXP_LIMIT = 9e15;
var MAX_DIGITS = 1e9;
var NUMERALS = "0123456789abcdef";
var LN10 = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058";
var PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789";
var DEFAULTS = {
    // These values must be integers within the stated ranges (inclusive).
    // Most of these values can be changed at run-time using the `Decimal.config` method.
    // The maximum number of significant digits of the result of a calculation or base conversion.
    // E.g. `Decimal.config({ precision: 20 });`
    precision: 20,
    // 1 to MAX_DIGITS
    // The rounding mode used when rounding to `precision`.
    //
    // ROUND_UP         0 Away from zero.
    // ROUND_DOWN       1 Towards zero.
    // ROUND_CEIL       2 Towards +Infinity.
    // ROUND_FLOOR      3 Towards -Infinity.
    // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
    // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
    // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
    // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
    // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
    //
    // E.g.
    // `Decimal.rounding = 4;`
    // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
    rounding: 4,
    // 0 to 8
    // The modulo mode used when calculating the modulus: a mod n.
    // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
    // The remainder (r) is calculated as: r = a - n * q.
    //
    // UP         0 The remainder is positive if the dividend is negative, else is negative.
    // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
    // FLOOR      3 The remainder has the same sign as the divisor (Python %).
    // HALF_EVEN  6 The IEEE 754 remainder function.
    // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
    //
    // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
    // division (9) are commonly used for the modulus operation. The other rounding modes can also
    // be used, but they may not give useful results.
    modulo: 1,
    // 0 to 9
    // The exponent value at and beneath which `toString` returns exponential notation.
    // JavaScript numbers: -7
    toExpNeg: -7,
    // 0 to -EXP_LIMIT
    // The exponent value at and above which `toString` returns exponential notation.
    // JavaScript numbers: 21
    toExpPos: 21,
    // 0 to EXP_LIMIT
    // The minimum exponent value, beneath which underflow to zero occurs.
    // JavaScript numbers: -324  (5e-324)
    minE: -EXP_LIMIT,
    // -1 to -EXP_LIMIT
    // The maximum exponent value, above which overflow to Infinity occurs.
    // JavaScript numbers: 308  (1.7976931348623157e+308)
    maxE: EXP_LIMIT,
    // 1 to EXP_LIMIT
    // Whether to use cryptographically-secure random number generation, if available.
    crypto: false
};
var inexact;
var quadrant;
var external = true;
var decimalError = "[DecimalError] ";
var invalidArgument = decimalError + "Invalid argument: ";
var precisionLimitExceeded = decimalError + "Precision limit exceeded";
var cryptoUnavailable = decimalError + "crypto unavailable";
var tag = "[object Decimal]";
var mathfloor = Math.floor;
var mathpow = Math.pow;
var isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
var isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i;
var isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
var isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
var BASE = 1e7;
var LOG_BASE = 7;
var MAX_SAFE_INTEGER = 9007199254740991;
var LN10_PRECISION = LN10.length - 1;
var PI_PRECISION = PI.length - 1;
var P = {
    toStringTag: tag
};
P.absoluteValue = P.abs = function() {
    var x = new this.constructor(this);
    if (x.s < 0) x.s = 1;
    return finalise(x);
};
P.ceil = function() {
    return finalise(new this.constructor(this), this.e + 1, 2);
};
P.clampedTo = P.clamp = function(min2, max2) {
    var k, x = this, Ctor = x.constructor;
    min2 = new Ctor(min2);
    max2 = new Ctor(max2);
    if (!min2.s || !max2.s) return new Ctor(NaN);
    if (min2.gt(max2)) throw Error(invalidArgument + max2);
    k = x.cmp(min2);
    return k < 0 ? min2 : x.cmp(max2) > 0 ? max2 : new Ctor(x);
};
P.comparedTo = P.cmp = function(y) {
    var i, j, xdL, ydL, x = this, xd = x.d, yd = (y = new x.constructor(y)).d, xs = x.s, ys = y.s;
    if (!xd || !yd) {
        return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
    }
    if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;
    if (xs !== ys) return xs;
    if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;
    xdL = xd.length;
    ydL = yd.length;
    for(i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i){
        if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
    }
    return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
};
P.cosine = P.cos = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.d) return new Ctor(NaN);
    if (!x.d[0]) return new Ctor(1);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
    Ctor.rounding = 1;
    x = cosine(Ctor, toLessThanHalfPi(Ctor, x));
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
};
P.cubeRoot = P.cbrt = function() {
    var e, m, n, r, rep, s, sd, t, t3, t3plusx, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    external = false;
    s = x.s * mathpow(x.s * x, 1 / 3);
    if (!s || Math.abs(s) == 1 / 0) {
        n = digitsToString(x.d);
        e = x.e;
        if (s = (e - n.length + 1) % 3) n += s == 1 || s == -2 ? "0" : "00";
        s = mathpow(n, 1 / 3);
        e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));
        if (s == 1 / 0) {
            n = "5e" + e;
        } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf("e") + 1) + e;
        }
        r = new Ctor(n);
        r.s = x.s;
    } else {
        r = new Ctor(s.toString());
    }
    sd = (e = Ctor.precision) + 3;
    for(;;){
        t = r;
        t3 = t.times(t).times(t);
        t3plusx = t3.plus(x);
        r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);
            if (n == "9999" || !rep && n == "4999") {
                if (!rep) {
                    finalise(t, e + 1, 0);
                    if (t.times(t).times(t).eq(x)) {
                        r = t;
                        break;
                    }
                }
                sd += 4;
                rep = 1;
            } else {
                if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
                    finalise(r, e + 1, 1);
                    m = !r.times(r).times(r).eq(x);
                }
                break;
            }
        }
    }
    external = true;
    return finalise(r, e, Ctor.rounding, m);
};
P.decimalPlaces = P.dp = function() {
    var w, d = this.d, n = NaN;
    if (d) {
        w = d.length - 1;
        n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;
        w = d[w];
        if (w) for(; w % 10 == 0; w /= 10)n--;
        if (n < 0) n = 0;
    }
    return n;
};
P.dividedBy = P.div = function(y) {
    return divide(this, new this.constructor(y));
};
P.dividedToIntegerBy = P.divToInt = function(y) {
    var x = this, Ctor = x.constructor;
    return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
};
P.equals = P.eq = function(y) {
    return this.cmp(y) === 0;
};
P.floor = function() {
    return finalise(new this.constructor(this), this.e + 1, 3);
};
P.greaterThan = P.gt = function(y) {
    return this.cmp(y) > 0;
};
P.greaterThanOrEqualTo = P.gte = function(y) {
    var k = this.cmp(y);
    return k == 1 || k === 0;
};
P.hyperbolicCosine = P.cosh = function() {
    var k, n, pr, rm, len, x = this, Ctor = x.constructor, one = new Ctor(1);
    if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
    if (x.isZero()) return one;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
    Ctor.rounding = 1;
    len = x.d.length;
    if (len < 32) {
        k = Math.ceil(len / 3);
        n = (1 / tinyPow(4, k)).toString();
    } else {
        k = 16;
        n = "2.3283064365386962890625e-10";
    }
    x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);
    var cosh2_x, i = k, d8 = new Ctor(8);
    for(; i--;){
        cosh2_x = x.times(x);
        x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
    }
    return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
};
P.hyperbolicSine = P.sinh = function() {
    var k, pr, rm, len, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
    Ctor.rounding = 1;
    len = x.d.length;
    if (len < 3) {
        x = taylorSeries(Ctor, 2, x, x, true);
    } else {
        k = 1.4 * Math.sqrt(len);
        k = k > 16 ? 16 : k | 0;
        x = x.times(1 / tinyPow(5, k));
        x = taylorSeries(Ctor, 2, x, x, true);
        var sinh2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
        for(; k--;){
            sinh2_x = x.times(x);
            x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
        }
    }
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(x, pr, rm, true);
};
P.hyperbolicTangent = P.tanh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(x.s);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 7;
    Ctor.rounding = 1;
    return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
};
P.inverseCosine = P.acos = function() {
    var x = this, Ctor = x.constructor, k = x.abs().cmp(1), pr = Ctor.precision, rm = Ctor.rounding;
    if (k !== -1) {
        return k === 0 ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0) : new Ctor(NaN);
    }
    if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);
    Ctor.precision = pr + 6;
    Ctor.rounding = 1;
    x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(2);
};
P.inverseHyperbolicCosine = P.acosh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
    if (!x.isFinite()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
    Ctor.rounding = 1;
    external = false;
    x = x.times(x).minus(1).sqrt().plus(x);
    external = true;
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.ln();
};
P.inverseHyperbolicSine = P.asinh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
    Ctor.rounding = 1;
    external = false;
    x = x.times(x).plus(1).sqrt().plus(x);
    external = true;
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.ln();
};
P.inverseHyperbolicTangent = P.atanh = function() {
    var pr, rm, wpr, xsd, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    xsd = x.sd();
    if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);
    Ctor.precision = wpr = xsd - x.e;
    x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);
    Ctor.precision = pr + 4;
    Ctor.rounding = 1;
    x = x.ln();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(0.5);
};
P.inverseSine = P.asin = function() {
    var halfPi, k, pr, rm, x = this, Ctor = x.constructor;
    if (x.isZero()) return new Ctor(x);
    k = x.abs().cmp(1);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (k !== -1) {
        if (k === 0) {
            halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
            halfPi.s = x.s;
            return halfPi;
        }
        return new Ctor(NaN);
    }
    Ctor.precision = pr + 6;
    Ctor.rounding = 1;
    x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(2);
};
P.inverseTangent = P.atan = function() {
    var i, j, k, n, px, t, r, wpr, x2, x = this, Ctor = x.constructor, pr = Ctor.precision, rm = Ctor.rounding;
    if (!x.isFinite()) {
        if (!x.s) return new Ctor(NaN);
        if (pr + 4 <= PI_PRECISION) {
            r = getPi(Ctor, pr + 4, rm).times(0.5);
            r.s = x.s;
            return r;
        }
    } else if (x.isZero()) {
        return new Ctor(x);
    } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
        r = getPi(Ctor, pr + 4, rm).times(0.25);
        r.s = x.s;
        return r;
    }
    Ctor.precision = wpr = pr + 10;
    Ctor.rounding = 1;
    k = Math.min(28, wpr / LOG_BASE + 2 | 0);
    for(i = k; i; --i)x = x.div(x.times(x).plus(1).sqrt().plus(1));
    external = false;
    j = Math.ceil(wpr / LOG_BASE);
    n = 1;
    x2 = x.times(x);
    r = new Ctor(x);
    px = x;
    for(; i !== -1;){
        px = px.times(x2);
        t = r.minus(px.div(n += 2));
        px = px.times(x2);
        r = t.plus(px.div(n += 2));
        if (r.d[j] !== void 0) for(i = j; r.d[i] === t.d[i] && i--;);
    }
    if (k) r = r.times(2 << k - 1);
    external = true;
    return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
};
P.isFinite = function() {
    return !!this.d;
};
P.isInteger = P.isInt = function() {
    return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
};
P.isNaN = function() {
    return !this.s;
};
P.isNegative = P.isNeg = function() {
    return this.s < 0;
};
P.isPositive = P.isPos = function() {
    return this.s > 0;
};
P.isZero = function() {
    return !!this.d && this.d[0] === 0;
};
P.lessThan = P.lt = function(y) {
    return this.cmp(y) < 0;
};
P.lessThanOrEqualTo = P.lte = function(y) {
    return this.cmp(y) < 1;
};
P.logarithm = P.log = function(base) {
    var isBase10, d, denominator, k, inf, num, sd, r, arg = this, Ctor = arg.constructor, pr = Ctor.precision, rm = Ctor.rounding, guard = 5;
    if (base == null) {
        base = new Ctor(10);
        isBase10 = true;
    } else {
        base = new Ctor(base);
        d = base.d;
        if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);
        isBase10 = base.eq(10);
    }
    d = arg.d;
    if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
        return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
    }
    if (isBase10) {
        if (d.length > 1) {
            inf = true;
        } else {
            for(k = d[0]; k % 10 === 0;)k /= 10;
            inf = k !== 1;
        }
    }
    external = false;
    sd = pr + guard;
    num = naturalLogarithm(arg, sd);
    denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
    r = divide(num, denominator, sd, 1);
    if (checkRoundingDigits(r.d, k = pr, rm)) {
        do {
            sd += 10;
            num = naturalLogarithm(arg, sd);
            denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
            r = divide(num, denominator, sd, 1);
            if (!inf) {
                if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
                    r = finalise(r, pr + 1, 0);
                }
                break;
            }
        }while (checkRoundingDigits(r.d, k += 10, rm))
    }
    external = true;
    return finalise(r, pr, rm);
};
P.minus = P.sub = function(y) {
    var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.d) {
        if (!x.s || !y.s) y = new Ctor(NaN);
        else if (x.d) y.s = -y.s;
        else y = new Ctor(y.d || x.s !== y.s ? x : NaN);
        return y;
    }
    if (x.s != y.s) {
        y.s = -y.s;
        return x.plus(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (!xd[0] || !yd[0]) {
        if (yd[0]) y.s = -y.s;
        else if (xd[0]) y = new Ctor(x);
        else return new Ctor(rm === 3 ? -0 : 0);
        return external ? finalise(y, pr, rm) : y;
    }
    e = mathfloor(y.e / LOG_BASE);
    xe = mathfloor(x.e / LOG_BASE);
    xd = xd.slice();
    k = xe - e;
    if (k) {
        xLTy = k < 0;
        if (xLTy) {
            d = xd;
            k = -k;
            len = yd.length;
        } else {
            d = yd;
            e = xe;
            len = xd.length;
        }
        i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
        if (k > i) {
            k = i;
            d.length = 1;
        }
        d.reverse();
        for(i = k; i--;)d.push(0);
        d.reverse();
    } else {
        i = xd.length;
        len = yd.length;
        xLTy = i < len;
        if (xLTy) len = i;
        for(i = 0; i < len; i++){
            if (xd[i] != yd[i]) {
                xLTy = xd[i] < yd[i];
                break;
            }
        }
        k = 0;
    }
    if (xLTy) {
        d = xd;
        xd = yd;
        yd = d;
        y.s = -y.s;
    }
    len = xd.length;
    for(i = yd.length - len; i > 0; --i)xd[len++] = 0;
    for(i = yd.length; i > k;){
        if (xd[--i] < yd[i]) {
            for(j = i; j && xd[--j] === 0;)xd[j] = BASE - 1;
            --xd[j];
            xd[i] += BASE;
        }
        xd[i] -= yd[i];
    }
    for(; xd[--len] === 0;)xd.pop();
    for(; xd[0] === 0; xd.shift())--e;
    if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return external ? finalise(y, pr, rm) : y;
};
P.modulo = P.mod = function(y) {
    var q, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);
    if (!y.d || x.d && !x.d[0]) {
        return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
    }
    external = false;
    if (Ctor.modulo == 9) {
        q = divide(x, y.abs(), 0, 3, 1);
        q.s *= y.s;
    } else {
        q = divide(x, y, 0, Ctor.modulo, 1);
    }
    q = q.times(y);
    external = true;
    return x.minus(q);
};
P.naturalExponential = P.exp = function() {
    return naturalExponential(this);
};
P.naturalLogarithm = P.ln = function() {
    return naturalLogarithm(this);
};
P.negated = P.neg = function() {
    var x = new this.constructor(this);
    x.s = -x.s;
    return finalise(x);
};
P.plus = P.add = function(y) {
    var carry, d, e, i, k, len, pr, rm, xd, yd, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.d) {
        if (!x.s || !y.s) y = new Ctor(NaN);
        else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);
        return y;
    }
    if (x.s != y.s) {
        y.s = -y.s;
        return x.minus(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (!xd[0] || !yd[0]) {
        if (!yd[0]) y = new Ctor(x);
        return external ? finalise(y, pr, rm) : y;
    }
    k = mathfloor(x.e / LOG_BASE);
    e = mathfloor(y.e / LOG_BASE);
    xd = xd.slice();
    i = k - e;
    if (i) {
        if (i < 0) {
            d = xd;
            i = -i;
            len = yd.length;
        } else {
            d = yd;
            e = k;
            len = xd.length;
        }
        k = Math.ceil(pr / LOG_BASE);
        len = k > len ? k + 1 : len + 1;
        if (i > len) {
            i = len;
            d.length = 1;
        }
        d.reverse();
        for(; i--;)d.push(0);
        d.reverse();
    }
    len = xd.length;
    i = yd.length;
    if (len - i < 0) {
        i = len;
        d = yd;
        yd = xd;
        xd = d;
    }
    for(carry = 0; i;){
        carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
        xd[i] %= BASE;
    }
    if (carry) {
        xd.unshift(carry);
        ++e;
    }
    for(len = xd.length; xd[--len] == 0;)xd.pop();
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return external ? finalise(y, pr, rm) : y;
};
P.precision = P.sd = function(z) {
    var k, x = this;
    if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);
    if (x.d) {
        k = getPrecision(x.d);
        if (z && x.e + 1 > k) k = x.e + 1;
    } else {
        k = NaN;
    }
    return k;
};
P.round = function() {
    var x = this, Ctor = x.constructor;
    return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
};
P.sine = P.sin = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
    Ctor.rounding = 1;
    x = sine(Ctor, toLessThanHalfPi(Ctor, x));
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
};
P.squareRoot = P.sqrt = function() {
    var m, n, sd, r, rep, t, x = this, d = x.d, e = x.e, s = x.s, Ctor = x.constructor;
    if (s !== 1 || !d || !d[0]) {
        return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
    }
    external = false;
    s = Math.sqrt(+x);
    if (s == 0 || s == 1 / 0) {
        n = digitsToString(d);
        if ((n.length + e) % 2 == 0) n += "0";
        s = Math.sqrt(n);
        e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);
        if (s == 1 / 0) {
            n = "5e" + e;
        } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf("e") + 1) + e;
        }
        r = new Ctor(n);
    } else {
        r = new Ctor(s.toString());
    }
    sd = (e = Ctor.precision) + 3;
    for(;;){
        t = r;
        r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);
            if (n == "9999" || !rep && n == "4999") {
                if (!rep) {
                    finalise(t, e + 1, 0);
                    if (t.times(t).eq(x)) {
                        r = t;
                        break;
                    }
                }
                sd += 4;
                rep = 1;
            } else {
                if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
                    finalise(r, e + 1, 1);
                    m = !r.times(r).eq(x);
                }
                break;
            }
        }
    }
    external = true;
    return finalise(r, e, Ctor.rounding, m);
};
P.tangent = P.tan = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 10;
    Ctor.rounding = 1;
    x = x.sin();
    x.s = 1;
    x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
};
P.times = P.mul = function(y) {
    var carry, e, i, k, r, rL, t, xdL, ydL, x = this, Ctor = x.constructor, xd = x.d, yd = (y = new Ctor(y)).d;
    y.s *= x.s;
    if (!xd || !xd[0] || !yd || !yd[0]) {
        return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd ? NaN : !xd || !yd ? y.s / 0 : y.s * 0);
    }
    e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
    xdL = xd.length;
    ydL = yd.length;
    if (xdL < ydL) {
        r = xd;
        xd = yd;
        yd = r;
        rL = xdL;
        xdL = ydL;
        ydL = rL;
    }
    r = [];
    rL = xdL + ydL;
    for(i = rL; i--;)r.push(0);
    for(i = ydL; --i >= 0;){
        carry = 0;
        for(k = xdL + i; k > i;){
            t = r[k] + yd[i] * xd[k - i - 1] + carry;
            r[k--] = t % BASE | 0;
            carry = t / BASE | 0;
        }
        r[k] = (r[k] + carry) % BASE | 0;
    }
    for(; !r[--rL];)r.pop();
    if (carry) ++e;
    else r.shift();
    y.d = r;
    y.e = getBase10Exponent(r, e);
    return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
};
P.toBinary = function(sd, rm) {
    return toStringBinary(this, 2, sd, rm);
};
P.toDecimalPlaces = P.toDP = function(dp, rm) {
    var x = this, Ctor = x.constructor;
    x = new Ctor(x);
    if (dp === void 0) return x;
    checkInt32(dp, 0, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
    return finalise(x, dp + x.e + 1, rm);
};
P.toExponential = function(dp, rm) {
    var str, x = this, Ctor = x.constructor;
    if (dp === void 0) {
        str = finiteToString(x, true);
    } else {
        checkInt32(dp, 0, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
        x = finalise(new Ctor(x), dp + 1, rm);
        str = finiteToString(x, true, dp + 1);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toFixed = function(dp, rm) {
    var str, y, x = this, Ctor = x.constructor;
    if (dp === void 0) {
        str = finiteToString(x);
    } else {
        checkInt32(dp, 0, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
        y = finalise(new Ctor(x), dp + x.e + 1, rm);
        str = finiteToString(y, false, dp + y.e + 1);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toFraction = function(maxD) {
    var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r, x = this, xd = x.d, Ctor = x.constructor;
    if (!xd) return new Ctor(x);
    n1 = d0 = new Ctor(1);
    d1 = n0 = new Ctor(0);
    d = new Ctor(d1);
    e = d.e = getPrecision(xd) - x.e - 1;
    k = e % LOG_BASE;
    d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);
    if (maxD == null) {
        maxD = e > 0 ? d : n1;
    } else {
        n = new Ctor(maxD);
        if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
        maxD = n.gt(d) ? e > 0 ? d : n1 : n;
    }
    external = false;
    n = new Ctor(digitsToString(xd));
    pr = Ctor.precision;
    Ctor.precision = e = xd.length * LOG_BASE * 2;
    for(;;){
        q = divide(n, d, 0, 1, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.cmp(maxD) == 1) break;
        d0 = d1;
        d1 = d2;
        d2 = n1;
        n1 = n0.plus(q.times(d2));
        n0 = d2;
        d2 = d;
        d = n.minus(q.times(d2));
        n = d2;
    }
    d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
    n0 = n0.plus(d2.times(n1));
    d0 = d0.plus(d2.times(d1));
    n0.s = n1.s = x.s;
    r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1 ? [
        n1,
        d1
    ] : [
        n0,
        d0
    ];
    Ctor.precision = pr;
    external = true;
    return r;
};
P.toHexadecimal = P.toHex = function(sd, rm) {
    return toStringBinary(this, 16, sd, rm);
};
P.toNearest = function(y, rm) {
    var x = this, Ctor = x.constructor;
    x = new Ctor(x);
    if (y == null) {
        if (!x.d) return x;
        y = new Ctor(1);
        rm = Ctor.rounding;
    } else {
        y = new Ctor(y);
        if (rm === void 0) {
            rm = Ctor.rounding;
        } else {
            checkInt32(rm, 0, 8);
        }
        if (!x.d) return y.s ? x : y;
        if (!y.d) {
            if (y.s) y.s = x.s;
            return y;
        }
    }
    if (y.d[0]) {
        external = false;
        x = divide(x, y, 0, rm, 1).times(y);
        external = true;
        finalise(x);
    } else {
        y.s = x.s;
        x = y;
    }
    return x;
};
P.toNumber = function() {
    return +this;
};
P.toOctal = function(sd, rm) {
    return toStringBinary(this, 8, sd, rm);
};
P.toPower = P.pow = function(y) {
    var e, k, pr, r, rm, s, x = this, Ctor = x.constructor, yn = +(y = new Ctor(y));
    if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));
    x = new Ctor(x);
    if (x.eq(1)) return x;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (y.eq(1)) return finalise(x, pr, rm);
    e = mathfloor(y.e / LOG_BASE);
    if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
        r = intPow(Ctor, x, k, pr);
        return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
    }
    s = x.s;
    if (s < 0) {
        if (e < y.d.length - 1) return new Ctor(NaN);
        if ((y.d[e] & 1) == 0) s = 1;
        if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
            x.s = s;
            return x;
        }
    }
    k = mathpow(+x, yn);
    e = k == 0 || !isFinite(k) ? mathfloor(yn * (Math.log("0." + digitsToString(x.d)) / Math.LN10 + x.e + 1)) : new Ctor(k + "").e;
    if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);
    external = false;
    Ctor.rounding = x.s = 1;
    k = Math.min(12, (e + "").length);
    r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);
    if (r.d) {
        r = finalise(r, pr + 5, 1);
        if (checkRoundingDigits(r.d, pr, rm)) {
            e = pr + 10;
            r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);
            if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
                r = finalise(r, pr + 1, 0);
            }
        }
    }
    r.s = s;
    external = true;
    Ctor.rounding = rm;
    return finalise(r, pr, rm);
};
P.toPrecision = function(sd, rm) {
    var str, x = this, Ctor = x.constructor;
    if (sd === void 0) {
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    } else {
        checkInt32(sd, 1, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
        x = finalise(new Ctor(x), sd, rm);
        str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toSignificantDigits = P.toSD = function(sd, rm) {
    var x = this, Ctor = x.constructor;
    if (sd === void 0) {
        sd = Ctor.precision;
        rm = Ctor.rounding;
    } else {
        checkInt32(sd, 1, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
    }
    return finalise(new Ctor(x), sd, rm);
};
P.toString = function() {
    var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.truncated = P.trunc = function() {
    return finalise(new this.constructor(this), this.e + 1, 1);
};
P.valueOf = P.toJSON = function() {
    var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    return x.isNeg() ? "-" + str : str;
};
function digitsToString(d) {
    var i, k, ws, indexOfLastWord = d.length - 1, str = "", w = d[0];
    if (indexOfLastWord > 0) {
        str += w;
        for(i = 1; i < indexOfLastWord; i++){
            ws = d[i] + "";
            k = LOG_BASE - ws.length;
            if (k) str += getZeroString(k);
            str += ws;
        }
        w = d[i];
        ws = w + "";
        k = LOG_BASE - ws.length;
        if (k) str += getZeroString(k);
    } else if (w === 0) {
        return "0";
    }
    for(; w % 10 === 0;)w /= 10;
    return str + w;
}
function checkInt32(i, min2, max2) {
    if (i !== ~~i || i < min2 || i > max2) {
        throw Error(invalidArgument + i);
    }
}
function checkRoundingDigits(d, i, rm, repeating) {
    var di, k, r, rd;
    for(k = d[0]; k >= 10; k /= 10)--i;
    if (--i < 0) {
        i += LOG_BASE;
        di = 0;
    } else {
        di = Math.ceil((i + 1) / LOG_BASE);
        i %= LOG_BASE;
    }
    k = mathpow(10, LOG_BASE - i);
    rd = d[di] % k | 0;
    if (repeating == null) {
        if (i < 3) {
            if (i == 0) rd = rd / 100 | 0;
            else if (i == 1) rd = rd / 10 | 0;
            r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 5e4 || rd == 0;
        } else {
            r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 || (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
        }
    } else {
        if (i < 4) {
            if (i == 0) rd = rd / 1e3 | 0;
            else if (i == 1) rd = rd / 100 | 0;
            else if (i == 2) rd = rd / 10 | 0;
            r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
        } else {
            r = ((repeating || rm < 4) && rd + 1 == k || !repeating && rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 1e3 | 0) == mathpow(10, i - 3) - 1;
        }
    }
    return r;
}
function convertBase(str, baseIn, baseOut) {
    var j, arr = [
        0
    ], arrL, i = 0, strL = str.length;
    for(; i < strL;){
        for(arrL = arr.length; arrL--;)arr[arrL] *= baseIn;
        arr[0] += NUMERALS.indexOf(str.charAt(i++));
        for(j = 0; j < arr.length; j++){
            if (arr[j] > baseOut - 1) {
                if (arr[j + 1] === void 0) arr[j + 1] = 0;
                arr[j + 1] += arr[j] / baseOut | 0;
                arr[j] %= baseOut;
            }
        }
    }
    return arr.reverse();
}
function cosine(Ctor, x) {
    var k, len, y;
    if (x.isZero()) return x;
    len = x.d.length;
    if (len < 32) {
        k = Math.ceil(len / 3);
        y = (1 / tinyPow(4, k)).toString();
    } else {
        k = 16;
        y = "2.3283064365386962890625e-10";
    }
    Ctor.precision += k;
    x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));
    for(var i = k; i--;){
        var cos2x = x.times(x);
        x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
    }
    Ctor.precision -= k;
    return x;
}
var divide = /* @__PURE__ */ function() {
    function multiplyInteger(x, k, base) {
        var temp, carry = 0, i = x.length;
        for(x = x.slice(); i--;){
            temp = x[i] * k + carry;
            x[i] = temp % base | 0;
            carry = temp / base | 0;
        }
        if (carry) x.unshift(carry);
        return x;
    }
    function compare(a, b, aL, bL) {
        var i, r;
        if (aL != bL) {
            r = aL > bL ? 1 : -1;
        } else {
            for(i = r = 0; i < aL; i++){
                if (a[i] != b[i]) {
                    r = a[i] > b[i] ? 1 : -1;
                    break;
                }
            }
        }
        return r;
    }
    function subtract(a, b, aL, base) {
        var i = 0;
        for(; aL--;){
            a[aL] -= i;
            i = a[aL] < b[aL] ? 1 : 0;
            a[aL] = i * base + a[aL] - b[aL];
        }
        for(; !a[0] && a.length > 1;)a.shift();
    }
    return function(x, y, pr, rm, dp, base) {
        var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0, yL, yz, Ctor = x.constructor, sign2 = x.s == y.s ? 1 : -1, xd = x.d, yd = y.d;
        if (!xd || !xd[0] || !yd || !yd[0]) {
            return new Ctor(// Return NaN if either NaN, or both Infinity or 0.
            !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN : // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
            xd && xd[0] == 0 || !yd ? sign2 * 0 : sign2 / 0);
        }
        if (base) {
            logBase = 1;
            e = x.e - y.e;
        } else {
            base = BASE;
            logBase = LOG_BASE;
            e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
        }
        yL = yd.length;
        xL = xd.length;
        q = new Ctor(sign2);
        qd = q.d = [];
        for(i = 0; yd[i] == (xd[i] || 0); i++);
        if (yd[i] > (xd[i] || 0)) e--;
        if (pr == null) {
            sd = pr = Ctor.precision;
            rm = Ctor.rounding;
        } else if (dp) {
            sd = pr + (x.e - y.e) + 1;
        } else {
            sd = pr;
        }
        if (sd < 0) {
            qd.push(1);
            more = true;
        } else {
            sd = sd / logBase + 2 | 0;
            i = 0;
            if (yL == 1) {
                k = 0;
                yd = yd[0];
                sd++;
                for(; (i < xL || k) && sd--; i++){
                    t = k * base + (xd[i] || 0);
                    qd[i] = t / yd | 0;
                    k = t % yd | 0;
                }
                more = k || i < xL;
            } else {
                k = base / (yd[0] + 1) | 0;
                if (k > 1) {
                    yd = multiplyInteger(yd, k, base);
                    xd = multiplyInteger(xd, k, base);
                    yL = yd.length;
                    xL = xd.length;
                }
                xi = yL;
                rem = xd.slice(0, yL);
                remL = rem.length;
                for(; remL < yL;)rem[remL++] = 0;
                yz = yd.slice();
                yz.unshift(0);
                yd0 = yd[0];
                if (yd[1] >= base / 2) ++yd0;
                do {
                    k = 0;
                    cmp = compare(yd, rem, yL, remL);
                    if (cmp < 0) {
                        rem0 = rem[0];
                        if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
                        k = rem0 / yd0 | 0;
                        if (k > 1) {
                            if (k >= base) k = base - 1;
                            prod = multiplyInteger(yd, k, base);
                            prodL = prod.length;
                            remL = rem.length;
                            cmp = compare(prod, rem, prodL, remL);
                            if (cmp == 1) {
                                k--;
                                subtract(prod, yL < prodL ? yz : yd, prodL, base);
                            }
                        } else {
                            if (k == 0) cmp = k = 1;
                            prod = yd.slice();
                        }
                        prodL = prod.length;
                        if (prodL < remL) prod.unshift(0);
                        subtract(rem, prod, remL, base);
                        if (cmp == -1) {
                            remL = rem.length;
                            cmp = compare(yd, rem, yL, remL);
                            if (cmp < 1) {
                                k++;
                                subtract(rem, yL < remL ? yz : yd, remL, base);
                            }
                        }
                        remL = rem.length;
                    } else if (cmp === 0) {
                        k++;
                        rem = [
                            0
                        ];
                    }
                    qd[i++] = k;
                    if (cmp && rem[0]) {
                        rem[remL++] = xd[xi] || 0;
                    } else {
                        rem = [
                            xd[xi]
                        ];
                        remL = 1;
                    }
                }while ((xi++ < xL || rem[0] !== void 0) && sd--)
                more = rem[0] !== void 0;
            }
            if (!qd[0]) qd.shift();
        }
        if (logBase == 1) {
            q.e = e;
            inexact = more;
        } else {
            for(i = 1, k = qd[0]; k >= 10; k /= 10)i++;
            q.e = i + e * logBase - 1;
            finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
        }
        return q;
    };
}();
function finalise(x, sd, rm, isTruncated) {
    var digits, i, j, k, rd, roundUp, w, xd, xdi, Ctor = x.constructor;
    out: if (sd != null) {
        xd = x.d;
        if (!xd) return x;
        for(digits = 1, k = xd[0]; k >= 10; k /= 10)digits++;
        i = sd - digits;
        if (i < 0) {
            i += LOG_BASE;
            j = sd;
            w = xd[xdi = 0];
            rd = w / mathpow(10, digits - j - 1) % 10 | 0;
        } else {
            xdi = Math.ceil((i + 1) / LOG_BASE);
            k = xd.length;
            if (xdi >= k) {
                if (isTruncated) {
                    for(; k++ <= xdi;)xd.push(0);
                    w = rd = 0;
                    digits = 1;
                    i %= LOG_BASE;
                    j = i - LOG_BASE + 1;
                } else {
                    break out;
                }
            } else {
                w = k = xd[xdi];
                for(digits = 1; k >= 10; k /= 10)digits++;
                i %= LOG_BASE;
                j = i - LOG_BASE + digits;
                rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
            }
        }
        isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));
        roundUp = rm < 4 ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
        (i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
        if (sd < 1 || !xd[0]) {
            xd.length = 0;
            if (roundUp) {
                sd -= x.e + 1;
                xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
                x.e = -sd || 0;
            } else {
                xd[0] = x.e = 0;
            }
            return x;
        }
        if (i == 0) {
            xd.length = xdi;
            k = 1;
            xdi--;
        } else {
            xd.length = xdi + 1;
            k = mathpow(10, LOG_BASE - i);
            xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
        }
        if (roundUp) {
            for(;;){
                if (xdi == 0) {
                    for(i = 1, j = xd[0]; j >= 10; j /= 10)i++;
                    j = xd[0] += k;
                    for(k = 1; j >= 10; j /= 10)k++;
                    if (i != k) {
                        x.e++;
                        if (xd[0] == BASE) xd[0] = 1;
                    }
                    break;
                } else {
                    xd[xdi] += k;
                    if (xd[xdi] != BASE) break;
                    xd[xdi--] = 0;
                    k = 1;
                }
            }
        }
        for(i = xd.length; xd[--i] === 0;)xd.pop();
    }
    if (external) {
        if (x.e > Ctor.maxE) {
            x.d = null;
            x.e = NaN;
        } else if (x.e < Ctor.minE) {
            x.e = 0;
            x.d = [
                0
            ];
        }
    }
    return x;
}
function finiteToString(x, isExp, sd) {
    if (!x.isFinite()) return nonFiniteToString(x);
    var k, e = x.e, str = digitsToString(x.d), len = str.length;
    if (isExp) {
        if (sd && (k = sd - len) > 0) {
            str = str.charAt(0) + "." + str.slice(1) + getZeroString(k);
        } else if (len > 1) {
            str = str.charAt(0) + "." + str.slice(1);
        }
        str = str + (x.e < 0 ? "e" : "e+") + x.e;
    } else if (e < 0) {
        str = "0." + getZeroString(-e - 1) + str;
        if (sd && (k = sd - len) > 0) str += getZeroString(k);
    } else if (e >= len) {
        str += getZeroString(e + 1 - len);
        if (sd && (k = sd - e - 1) > 0) str = str + "." + getZeroString(k);
    } else {
        if ((k = e + 1) < len) str = str.slice(0, k) + "." + str.slice(k);
        if (sd && (k = sd - len) > 0) {
            if (e + 1 === len) str += ".";
            str += getZeroString(k);
        }
    }
    return str;
}
function getBase10Exponent(digits, e) {
    var w = digits[0];
    for(e *= LOG_BASE; w >= 10; w /= 10)e++;
    return e;
}
function getLn10(Ctor, sd, pr) {
    if (sd > LN10_PRECISION) {
        external = true;
        if (pr) Ctor.precision = pr;
        throw Error(precisionLimitExceeded);
    }
    return finalise(new Ctor(LN10), sd, 1, true);
}
function getPi(Ctor, sd, rm) {
    if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
    return finalise(new Ctor(PI), sd, rm, true);
}
function getPrecision(digits) {
    var w = digits.length - 1, len = w * LOG_BASE + 1;
    w = digits[w];
    if (w) {
        for(; w % 10 == 0; w /= 10)len--;
        for(w = digits[0]; w >= 10; w /= 10)len++;
    }
    return len;
}
function getZeroString(k) {
    var zs = "";
    for(; k--;)zs += "0";
    return zs;
}
function intPow(Ctor, x, n, pr) {
    var isTruncated, r = new Ctor(1), k = Math.ceil(pr / LOG_BASE + 4);
    external = false;
    for(;;){
        if (n % 2) {
            r = r.times(x);
            if (truncate(r.d, k)) isTruncated = true;
        }
        n = mathfloor(n / 2);
        if (n === 0) {
            n = r.d.length - 1;
            if (isTruncated && r.d[n] === 0) ++r.d[n];
            break;
        }
        x = x.times(x);
        truncate(x.d, k);
    }
    external = true;
    return r;
}
function isOdd(n) {
    return n.d[n.d.length - 1] & 1;
}
function maxOrMin(Ctor, args, n) {
    var k, y, x = new Ctor(args[0]), i = 0;
    for(; ++i < args.length;){
        y = new Ctor(args[i]);
        if (!y.s) {
            x = y;
            break;
        }
        k = x.cmp(y);
        if (k === n || k === 0 && x.s === n) {
            x = y;
        }
    }
    return x;
}
function naturalExponential(x, sd) {
    var denominator, guard, j, pow2, sum2, t, wpr, rep = 0, i = 0, k = 0, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (!x.d || !x.d[0] || x.e > 17) {
        return new Ctor(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
    }
    if (sd == null) {
        external = false;
        wpr = pr;
    } else {
        wpr = sd;
    }
    t = new Ctor(0.03125);
    while(x.e > -2){
        x = x.times(t);
        k += 5;
    }
    guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
    wpr += guard;
    denominator = pow2 = sum2 = new Ctor(1);
    Ctor.precision = wpr;
    for(;;){
        pow2 = finalise(pow2.times(x), wpr, 1);
        denominator = denominator.times(++i);
        t = sum2.plus(divide(pow2, denominator, wpr, 1));
        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
            j = k;
            while(j--)sum2 = finalise(sum2.times(sum2), wpr, 1);
            if (sd == null) {
                if (rep < 3 && checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
                    Ctor.precision = wpr += 10;
                    denominator = pow2 = t = new Ctor(1);
                    i = 0;
                    rep++;
                } else {
                    return finalise(sum2, Ctor.precision = pr, rm, external = true);
                }
            } else {
                Ctor.precision = pr;
                return sum2;
            }
        }
        sum2 = t;
    }
}
function naturalLogarithm(y, sd) {
    var c, c0, denominator, e, numerator, rep, sum2, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
        return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
    }
    if (sd == null) {
        external = false;
        wpr = pr;
    } else {
        wpr = sd;
    }
    Ctor.precision = wpr += guard;
    c = digitsToString(xd);
    c0 = c.charAt(0);
    if (Math.abs(e = x.e) < 15e14) {
        while(c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3){
            x = x.times(y);
            c = digitsToString(x.d);
            c0 = c.charAt(0);
            n++;
        }
        e = x.e;
        if (c0 > 1) {
            x = new Ctor("0." + c);
            e++;
        } else {
            x = new Ctor(c0 + "." + c.slice(1));
        }
    } else {
        t = getLn10(Ctor, wpr + 2, pr).times(e + "");
        x = naturalLogarithm(new Ctor(c0 + "." + c.slice(1)), wpr - guard).plus(t);
        Ctor.precision = pr;
        return sd == null ? finalise(x, pr, rm, external = true) : x;
    }
    x1 = x;
    sum2 = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
    x2 = finalise(x.times(x), wpr, 1);
    denominator = 3;
    for(;;){
        numerator = finalise(numerator.times(x2), wpr, 1);
        t = sum2.plus(divide(numerator, new Ctor(denominator), wpr, 1));
        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
            sum2 = sum2.times(2);
            if (e !== 0) sum2 = sum2.plus(getLn10(Ctor, wpr + 2, pr).times(e + ""));
            sum2 = divide(sum2, new Ctor(n), wpr, 1);
            if (sd == null) {
                if (checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
                    Ctor.precision = wpr += guard;
                    t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
                    x2 = finalise(x.times(x), wpr, 1);
                    denominator = rep = 1;
                } else {
                    return finalise(sum2, Ctor.precision = pr, rm, external = true);
                }
            } else {
                Ctor.precision = pr;
                return sum2;
            }
        }
        sum2 = t;
        denominator += 2;
    }
}
function nonFiniteToString(x) {
    return String(x.s * x.s / 0);
}
function parseDecimal(x, str) {
    var e, i, len;
    if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
    if ((i = str.search(/e/i)) > 0) {
        if (e < 0) e = i;
        e += +str.slice(i + 1);
        str = str.substring(0, i);
    } else if (e < 0) {
        e = str.length;
    }
    for(i = 0; str.charCodeAt(i) === 48; i++);
    for(len = str.length; str.charCodeAt(len - 1) === 48; --len);
    str = str.slice(i, len);
    if (str) {
        len -= i;
        x.e = e = e - i - 1;
        x.d = [];
        i = (e + 1) % LOG_BASE;
        if (e < 0) i += LOG_BASE;
        if (i < len) {
            if (i) x.d.push(+str.slice(0, i));
            for(len -= LOG_BASE; i < len;)x.d.push(+str.slice(i, i += LOG_BASE));
            str = str.slice(i);
            i = LOG_BASE - str.length;
        } else {
            i -= len;
        }
        for(; i--;)str += "0";
        x.d.push(+str);
        if (external) {
            if (x.e > x.constructor.maxE) {
                x.d = null;
                x.e = NaN;
            } else if (x.e < x.constructor.minE) {
                x.e = 0;
                x.d = [
                    0
                ];
            }
        }
    } else {
        x.e = 0;
        x.d = [
            0
        ];
    }
    return x;
}
function parseOther(x, str) {
    var base, Ctor, divisor, i, isFloat, len, p, xd, xe;
    if (str.indexOf("_") > -1) {
        str = str.replace(/(\d)_(?=\d)/g, "$1");
        if (isDecimal.test(str)) return parseDecimal(x, str);
    } else if (str === "Infinity" || str === "NaN") {
        if (!+str) x.s = NaN;
        x.e = NaN;
        x.d = null;
        return x;
    }
    if (isHex.test(str)) {
        base = 16;
        str = str.toLowerCase();
    } else if (isBinary.test(str)) {
        base = 2;
    } else if (isOctal.test(str)) {
        base = 8;
    } else {
        throw Error(invalidArgument + str);
    }
    i = str.search(/p/i);
    if (i > 0) {
        p = +str.slice(i + 1);
        str = str.substring(2, i);
    } else {
        str = str.slice(2);
    }
    i = str.indexOf(".");
    isFloat = i >= 0;
    Ctor = x.constructor;
    if (isFloat) {
        str = str.replace(".", "");
        len = str.length;
        i = len - i;
        divisor = intPow(Ctor, new Ctor(base), i, i * 2);
    }
    xd = convertBase(str, base, BASE);
    xe = xd.length - 1;
    for(i = xe; xd[i] === 0; --i)xd.pop();
    if (i < 0) return new Ctor(x.s * 0);
    x.e = getBase10Exponent(xd, xe);
    x.d = xd;
    external = false;
    if (isFloat) x = divide(x, divisor, len * 4);
    if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
    external = true;
    return x;
}
function sine(Ctor, x) {
    var k, len = x.d.length;
    if (len < 3) {
        return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
    }
    k = 1.4 * Math.sqrt(len);
    k = k > 16 ? 16 : k | 0;
    x = x.times(1 / tinyPow(5, k));
    x = taylorSeries(Ctor, 2, x, x);
    var sin2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
    for(; k--;){
        sin2_x = x.times(x);
        x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
    }
    return x;
}
function taylorSeries(Ctor, n, x, y, isHyperbolic) {
    var j, t, u, x2, i = 1, pr = Ctor.precision, k = Math.ceil(pr / LOG_BASE);
    external = false;
    x2 = x.times(x);
    u = new Ctor(y);
    for(;;){
        t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
        u = isHyperbolic ? y.plus(t) : y.minus(t);
        y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
        t = u.plus(y);
        if (t.d[k] !== void 0) {
            for(j = k; t.d[j] === u.d[j] && j--;);
            if (j == -1) break;
        }
        j = u;
        u = y;
        y = t;
        t = j;
        i++;
    }
    external = true;
    t.d.length = k + 1;
    return t;
}
function tinyPow(b, e) {
    var n = b;
    while(--e)n *= b;
    return n;
}
function toLessThanHalfPi(Ctor, x) {
    var t, isNeg = x.s < 0, pi = getPi(Ctor, Ctor.precision, 1), halfPi = pi.times(0.5);
    x = x.abs();
    if (x.lte(halfPi)) {
        quadrant = isNeg ? 4 : 1;
        return x;
    }
    t = x.divToInt(pi);
    if (t.isZero()) {
        quadrant = isNeg ? 3 : 2;
    } else {
        x = x.minus(t.times(pi));
        if (x.lte(halfPi)) {
            quadrant = isOdd(t) ? isNeg ? 2 : 3 : isNeg ? 4 : 1;
            return x;
        }
        quadrant = isOdd(t) ? isNeg ? 1 : 4 : isNeg ? 3 : 2;
    }
    return x.minus(pi).abs();
}
function toStringBinary(x, baseOut, sd, rm) {
    var base, e, i, k, len, roundUp, str, xd, y, Ctor = x.constructor, isExp = sd !== void 0;
    if (isExp) {
        checkInt32(sd, 1, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
    } else {
        sd = Ctor.precision;
        rm = Ctor.rounding;
    }
    if (!x.isFinite()) {
        str = nonFiniteToString(x);
    } else {
        str = finiteToString(x);
        i = str.indexOf(".");
        if (isExp) {
            base = 2;
            if (baseOut == 16) {
                sd = sd * 4 - 3;
            } else if (baseOut == 8) {
                sd = sd * 3 - 2;
            }
        } else {
            base = baseOut;
        }
        if (i >= 0) {
            str = str.replace(".", "");
            y = new Ctor(1);
            y.e = str.length - i;
            y.d = convertBase(finiteToString(y), 10, base);
            y.e = y.d.length;
        }
        xd = convertBase(str, 10, base);
        e = len = xd.length;
        for(; xd[--len] == 0;)xd.pop();
        if (!xd[0]) {
            str = isExp ? "0p+0" : "0";
        } else {
            if (i < 0) {
                e--;
            } else {
                x = new Ctor(x);
                x.d = xd;
                x.e = e;
                x = divide(x, y, sd, rm, 0, base);
                xd = x.d;
                e = x.e;
                roundUp = inexact;
            }
            i = xd[sd];
            k = base / 2;
            roundUp = roundUp || xd[sd + 1] !== void 0;
            roundUp = rm < 4 ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2)) : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 || rm === (x.s < 0 ? 8 : 7));
            xd.length = sd;
            if (roundUp) {
                for(; ++xd[--sd] > base - 1;){
                    xd[sd] = 0;
                    if (!sd) {
                        ++e;
                        xd.unshift(1);
                    }
                }
            }
            for(len = xd.length; !xd[len - 1]; --len);
            for(i = 0, str = ""; i < len; i++)str += NUMERALS.charAt(xd[i]);
            if (isExp) {
                if (len > 1) {
                    if (baseOut == 16 || baseOut == 8) {
                        i = baseOut == 16 ? 4 : 3;
                        for(--len; len % i; len++)str += "0";
                        xd = convertBase(str, base, baseOut);
                        for(len = xd.length; !xd[len - 1]; --len);
                        for(i = 1, str = "1."; i < len; i++)str += NUMERALS.charAt(xd[i]);
                    } else {
                        str = str.charAt(0) + "." + str.slice(1);
                    }
                }
                str = str + (e < 0 ? "p" : "p+") + e;
            } else if (e < 0) {
                for(; ++e;)str = "0" + str;
                str = "0." + str;
            } else {
                if (++e > len) for(e -= len; e--;)str += "0";
                else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
            }
        }
        str = (baseOut == 16 ? "0x" : baseOut == 2 ? "0b" : baseOut == 8 ? "0o" : "") + str;
    }
    return x.s < 0 ? "-" + str : str;
}
function truncate(arr, len) {
    if (arr.length > len) {
        arr.length = len;
        return true;
    }
}
function abs(x) {
    return new this(x).abs();
}
function acos(x) {
    return new this(x).acos();
}
function acosh(x) {
    return new this(x).acosh();
}
function add(x, y) {
    return new this(x).plus(y);
}
function asin(x) {
    return new this(x).asin();
}
function asinh(x) {
    return new this(x).asinh();
}
function atan(x) {
    return new this(x).atan();
}
function atanh(x) {
    return new this(x).atanh();
}
function atan2(y, x) {
    y = new this(y);
    x = new this(x);
    var r, pr = this.precision, rm = this.rounding, wpr = pr + 4;
    if (!y.s || !x.s) {
        r = new this(NaN);
    } else if (!y.d && !x.d) {
        r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
        r.s = y.s;
    } else if (!x.d || y.isZero()) {
        r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
        r.s = y.s;
    } else if (!y.d || x.isZero()) {
        r = getPi(this, wpr, 1).times(0.5);
        r.s = y.s;
    } else if (x.s < 0) {
        this.precision = wpr;
        this.rounding = 1;
        r = this.atan(divide(y, x, wpr, 1));
        x = getPi(this, wpr, 1);
        this.precision = pr;
        this.rounding = rm;
        r = y.s < 0 ? r.minus(x) : r.plus(x);
    } else {
        r = this.atan(divide(y, x, wpr, 1));
    }
    return r;
}
function cbrt(x) {
    return new this(x).cbrt();
}
function ceil(x) {
    return finalise(x = new this(x), x.e + 1, 2);
}
function clamp(x, min2, max2) {
    return new this(x).clamp(min2, max2);
}
function config(obj) {
    if (!obj || typeof obj !== "object") throw Error(decimalError + "Object expected");
    var i, p, v, useDefaults = obj.defaults === true, ps = [
        "precision",
        1,
        MAX_DIGITS,
        "rounding",
        0,
        8,
        "toExpNeg",
        -EXP_LIMIT,
        0,
        "toExpPos",
        0,
        EXP_LIMIT,
        "maxE",
        0,
        EXP_LIMIT,
        "minE",
        -EXP_LIMIT,
        0,
        "modulo",
        0,
        9
    ];
    for(i = 0; i < ps.length; i += 3){
        if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
        if ((v = obj[p]) !== void 0) {
            if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
            else throw Error(invalidArgument + p + ": " + v);
        }
    }
    if (p = "crypto", useDefaults) this[p] = DEFAULTS[p];
    if ((v = obj[p]) !== void 0) {
        if (v === true || v === false || v === 0 || v === 1) {
            if (v) {
                if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
                    this[p] = true;
                } else {
                    throw Error(cryptoUnavailable);
                }
            } else {
                this[p] = false;
            }
        } else {
            throw Error(invalidArgument + p + ": " + v);
        }
    }
    return this;
}
function cos(x) {
    return new this(x).cos();
}
function cosh(x) {
    return new this(x).cosh();
}
function clone(obj) {
    var i, p, ps;
    function Decimal2(v) {
        var e, i2, t, x = this;
        if (!(x instanceof Decimal2)) return new Decimal2(v);
        x.constructor = Decimal2;
        if (isDecimalInstance(v)) {
            x.s = v.s;
            if (external) {
                if (!v.d || v.e > Decimal2.maxE) {
                    x.e = NaN;
                    x.d = null;
                } else if (v.e < Decimal2.minE) {
                    x.e = 0;
                    x.d = [
                        0
                    ];
                } else {
                    x.e = v.e;
                    x.d = v.d.slice();
                }
            } else {
                x.e = v.e;
                x.d = v.d ? v.d.slice() : v.d;
            }
            return;
        }
        t = typeof v;
        if (t === "number") {
            if (v === 0) {
                x.s = 1 / v < 0 ? -1 : 1;
                x.e = 0;
                x.d = [
                    0
                ];
                return;
            }
            if (v < 0) {
                v = -v;
                x.s = -1;
            } else {
                x.s = 1;
            }
            if (v === ~~v && v < 1e7) {
                for(e = 0, i2 = v; i2 >= 10; i2 /= 10)e++;
                if (external) {
                    if (e > Decimal2.maxE) {
                        x.e = NaN;
                        x.d = null;
                    } else if (e < Decimal2.minE) {
                        x.e = 0;
                        x.d = [
                            0
                        ];
                    } else {
                        x.e = e;
                        x.d = [
                            v
                        ];
                    }
                } else {
                    x.e = e;
                    x.d = [
                        v
                    ];
                }
                return;
            }
            if (v * 0 !== 0) {
                if (!v) x.s = NaN;
                x.e = NaN;
                x.d = null;
                return;
            }
            return parseDecimal(x, v.toString());
        }
        if (t === "string") {
            if ((i2 = v.charCodeAt(0)) === 45) {
                v = v.slice(1);
                x.s = -1;
            } else {
                if (i2 === 43) v = v.slice(1);
                x.s = 1;
            }
            return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
        }
        if (t === "bigint") {
            if (v < 0) {
                v = -v;
                x.s = -1;
            } else {
                x.s = 1;
            }
            return parseDecimal(x, v.toString());
        }
        throw Error(invalidArgument + v);
    }
    Decimal2.prototype = P;
    Decimal2.ROUND_UP = 0;
    Decimal2.ROUND_DOWN = 1;
    Decimal2.ROUND_CEIL = 2;
    Decimal2.ROUND_FLOOR = 3;
    Decimal2.ROUND_HALF_UP = 4;
    Decimal2.ROUND_HALF_DOWN = 5;
    Decimal2.ROUND_HALF_EVEN = 6;
    Decimal2.ROUND_HALF_CEIL = 7;
    Decimal2.ROUND_HALF_FLOOR = 8;
    Decimal2.EUCLID = 9;
    Decimal2.config = Decimal2.set = config;
    Decimal2.clone = clone;
    Decimal2.isDecimal = isDecimalInstance;
    Decimal2.abs = abs;
    Decimal2.acos = acos;
    Decimal2.acosh = acosh;
    Decimal2.add = add;
    Decimal2.asin = asin;
    Decimal2.asinh = asinh;
    Decimal2.atan = atan;
    Decimal2.atanh = atanh;
    Decimal2.atan2 = atan2;
    Decimal2.cbrt = cbrt;
    Decimal2.ceil = ceil;
    Decimal2.clamp = clamp;
    Decimal2.cos = cos;
    Decimal2.cosh = cosh;
    Decimal2.div = div;
    Decimal2.exp = exp;
    Decimal2.floor = floor;
    Decimal2.hypot = hypot;
    Decimal2.ln = ln;
    Decimal2.log = log;
    Decimal2.log10 = log10;
    Decimal2.log2 = log2;
    Decimal2.max = max;
    Decimal2.min = min;
    Decimal2.mod = mod;
    Decimal2.mul = mul;
    Decimal2.pow = pow;
    Decimal2.random = random;
    Decimal2.round = round;
    Decimal2.sign = sign;
    Decimal2.sin = sin;
    Decimal2.sinh = sinh;
    Decimal2.sqrt = sqrt;
    Decimal2.sub = sub;
    Decimal2.sum = sum;
    Decimal2.tan = tan;
    Decimal2.tanh = tanh;
    Decimal2.trunc = trunc;
    if (obj === void 0) obj = {};
    if (obj) {
        if (obj.defaults !== true) {
            ps = [
                "precision",
                "rounding",
                "toExpNeg",
                "toExpPos",
                "maxE",
                "minE",
                "modulo",
                "crypto"
            ];
            for(i = 0; i < ps.length;)if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
        }
    }
    Decimal2.config(obj);
    return Decimal2;
}
function div(x, y) {
    return new this(x).div(y);
}
function exp(x) {
    return new this(x).exp();
}
function floor(x) {
    return finalise(x = new this(x), x.e + 1, 3);
}
function hypot() {
    var i, n, t = new this(0);
    external = false;
    for(i = 0; i < arguments.length;){
        n = new this(arguments[i++]);
        if (!n.d) {
            if (n.s) {
                external = true;
                return new this(1 / 0);
            }
            t = n;
        } else if (t.d) {
            t = t.plus(n.times(n));
        }
    }
    external = true;
    return t.sqrt();
}
function isDecimalInstance(obj) {
    return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
}
function ln(x) {
    return new this(x).ln();
}
function log(x, y) {
    return new this(x).log(y);
}
function log2(x) {
    return new this(x).log(2);
}
function log10(x) {
    return new this(x).log(10);
}
function max() {
    return maxOrMin(this, arguments, -1);
}
function min() {
    return maxOrMin(this, arguments, 1);
}
function mod(x, y) {
    return new this(x).mod(y);
}
function mul(x, y) {
    return new this(x).mul(y);
}
function pow(x, y) {
    return new this(x).pow(y);
}
function random(sd) {
    var d, e, k, n, i = 0, r = new this(1), rd = [];
    if (sd === void 0) sd = this.precision;
    else checkInt32(sd, 1, MAX_DIGITS);
    k = Math.ceil(sd / LOG_BASE);
    if (!this.crypto) {
        for(; i < k;)rd[i++] = Math.random() * 1e7 | 0;
    } else if (crypto.getRandomValues) {
        d = crypto.getRandomValues(new Uint32Array(k));
        for(; i < k;){
            n = d[i];
            if (n >= 429e7) {
                d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
            } else {
                rd[i++] = n % 1e7;
            }
        }
    } else if (crypto.randomBytes) {
        d = crypto.randomBytes(k *= 4);
        for(; i < k;){
            n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 127) << 24);
            if (n >= 214e7) {
                crypto.randomBytes(4).copy(d, i);
            } else {
                rd.push(n % 1e7);
                i += 4;
            }
        }
        i = k / 4;
    } else {
        throw Error(cryptoUnavailable);
    }
    k = rd[--i];
    sd %= LOG_BASE;
    if (k && sd) {
        n = mathpow(10, LOG_BASE - sd);
        rd[i] = (k / n | 0) * n;
    }
    for(; rd[i] === 0; i--)rd.pop();
    if (i < 0) {
        e = 0;
        rd = [
            0
        ];
    } else {
        e = -1;
        for(; rd[0] === 0; e -= LOG_BASE)rd.shift();
        for(k = 1, n = rd[0]; n >= 10; n /= 10)k++;
        if (k < LOG_BASE) e -= LOG_BASE - k;
    }
    r.e = e;
    r.d = rd;
    return r;
}
function round(x) {
    return finalise(x = new this(x), x.e + 1, this.rounding);
}
function sign(x) {
    x = new this(x);
    return x.d ? x.d[0] ? x.s : 0 * x.s : x.s || NaN;
}
function sin(x) {
    return new this(x).sin();
}
function sinh(x) {
    return new this(x).sinh();
}
function sqrt(x) {
    return new this(x).sqrt();
}
function sub(x, y) {
    return new this(x).sub(y);
}
function sum() {
    var i = 0, args = arguments, x = new this(args[i]);
    external = false;
    for(; x.s && ++i < args.length;)x = x.plus(args[i]);
    external = true;
    return finalise(x, this.precision, this.rounding);
}
function tan(x) {
    return new this(x).tan();
}
function tanh(x) {
    return new this(x).tanh();
}
function trunc(x) {
    return finalise(x = new this(x), x.e + 1, 1);
}
P[Symbol.for("nodejs.util.inspect.custom")] = P.toString;
P[Symbol.toStringTag] = "Decimal";
var Decimal = P.constructor = clone(DEFAULTS);
LN10 = new Decimal(LN10);
PI = new Decimal(PI);
// ../../node_modules/.pnpm/sql-template-tag@5.2.1/node_modules/sql-template-tag/dist/index.js
var Sql = class _Sql {
    constructor(rawStrings, rawValues){
        if (rawStrings.length - 1 !== rawValues.length) {
            if (rawStrings.length === 0) {
                throw new TypeError("Expected at least 1 string");
            }
            throw new TypeError(`Expected ${rawStrings.length} strings to have ${rawStrings.length - 1} values`);
        }
        const valuesLength = rawValues.reduce((len, value)=>len + (value instanceof _Sql ? value.values.length : 1), 0);
        this.values = new Array(valuesLength);
        this.strings = new Array(valuesLength + 1);
        this.strings[0] = rawStrings[0];
        let i = 0, pos = 0;
        while(i < rawValues.length){
            const child = rawValues[i++];
            const rawString = rawStrings[i];
            if (child instanceof _Sql) {
                this.strings[pos] += child.strings[0];
                let childIndex = 0;
                while(childIndex < child.values.length){
                    this.values[pos++] = child.values[childIndex++];
                    this.strings[pos] = child.strings[childIndex];
                }
                this.strings[pos] += rawString;
            } else {
                this.values[pos++] = child;
                this.strings[pos] = rawString;
            }
        }
    }
    get sql() {
        const len = this.strings.length;
        let i = 1;
        let value = this.strings[0];
        while(i < len)value += `?${this.strings[i++]}`;
        return value;
    }
    get statement() {
        const len = this.strings.length;
        let i = 1;
        let value = this.strings[0];
        while(i < len)value += `:${i}${this.strings[i++]}`;
        return value;
    }
    get text() {
        const len = this.strings.length;
        let i = 1;
        let value = this.strings[0];
        while(i < len)value += `$${i}${this.strings[i++]}`;
        return value;
    }
    inspect() {
        return {
            sql: this.sql,
            statement: this.statement,
            text: this.text,
            values: this.values
        };
    }
};
function join(values, separator = ",", prefix = "", suffix = "") {
    if (values.length === 0) {
        throw new TypeError("Expected `join([])` to be called with an array of multiple elements, but got an empty array");
    }
    return new Sql([
        prefix,
        ...Array(values.length - 1).fill(separator),
        suffix
    ], values);
}
function raw(value) {
    return new Sql([
        value
    ], []);
}
var empty = raw("");
function sql(strings, ...values) {
    return new Sql(strings, values);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    AnyNull,
    AnyNullClass,
    DbNull,
    DbNullClass,
    Decimal,
    JsonNull,
    JsonNullClass,
    NullTypes,
    ObjectEnumValue,
    PrismaClientInitializationError,
    PrismaClientKnownRequestError,
    PrismaClientRustError,
    PrismaClientRustPanicError,
    PrismaClientUnknownRequestError,
    PrismaClientValidationError,
    Sql,
    empty,
    hasBatchIndex,
    isAnyNull,
    isDbNull,
    isJsonNull,
    join,
    raw,
    sql
}); /*! Bundled license information:

decimal.js/decimal.mjs:
  (*!
   *  decimal.js v10.5.0
   *  An arbitrary-precision Decimal type for JavaScript.
   *  https://github.com/MikeMcl/decimal.js
   *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
   *  MIT Licence
   *)
*/ 
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/debug/dist/index.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Debug",
    ()=>Debug,
    "clearLogs",
    ()=>clearLogs,
    "default",
    ()=>index_default,
    "getLogs",
    ()=>getLogs
]);
var __defProp = Object.defineProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
// ../../node_modules/.pnpm/kleur@4.1.5/node_modules/kleur/colors.mjs
var colors_exports = {};
__export(colors_exports, {
    $: ()=>$,
    bgBlack: ()=>bgBlack,
    bgBlue: ()=>bgBlue,
    bgCyan: ()=>bgCyan,
    bgGreen: ()=>bgGreen,
    bgMagenta: ()=>bgMagenta,
    bgRed: ()=>bgRed,
    bgWhite: ()=>bgWhite,
    bgYellow: ()=>bgYellow,
    black: ()=>black,
    blue: ()=>blue,
    bold: ()=>bold,
    cyan: ()=>cyan,
    dim: ()=>dim,
    gray: ()=>gray,
    green: ()=>green,
    grey: ()=>grey,
    hidden: ()=>hidden,
    inverse: ()=>inverse,
    italic: ()=>italic,
    magenta: ()=>magenta,
    red: ()=>red,
    reset: ()=>reset,
    strikethrough: ()=>strikethrough,
    underline: ()=>underline,
    white: ()=>white,
    yellow: ()=>yellow
});
var FORCE_COLOR;
var NODE_DISABLE_COLORS;
var NO_COLOR;
var TERM;
var isTTY = true;
if (typeof process !== "undefined") {
    ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
    isTTY = process.stdout && process.stdout.isTTY;
}
var $ = {
    enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY)
};
function init(x, y) {
    let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
    let open = `\x1B[${x}m`, close = `\x1B[${y}m`;
    return function(txt) {
        if (!$.enabled || txt == null) return txt;
        return open + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) + close;
    };
}
var reset = init(0, 0);
var bold = init(1, 22);
var dim = init(2, 22);
var italic = init(3, 23);
var underline = init(4, 24);
var inverse = init(7, 27);
var hidden = init(8, 28);
var strikethrough = init(9, 29);
var black = init(30, 39);
var red = init(31, 39);
var green = init(32, 39);
var yellow = init(33, 39);
var blue = init(34, 39);
var magenta = init(35, 39);
var cyan = init(36, 39);
var white = init(37, 39);
var gray = init(90, 39);
var grey = init(90, 39);
var bgBlack = init(40, 49);
var bgRed = init(41, 49);
var bgGreen = init(42, 49);
var bgYellow = init(43, 49);
var bgBlue = init(44, 49);
var bgMagenta = init(45, 49);
var bgCyan = init(46, 49);
var bgWhite = init(47, 49);
// src/index.ts
var MAX_ARGS_HISTORY = 100;
var COLORS = [
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "red"
];
var argsHistory = [];
var lastTimestamp = Date.now();
var lastColor = 0;
var processEnv = typeof process !== "undefined" ? process.env : {};
globalThis.DEBUG ??= processEnv.DEBUG ?? "";
globalThis.DEBUG_COLORS ??= processEnv.DEBUG_COLORS ? processEnv.DEBUG_COLORS === "true" : true;
var topProps = {
    enable (namespace) {
        if (typeof namespace === "string") {
            globalThis.DEBUG = namespace;
        }
    },
    disable () {
        const prev = globalThis.DEBUG;
        globalThis.DEBUG = "";
        return prev;
    },
    // this is the core logic to check if logging should happen or not
    enabled (namespace) {
        const listenedNamespaces = globalThis.DEBUG.split(",").map((s)=>{
            return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        });
        const isListened = listenedNamespaces.some((listenedNamespace)=>{
            if (listenedNamespace === "" || listenedNamespace[0] === "-") return false;
            return namespace.match(RegExp(listenedNamespace.split("*").join(".*") + "$"));
        });
        const isExcluded = listenedNamespaces.some((listenedNamespace)=>{
            if (listenedNamespace === "" || listenedNamespace[0] !== "-") return false;
            return namespace.match(RegExp(listenedNamespace.slice(1).split("*").join(".*") + "$"));
        });
        return isListened && !isExcluded;
    },
    log: (...args)=>{
        const [namespace, format, ...rest] = args;
        const logWithFormatting = console.warn ?? console.log;
        logWithFormatting(`${namespace} ${format}`, ...rest);
    },
    formatters: {}
};
function debugCreate(namespace) {
    const instanceProps = {
        color: COLORS[lastColor++ % COLORS.length],
        enabled: topProps.enabled(namespace),
        namespace,
        log: topProps.log,
        extend: ()=>{}
    };
    const debugCall = (...args)=>{
        const { enabled, namespace: namespace2, color, log } = instanceProps;
        if (args.length !== 0) {
            argsHistory.push([
                namespace2,
                ...args
            ]);
        }
        if (argsHistory.length > MAX_ARGS_HISTORY) {
            argsHistory.shift();
        }
        if (topProps.enabled(namespace2) || enabled) {
            const stringArgs = args.map((arg)=>{
                if (typeof arg === "string") {
                    return arg;
                }
                return safeStringify(arg);
            });
            const ms = `+${Date.now() - lastTimestamp}ms`;
            lastTimestamp = Date.now();
            if (globalThis.DEBUG_COLORS) {
                log(colors_exports[color](bold(namespace2)), ...stringArgs, colors_exports[color](ms));
            } else {
                log(namespace2, ...stringArgs, ms);
            }
        }
    };
    return new Proxy(debugCall, {
        get: (_, prop)=>instanceProps[prop],
        set: (_, prop, value)=>instanceProps[prop] = value
    });
}
var Debug = new Proxy(debugCreate, {
    get: (_, prop)=>topProps[prop],
    set: (_, prop, value)=>topProps[prop] = value
});
function safeStringify(value, indent = 2) {
    const cache = /* @__PURE__ */ new Set();
    return JSON.stringify(value, (key, value2)=>{
        if (typeof value2 === "object" && value2 !== null) {
            if (cache.has(value2)) {
                return `[Circular *]`;
            }
            cache.add(value2);
        } else if (typeof value2 === "bigint") {
            return value2.toString();
        }
        return value2;
    }, indent);
}
function getLogs(numChars = 7500) {
    const logs = argsHistory.map(([namespace, ...args])=>{
        return `${namespace} ${args.map((arg)=>{
            if (typeof arg === "string") {
                return arg;
            } else {
                return JSON.stringify(arg);
            }
        }).join(" ")}`;
    }).join("\n");
    if (logs.length < numChars) {
        return logs;
    }
    return logs.slice(-numChars);
}
function clearLogs() {
    argsHistory.length = 0;
}
var index_default = Debug;
;
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/driver-adapter-utils/dist/index.mjs [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColumnTypeEnum",
    ()=>ColumnTypeEnum,
    "DriverAdapterError",
    ()=>DriverAdapterError,
    "bindAdapter",
    ()=>bindAdapter,
    "bindMigrationAwareSqlAdapterFactory",
    ()=>bindMigrationAwareSqlAdapterFactory,
    "bindSqlAdapterFactory",
    ()=>bindSqlAdapterFactory,
    "err",
    ()=>err,
    "isDriverAdapterError",
    ()=>isDriverAdapterError,
    "mockAdapter",
    ()=>mockAdapter,
    "mockAdapterErrors",
    ()=>mockAdapterErrors,
    "mockAdapterFactory",
    ()=>mockAdapterFactory,
    "mockMigrationAwareAdapterFactory",
    ()=>mockMigrationAwareAdapterFactory,
    "ok",
    ()=>ok
]);
// src/debug.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/debug/dist/index.mjs [app-rsc] (ecmascript)");
;
// src/error.ts
var DriverAdapterError = class extends Error {
    name = "DriverAdapterError";
    cause;
    constructor(payload){
        super(typeof payload["message"] === "string" ? payload["message"] : payload.kind);
        this.cause = payload;
    }
};
function isDriverAdapterError(error) {
    return error["name"] === "DriverAdapterError" && typeof error["cause"] === "object";
}
// src/result.ts
function ok(value) {
    return {
        ok: true,
        value,
        map (fn) {
            return ok(fn(value));
        },
        flatMap (fn) {
            return fn(value);
        }
    };
}
function err(error) {
    return {
        ok: false,
        error,
        map () {
            return err(error);
        },
        flatMap () {
            return err(error);
        }
    };
}
// src/binder.ts
var debug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Debug"])("driver-adapter-utils");
var ErrorRegistryInternal = class {
    registeredErrors = [];
    consumeError(id) {
        return this.registeredErrors[id];
    }
    registerNewError(error) {
        let i = 0;
        while(this.registeredErrors[i] !== void 0){
            i++;
        }
        this.registeredErrors[i] = {
            error
        };
        return i;
    }
};
function copySymbolsFromSource(source, target) {
    const symbols = Object.getOwnPropertySymbols(source);
    const symbolObject = Object.fromEntries(symbols.map((symbol)=>[
            symbol,
            true
        ]));
    Object.assign(target, symbolObject);
}
var bindMigrationAwareSqlAdapterFactory = (adapterFactory)=>{
    const errorRegistry = new ErrorRegistryInternal();
    const boundFactory = {
        adapterName: adapterFactory.adapterName,
        provider: adapterFactory.provider,
        errorRegistry,
        connect: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapterFactory.connect.bind(adapterFactory))(...args);
            return ctx.map((ctx2)=>bindAdapter(ctx2, errorRegistry));
        },
        connectToShadowDb: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapterFactory.connectToShadowDb.bind(adapterFactory))(...args);
            return ctx.map((ctx2)=>bindAdapter(ctx2, errorRegistry));
        }
    };
    copySymbolsFromSource(adapterFactory, boundFactory);
    return boundFactory;
};
var bindSqlAdapterFactory = (adapterFactory)=>{
    const errorRegistry = new ErrorRegistryInternal();
    const boundFactory = {
        adapterName: adapterFactory.adapterName,
        provider: adapterFactory.provider,
        errorRegistry,
        connect: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapterFactory.connect.bind(adapterFactory))(...args);
            return ctx.map((ctx2)=>bindAdapter(ctx2, errorRegistry));
        }
    };
    copySymbolsFromSource(adapterFactory, boundFactory);
    return boundFactory;
};
var bindAdapter = (adapter, errorRegistry = new ErrorRegistryInternal())=>{
    const boundAdapter = {
        adapterName: adapter.adapterName,
        errorRegistry,
        queryRaw: wrapAsync(errorRegistry, adapter.queryRaw.bind(adapter)),
        executeRaw: wrapAsync(errorRegistry, adapter.executeRaw.bind(adapter)),
        executeScript: wrapAsync(errorRegistry, adapter.executeScript.bind(adapter)),
        dispose: wrapAsync(errorRegistry, adapter.dispose.bind(adapter)),
        provider: adapter.provider,
        startTransaction: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapter.startTransaction.bind(adapter))(...args);
            return ctx.map((ctx2)=>bindTransaction(errorRegistry, ctx2));
        }
    };
    if (adapter.getConnectionInfo) {
        boundAdapter.getConnectionInfo = wrapSync(errorRegistry, adapter.getConnectionInfo.bind(adapter));
    }
    return boundAdapter;
};
var bindTransaction = (errorRegistry, transaction)=>{
    return {
        adapterName: transaction.adapterName,
        provider: transaction.provider,
        options: transaction.options,
        queryRaw: wrapAsync(errorRegistry, transaction.queryRaw.bind(transaction)),
        executeRaw: wrapAsync(errorRegistry, transaction.executeRaw.bind(transaction)),
        commit: wrapAsync(errorRegistry, transaction.commit.bind(transaction)),
        rollback: wrapAsync(errorRegistry, transaction.rollback.bind(transaction))
    };
};
function wrapAsync(registry, fn) {
    return async (...args)=>{
        try {
            return ok(await fn(...args));
        } catch (error) {
            debug("[error@wrapAsync]", error);
            if (isDriverAdapterError(error)) {
                return err(error.cause);
            }
            const id = registry.registerNewError(error);
            return err({
                kind: "GenericJs",
                id
            });
        }
    };
}
function wrapSync(registry, fn) {
    return (...args)=>{
        try {
            return ok(fn(...args));
        } catch (error) {
            debug("[error@wrapSync]", error);
            if (isDriverAdapterError(error)) {
                return err(error.cause);
            }
            const id = registry.registerNewError(error);
            return err({
                kind: "GenericJs",
                id
            });
        }
    };
}
// src/const.ts
var ColumnTypeEnum = {
    // Scalars
    Int32: 0,
    Int64: 1,
    Float: 2,
    Double: 3,
    Numeric: 4,
    Boolean: 5,
    Character: 6,
    Text: 7,
    Date: 8,
    Time: 9,
    DateTime: 10,
    Json: 11,
    Enum: 12,
    Bytes: 13,
    Set: 14,
    Uuid: 15,
    // Arrays
    Int32Array: 64,
    Int64Array: 65,
    FloatArray: 66,
    DoubleArray: 67,
    NumericArray: 68,
    BooleanArray: 69,
    CharacterArray: 70,
    TextArray: 71,
    DateArray: 72,
    TimeArray: 73,
    DateTimeArray: 74,
    JsonArray: 75,
    EnumArray: 76,
    BytesArray: 77,
    UuidArray: 78,
    // Custom
    UnknownNumber: 128
};
// src/mock.ts
var mockAdapterErrors = {
    queryRaw: new Error("Not implemented: queryRaw"),
    executeRaw: new Error("Not implemented: executeRaw"),
    startTransaction: new Error("Not implemented: startTransaction"),
    executeScript: new Error("Not implemented: executeScript"),
    dispose: new Error("Not implemented: dispose")
};
function mockAdapter(provider) {
    return {
        provider,
        adapterName: "@prisma/adapter-mock",
        queryRaw: ()=>Promise.reject(mockAdapterErrors.queryRaw),
        executeRaw: ()=>Promise.reject(mockAdapterErrors.executeRaw),
        startTransaction: ()=>Promise.reject(mockAdapterErrors.startTransaction),
        executeScript: ()=>Promise.reject(mockAdapterErrors.executeScript),
        dispose: ()=>Promise.reject(mockAdapterErrors.dispose),
        [Symbol.for("adapter.mockAdapter")]: true
    };
}
function mockAdapterFactory(provider) {
    return {
        provider,
        adapterName: "@prisma/adapter-mock",
        connect: ()=>Promise.resolve(mockAdapter(provider)),
        [Symbol.for("adapter.mockAdapterFactory")]: true
    };
}
function mockMigrationAwareAdapterFactory(provider) {
    return {
        provider,
        adapterName: "@prisma/adapter-mock",
        connect: ()=>Promise.resolve(mockAdapter(provider)),
        connectToShadowDb: ()=>Promise.resolve(mockAdapter(provider)),
        [Symbol.for("adapter.mockMigrationAwareAdapterFactory")]: true
    };
}
;
}),
"[externals]/pg [external] (pg, esm_import, [project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/pg)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("pg-eea8d443c17942f6");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/adapter-pg/node_modules/postgres-array/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const BACKSLASH = '\\';
const DQUOT = '"';
const LBRACE = '{';
const RBRACE = '}';
const LBRACKET = '[';
const EQUALS = '=';
const COMMA = ',';
/** When the raw value is this, it means a literal `null` */ const NULL_STRING = 'NULL';
/**
 * Parses an array according to
 * https://www.postgresql.org/docs/17/arrays.html#ARRAYS-IO
 *
 * Trusts the data (mostly), so only hook up to trusted Postgres servers.
 */ function makeParseArrayWithTransform(transform) {
    const haveTransform = transform != null;
    return function parseArray(str) {
        const rbraceIndex = str.length - 1;
        if (rbraceIndex === 1) {
            return [];
        }
        if (str[rbraceIndex] !== RBRACE) {
            throw new Error('Invalid array text - must end with }');
        }
        // If starts with `[`, it is specifying the index boundas. Skip past first `=`.
        let position = 0;
        if (str[position] === LBRACKET) {
            position = str.indexOf(EQUALS) + 1;
        }
        if (str[position++] !== LBRACE) {
            throw new Error('Invalid array text - must start with {');
        }
        const output = [];
        let current = output;
        const stack = [];
        let currentStringStart = position;
        let currentString = '';
        let expectValue = true;
        for(; position < rbraceIndex; ++position){
            let char = str[position];
            // > The array output routine will put double quotes around element values if
            // > they are empty strings, contain curly braces, delimiter characters, double
            // > quotes, backslashes, or white space, or match the word NULL. Double quotes
            // > and backslashes embedded in element values will be backslash-escaped.
            if (char === DQUOT) {
                // It's escaped
                currentStringStart = ++position;
                let dquot = str.indexOf(DQUOT, currentStringStart);
                let backSlash = str.indexOf(BACKSLASH, currentStringStart);
                while(backSlash !== -1 && backSlash < dquot){
                    position = backSlash;
                    const part = str.slice(currentStringStart, position);
                    currentString += part;
                    currentStringStart = ++position;
                    if (dquot === position++) {
                        // This was an escaped doublequote; find the next one!
                        dquot = str.indexOf(DQUOT, position);
                    }
                    // Either way, find the next backslash
                    backSlash = str.indexOf(BACKSLASH, position);
                }
                position = dquot;
                const part = str.slice(currentStringStart, position);
                currentString += part;
                current.push(haveTransform ? transform(currentString) : currentString);
                currentString = '';
                expectValue = false;
            } else if (char === LBRACE) {
                const newArray = [];
                current.push(newArray);
                stack.push(current);
                current = newArray;
                currentStringStart = position + 1;
                expectValue = true;
            } else if (char === COMMA) {
                expectValue = true;
            } else if (char === RBRACE) {
                expectValue = false;
                const arr = stack.pop();
                if (arr === undefined) {
                    throw new Error("Invalid array text - too many '}'");
                }
                current = arr;
            } else if (expectValue) {
                currentStringStart = position;
                while((char = str[position]) !== COMMA && char !== RBRACE && position < rbraceIndex){
                    ++position;
                }
                const part = str.slice(currentStringStart, position--);
                current.push(part === NULL_STRING ? null : haveTransform ? transform(part) : part);
                expectValue = false;
            } else {
                throw new Error('Was expecting delimeter');
            }
        }
        return output;
    };
}
const parseArray = makeParseArrayWithTransform();
exports.parse = (source, transform)=>transform != null ? makeParseArrayWithTransform(transform)(source) : parseArray(source);
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/adapter-pg/dist/index.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "PrismaPg",
    ()=>PrismaPgAdapterFactory
]);
// src/pg.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/debug/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/driver-adapter-utils/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import, [project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/pg)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$node_modules$2f$postgres$2d$array$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/@prisma/adapter-pg/node_modules/postgres-array/index.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
// package.json
var name = "@prisma/adapter-pg";
// src/constants.ts
var FIRST_NORMAL_OBJECT_ID = 16384;
;
;
;
var { types } = __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__["default"];
var { builtins: ScalarColumnType, getTypeParser } = types;
var AdditionalScalarColumnType = {
    NAME: 19
};
var ArrayColumnType = {
    BIT_ARRAY: 1561,
    BOOL_ARRAY: 1e3,
    BYTEA_ARRAY: 1001,
    BPCHAR_ARRAY: 1014,
    CHAR_ARRAY: 1002,
    CIDR_ARRAY: 651,
    DATE_ARRAY: 1182,
    FLOAT4_ARRAY: 1021,
    FLOAT8_ARRAY: 1022,
    INET_ARRAY: 1041,
    INT2_ARRAY: 1005,
    INT4_ARRAY: 1007,
    INT8_ARRAY: 1016,
    JSONB_ARRAY: 3807,
    JSON_ARRAY: 199,
    MONEY_ARRAY: 791,
    NUMERIC_ARRAY: 1231,
    OID_ARRAY: 1028,
    TEXT_ARRAY: 1009,
    TIMESTAMP_ARRAY: 1115,
    TIMESTAMPTZ_ARRAY: 1185,
    TIME_ARRAY: 1183,
    UUID_ARRAY: 2951,
    VARBIT_ARRAY: 1563,
    VARCHAR_ARRAY: 1015,
    XML_ARRAY: 143
};
var UnsupportedNativeDataType = class _UnsupportedNativeDataType extends Error {
    // map of type codes to type names
    static typeNames = {
        16: "bool",
        17: "bytea",
        18: "char",
        19: "name",
        20: "int8",
        21: "int2",
        22: "int2vector",
        23: "int4",
        24: "regproc",
        25: "text",
        26: "oid",
        27: "tid",
        28: "xid",
        29: "cid",
        30: "oidvector",
        32: "pg_ddl_command",
        71: "pg_type",
        75: "pg_attribute",
        81: "pg_proc",
        83: "pg_class",
        114: "json",
        142: "xml",
        194: "pg_node_tree",
        269: "table_am_handler",
        325: "index_am_handler",
        600: "point",
        601: "lseg",
        602: "path",
        603: "box",
        604: "polygon",
        628: "line",
        650: "cidr",
        700: "float4",
        701: "float8",
        705: "unknown",
        718: "circle",
        774: "macaddr8",
        790: "money",
        829: "macaddr",
        869: "inet",
        1033: "aclitem",
        1042: "bpchar",
        1043: "varchar",
        1082: "date",
        1083: "time",
        1114: "timestamp",
        1184: "timestamptz",
        1186: "interval",
        1266: "timetz",
        1560: "bit",
        1562: "varbit",
        1700: "numeric",
        1790: "refcursor",
        2202: "regprocedure",
        2203: "regoper",
        2204: "regoperator",
        2205: "regclass",
        2206: "regtype",
        2249: "record",
        2275: "cstring",
        2276: "any",
        2277: "anyarray",
        2278: "void",
        2279: "trigger",
        2280: "language_handler",
        2281: "internal",
        2283: "anyelement",
        2287: "_record",
        2776: "anynonarray",
        2950: "uuid",
        2970: "txid_snapshot",
        3115: "fdw_handler",
        3220: "pg_lsn",
        3310: "tsm_handler",
        3361: "pg_ndistinct",
        3402: "pg_dependencies",
        3500: "anyenum",
        3614: "tsvector",
        3615: "tsquery",
        3642: "gtsvector",
        3734: "regconfig",
        3769: "regdictionary",
        3802: "jsonb",
        3831: "anyrange",
        3838: "event_trigger",
        3904: "int4range",
        3906: "numrange",
        3908: "tsrange",
        3910: "tstzrange",
        3912: "daterange",
        3926: "int8range",
        4072: "jsonpath",
        4089: "regnamespace",
        4096: "regrole",
        4191: "regcollation",
        4451: "int4multirange",
        4532: "nummultirange",
        4533: "tsmultirange",
        4534: "tstzmultirange",
        4535: "datemultirange",
        4536: "int8multirange",
        4537: "anymultirange",
        4538: "anycompatiblemultirange",
        4600: "pg_brin_bloom_summary",
        4601: "pg_brin_minmax_multi_summary",
        5017: "pg_mcv_list",
        5038: "pg_snapshot",
        5069: "xid8",
        5077: "anycompatible",
        5078: "anycompatiblearray",
        5079: "anycompatiblenonarray",
        5080: "anycompatiblerange"
    };
    type;
    constructor(code){
        super();
        this.type = _UnsupportedNativeDataType.typeNames[code] || "Unknown";
        this.message = `Unsupported column type ${this.type}`;
    }
};
function fieldToColumnType(fieldTypeId) {
    switch(fieldTypeId){
        case ScalarColumnType.INT2:
        case ScalarColumnType.INT4:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int32;
        case ScalarColumnType.INT8:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int64;
        case ScalarColumnType.FLOAT4:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Float;
        case ScalarColumnType.FLOAT8:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Double;
        case ScalarColumnType.BOOL:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Boolean;
        case ScalarColumnType.DATE:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Date;
        case ScalarColumnType.TIME:
        case ScalarColumnType.TIMETZ:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Time;
        case ScalarColumnType.TIMESTAMP:
        case ScalarColumnType.TIMESTAMPTZ:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateTime;
        case ScalarColumnType.NUMERIC:
        case ScalarColumnType.MONEY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Numeric;
        case ScalarColumnType.JSON:
        case ScalarColumnType.JSONB:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Json;
        case ScalarColumnType.UUID:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Uuid;
        case ScalarColumnType.OID:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int64;
        case ScalarColumnType.BPCHAR:
        case ScalarColumnType.TEXT:
        case ScalarColumnType.VARCHAR:
        case ScalarColumnType.BIT:
        case ScalarColumnType.VARBIT:
        case ScalarColumnType.INET:
        case ScalarColumnType.CIDR:
        case ScalarColumnType.XML:
        case AdditionalScalarColumnType.NAME:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Text;
        case ScalarColumnType.BYTEA:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Bytes;
        case ArrayColumnType.INT2_ARRAY:
        case ArrayColumnType.INT4_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int32Array;
        case ArrayColumnType.FLOAT4_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].FloatArray;
        case ArrayColumnType.FLOAT8_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DoubleArray;
        case ArrayColumnType.NUMERIC_ARRAY:
        case ArrayColumnType.MONEY_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].NumericArray;
        case ArrayColumnType.BOOL_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].BooleanArray;
        case ArrayColumnType.CHAR_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].CharacterArray;
        case ArrayColumnType.BPCHAR_ARRAY:
        case ArrayColumnType.TEXT_ARRAY:
        case ArrayColumnType.VARCHAR_ARRAY:
        case ArrayColumnType.VARBIT_ARRAY:
        case ArrayColumnType.BIT_ARRAY:
        case ArrayColumnType.INET_ARRAY:
        case ArrayColumnType.CIDR_ARRAY:
        case ArrayColumnType.XML_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].TextArray;
        case ArrayColumnType.DATE_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateArray;
        case ArrayColumnType.TIME_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].TimeArray;
        case ArrayColumnType.TIMESTAMP_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateTimeArray;
        case ArrayColumnType.TIMESTAMPTZ_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateTimeArray;
        case ArrayColumnType.JSON_ARRAY:
        case ArrayColumnType.JSONB_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].JsonArray;
        case ArrayColumnType.BYTEA_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].BytesArray;
        case ArrayColumnType.UUID_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].UuidArray;
        case ArrayColumnType.INT8_ARRAY:
        case ArrayColumnType.OID_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int64Array;
        default:
            if (fieldTypeId >= FIRST_NORMAL_OBJECT_ID) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Text;
            }
            throw new UnsupportedNativeDataType(fieldTypeId);
    }
}
function normalize_array(element_normalizer) {
    return (str)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$node_modules$2f$postgres$2d$array$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(str, element_normalizer);
}
function normalize_numeric(numeric) {
    return numeric;
}
function normalize_date(date) {
    return date;
}
function normalize_timestamp(time) {
    return `${time.replace(" ", "T")}+00:00`;
}
function normalize_timestamptz(time) {
    return time.replace(" ", "T").replace(/[+-]\d{2}(:\d{2})?$/, "+00:00");
}
function normalize_time(time) {
    return time;
}
function normalize_timez(time) {
    return time.replace(/[+-]\d{2}(:\d{2})?$/, "");
}
function normalize_money(money) {
    return money.slice(1);
}
function normalize_xml(xml) {
    return xml;
}
function toJson(json) {
    return json;
}
var parsePgBytes = getTypeParser(ScalarColumnType.BYTEA);
var normalizeByteaArray = getTypeParser(ArrayColumnType.BYTEA_ARRAY);
function convertBytes(serializedBytes) {
    return parsePgBytes(serializedBytes);
}
function normalizeBit(bit) {
    return bit;
}
var customParsers = {
    [ScalarColumnType.NUMERIC]: normalize_numeric,
    [ArrayColumnType.NUMERIC_ARRAY]: normalize_array(normalize_numeric),
    [ScalarColumnType.TIME]: normalize_time,
    [ArrayColumnType.TIME_ARRAY]: normalize_array(normalize_time),
    [ScalarColumnType.TIMETZ]: normalize_timez,
    [ScalarColumnType.DATE]: normalize_date,
    [ArrayColumnType.DATE_ARRAY]: normalize_array(normalize_date),
    [ScalarColumnType.TIMESTAMP]: normalize_timestamp,
    [ArrayColumnType.TIMESTAMP_ARRAY]: normalize_array(normalize_timestamp),
    [ScalarColumnType.TIMESTAMPTZ]: normalize_timestamptz,
    [ArrayColumnType.TIMESTAMPTZ_ARRAY]: normalize_array(normalize_timestamptz),
    [ScalarColumnType.MONEY]: normalize_money,
    [ArrayColumnType.MONEY_ARRAY]: normalize_array(normalize_money),
    [ScalarColumnType.JSON]: toJson,
    [ArrayColumnType.JSON_ARRAY]: normalize_array(toJson),
    [ScalarColumnType.JSONB]: toJson,
    [ArrayColumnType.JSONB_ARRAY]: normalize_array(toJson),
    [ScalarColumnType.BYTEA]: convertBytes,
    [ArrayColumnType.BYTEA_ARRAY]: normalizeByteaArray,
    [ArrayColumnType.BIT_ARRAY]: normalize_array(normalizeBit),
    [ArrayColumnType.VARBIT_ARRAY]: normalize_array(normalizeBit),
    [ArrayColumnType.XML_ARRAY]: normalize_array(normalize_xml)
};
function mapArg(arg, argType) {
    if (arg === null) {
        return null;
    }
    if (Array.isArray(arg) && argType.arity === "list") {
        return arg.map((value)=>mapArg(value, argType));
    }
    if (typeof arg === "string" && argType.scalarType === "datetime") {
        arg = new Date(arg);
    }
    if (arg instanceof Date) {
        switch(argType.dbType){
            case "TIME":
            case "TIMETZ":
                return formatTime(arg);
            case "DATE":
                return formatDate(arg);
            default:
                return formatDateTime(arg);
        }
    }
    if (typeof arg === "string" && argType.scalarType === "bytes") {
        return Buffer.from(arg, "base64");
    }
    if (ArrayBuffer.isView(arg)) {
        return new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength);
    }
    return arg;
}
function formatDateTime(date) {
    const pad = (n, z = 2)=>String(n).padStart(z, "0");
    const ms = date.getUTCMilliseconds();
    return pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + " " + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + (ms ? "." + String(ms).padStart(3, "0") : "");
}
function formatDate(date) {
    const pad = (n, z = 2)=>String(n).padStart(z, "0");
    return pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate());
}
function formatTime(date) {
    const pad = (n, z = 2)=>String(n).padStart(z, "0");
    const ms = date.getUTCMilliseconds();
    return pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + (ms ? "." + String(ms).padStart(3, "0") : "");
}
// src/errors.ts
var TLS_ERRORS = /* @__PURE__ */ new Set([
    "UNABLE_TO_GET_ISSUER_CERT",
    "UNABLE_TO_GET_CRL",
    "UNABLE_TO_DECRYPT_CERT_SIGNATURE",
    "UNABLE_TO_DECRYPT_CRL_SIGNATURE",
    "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY",
    "CERT_SIGNATURE_FAILURE",
    "CRL_SIGNATURE_FAILURE",
    "CERT_NOT_YET_VALID",
    "CERT_HAS_EXPIRED",
    "CRL_NOT_YET_VALID",
    "CRL_HAS_EXPIRED",
    "ERROR_IN_CERT_NOT_BEFORE_FIELD",
    "ERROR_IN_CERT_NOT_AFTER_FIELD",
    "ERROR_IN_CRL_LAST_UPDATE_FIELD",
    "ERROR_IN_CRL_NEXT_UPDATE_FIELD",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "CERT_CHAIN_TOO_LONG",
    "CERT_REVOKED",
    "INVALID_CA",
    "INVALID_PURPOSE",
    "CERT_UNTRUSTED",
    "CERT_REJECTED",
    "HOSTNAME_MISMATCH",
    "ERR_TLS_CERT_ALTNAME_FORMAT",
    "ERR_TLS_CERT_ALTNAME_INVALID"
]);
var SOCKET_ERRORS = /* @__PURE__ */ new Set([
    "ENOTFOUND",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT"
]);
function convertDriverError(error) {
    if (isSocketError(error)) {
        return mapSocketError(error);
    }
    if (isTlsError(error)) {
        return {
            kind: "TlsConnectionError",
            reason: error.message
        };
    }
    if (isDriverError(error)) {
        return {
            originalCode: error.code,
            originalMessage: error.message,
            ...mapDriverError(error)
        };
    }
    throw error;
}
function mapDriverError(error) {
    switch(error.code){
        case "22001":
            return {
                kind: "LengthMismatch",
                column: error.column
            };
        case "22003":
            return {
                kind: "ValueOutOfRange",
                cause: error.message
            };
        case "22P02":
            return {
                kind: "InvalidInputValue",
                message: error.message
            };
        case "23505":
            {
                const fields = error.detail?.match(/Key \(([^)]+)\)/)?.at(1)?.split(", ");
                return {
                    kind: "UniqueConstraintViolation",
                    constraint: fields !== void 0 ? {
                        fields
                    } : void 0
                };
            }
        case "23502":
            {
                const fields = error.detail?.match(/Key \(([^)]+)\)/)?.at(1)?.split(", ");
                return {
                    kind: "NullConstraintViolation",
                    constraint: fields !== void 0 ? {
                        fields
                    } : void 0
                };
            }
        case "23503":
            {
                let constraint;
                if (error.column) {
                    constraint = {
                        fields: [
                            error.column
                        ]
                    };
                } else if (error.constraint) {
                    constraint = {
                        index: error.constraint
                    };
                }
                return {
                    kind: "ForeignKeyConstraintViolation",
                    constraint
                };
            }
        case "3D000":
            return {
                kind: "DatabaseDoesNotExist",
                db: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "28000":
            return {
                kind: "DatabaseAccessDenied",
                db: error.message.split(",").find((s)=>s.startsWith(" database"))?.split('"').at(1)
            };
        case "28P01":
            return {
                kind: "AuthenticationFailed",
                user: error.message.split(" ").pop()?.split('"').at(1)
            };
        case "40001":
            return {
                kind: "TransactionWriteConflict"
            };
        case "42P01":
            return {
                kind: "TableDoesNotExist",
                table: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "42703":
            return {
                kind: "ColumnNotFound",
                column: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "42P04":
            return {
                kind: "DatabaseAlreadyExists",
                db: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "53300":
            return {
                kind: "TooManyConnections",
                cause: error.message
            };
        default:
            return {
                kind: "postgres",
                code: error.code ?? "N/A",
                severity: error.severity ?? "N/A",
                message: error.message,
                detail: error.detail,
                column: error.column,
                hint: error.hint
            };
    }
}
function isDriverError(error) {
    return typeof error.code === "string" && typeof error.message === "string" && typeof error.severity === "string" && (typeof error.detail === "string" || error.detail === void 0) && (typeof error.column === "string" || error.column === void 0) && (typeof error.hint === "string" || error.hint === void 0);
}
function mapSocketError(error) {
    switch(error.code){
        case "ENOTFOUND":
        case "ECONNREFUSED":
            return {
                kind: "DatabaseNotReachable",
                host: error.address ?? error.hostname,
                port: error.port
            };
        case "ECONNRESET":
            return {
                kind: "ConnectionClosed"
            };
        case "ETIMEDOUT":
            return {
                kind: "SocketTimeout"
            };
    }
}
function isSocketError(error) {
    return typeof error.code === "string" && typeof error.syscall === "string" && typeof error.errno === "number" && SOCKET_ERRORS.has(error.code);
}
function isTlsError(error) {
    if (typeof error.code === "string") {
        return TLS_ERRORS.has(error.code);
    }
    switch(error.message){
        case "The server does not support SSL connections":
        case "There was an error establishing an SSL connection":
            return true;
    }
    return false;
}
// src/pg.ts
var types2 = __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__["default"].types;
var debug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Debug"])("prisma:driver-adapter:pg");
var PgQueryable = class {
    constructor(client, pgOptions){
        this.client = client;
        this.pgOptions = pgOptions;
    }
    provider = "postgres";
    adapterName = name;
    /**
   * Execute a query given as SQL, interpolating the given parameters.
   */ async queryRaw(query) {
        const tag = "[js::query_raw]";
        debug(`${tag} %O`, query);
        const { fields, rows } = await this.performIO(query);
        const columnNames = fields.map((field)=>field.name);
        let columnTypes = [];
        try {
            columnTypes = fields.map((field)=>fieldToColumnType(field.dataTypeID));
        } catch (e) {
            if (e instanceof UnsupportedNativeDataType) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DriverAdapterError"]({
                    kind: "UnsupportedNativeDataType",
                    type: e.type
                });
            }
            throw e;
        }
        const udtParser = this.pgOptions?.userDefinedTypeParser;
        if (udtParser) {
            for(let i = 0; i < fields.length; i++){
                const field = fields[i];
                if (field.dataTypeID >= FIRST_NORMAL_OBJECT_ID && !Object.hasOwn(customParsers, field.dataTypeID)) {
                    for(let j = 0; j < rows.length; j++){
                        rows[j][i] = await udtParser(field.dataTypeID, rows[j][i], this);
                    }
                }
            }
        }
        return {
            columnNames,
            columnTypes,
            rows
        };
    }
    /**
   * Execute a query given as SQL, interpolating the given parameters and
   * returning the number of affected rows.
   * Note: Queryable expects a u64, but napi.rs only supports u32.
   */ async executeRaw(query) {
        const tag = "[js::execute_raw]";
        debug(`${tag} %O`, query);
        return (await this.performIO(query)).rowCount ?? 0;
    }
    /**
   * Run a query against the database, returning the result set.
   * Should the query fail due to a connection error, the connection is
   * marked as unhealthy.
   */ async performIO(query) {
        const { sql, args } = query;
        const values = args.map((arg, i)=>mapArg(arg, query.argTypes[i]));
        try {
            const result = await this.client.query({
                text: sql,
                values,
                rowMode: "array",
                types: {
                    // This is the error expected:
                    // No overload matches this call.
                    // The last overload gave the following error.
                    // Type '(oid: number, format?: any) => (json: string) => unknown' is not assignable to type '{ <T>(oid: number): TypeParser<string, string | T>; <T>(oid: number, format: "text"): TypeParser<string, string | T>; <T>(oid: number, format: "binary"): TypeParser<...>; }'.
                    //   Type '(json: string) => unknown' is not assignable to type 'TypeParser<Buffer, any>'.
                    //     Types of parameters 'json' and 'value' are incompatible.
                    //       Type 'Buffer' is not assignable to type 'string'.ts(2769)
                    //
                    // Because pg-types types expect us to handle both binary and text protocol versions,
                    // where as far we can see, pg will ever pass only text version.
                    //
                    // @ts-expect-error
                    getTypeParser: (oid, format)=>{
                        if (format === "text" && customParsers[oid]) {
                            return customParsers[oid];
                        }
                        return types2.getTypeParser(oid, format);
                    }
                }
            }, values);
            return result;
        } catch (e) {
            this.onError(e);
        }
    }
    onError(error) {
        debug("Error in performIO: %O", error);
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DriverAdapterError"](convertDriverError(error));
    }
};
var PgTransaction = class extends PgQueryable {
    constructor(client, options, pgOptions, cleanup){
        super(client, pgOptions);
        this.options = options;
        this.pgOptions = pgOptions;
        this.cleanup = cleanup;
    }
    async commit() {
        debug(`[js::commit]`);
        this.cleanup?.();
        this.client.release();
    }
    async rollback() {
        debug(`[js::rollback]`);
        this.cleanup?.();
        this.client.release();
    }
};
var PrismaPgAdapter = class extends PgQueryable {
    constructor(client, pgOptions, release){
        super(client);
        this.pgOptions = pgOptions;
        this.release = release;
    }
    async startTransaction(isolationLevel) {
        const options = {
            usePhantomQuery: false
        };
        const tag = "[js::startTransaction]";
        debug("%s options: %O", tag, options);
        const conn = await this.client.connect().catch((error)=>this.onError(error));
        const onError = (err)=>{
            debug(`Error from pool connection: ${err.message} %O`, err);
            this.pgOptions?.onConnectionError?.(err);
        };
        conn.on("error", onError);
        const cleanup = ()=>{
            conn.removeListener("error", onError);
        };
        try {
            const tx = new PgTransaction(conn, options, this.pgOptions, cleanup);
            await tx.executeRaw({
                sql: "BEGIN",
                args: [],
                argTypes: []
            });
            if (isolationLevel) {
                await tx.executeRaw({
                    sql: `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`,
                    args: [],
                    argTypes: []
                });
            }
            return tx;
        } catch (error) {
            cleanup();
            conn.release(error);
            this.onError(error);
        }
    }
    async executeScript(script) {
        const statements = script.split(";").map((stmt)=>stmt.trim()).filter((stmt)=>stmt.length > 0);
        for (const stmt of statements){
            try {
                await this.client.query(stmt);
            } catch (error) {
                this.onError(error);
            }
        }
    }
    getConnectionInfo() {
        return {
            schemaName: this.pgOptions?.schema,
            supportsRelationJoins: true
        };
    }
    async dispose() {
        return this.release?.();
    }
    underlyingDriver() {
        return this.client;
    }
};
var PrismaPgAdapterFactory = class {
    constructor(poolOrConfig, options){
        this.options = options;
        if (poolOrConfig instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__["default"].Pool) {
            this.externalPool = poolOrConfig;
            this.config = poolOrConfig.options;
        } else {
            this.externalPool = null;
            this.config = poolOrConfig;
        }
    }
    provider = "postgres";
    adapterName = name;
    config;
    externalPool;
    async connect() {
        const client = this.externalPool ?? new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__["default"].Pool(this.config);
        const onIdleClientError = (err)=>{
            debug(`Error from idle pool client: ${err.message} %O`, err);
            this.options?.onPoolError?.(err);
        };
        client.on("error", onIdleClientError);
        return new PrismaPgAdapter(client, this.options, async ()=>{
            if (this.externalPool) {
                if (this.options?.disposeExternalPool) {
                    await this.externalPool.end();
                    this.externalPool = null;
                } else {
                    this.externalPool.removeListener("error", onIdleClientError);
                }
            } else {
                await client.end();
            }
        });
    }
    async connectToShadowDb() {
        const conn = await this.connect();
        const database = `prisma_migrate_shadow_db_${globalThis.crypto.randomUUID()}`;
        await conn.executeScript(`CREATE DATABASE "${database}"`);
        const client = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$pg$29$__["default"].Pool({
            ...this.config,
            database
        });
        return new PrismaPgAdapter(client, void 0, async ()=>{
            await conn.executeScript(`DROP DATABASE "${database}"`);
            await client.end();
        });
    }
};
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/templates/app-page.js?page=/[userId]/practice/[category]/page { GLOBAL_ERROR_MODULE => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)\", METADATA_0 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico.mjs { IMAGE => \\\"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico (static in ecmascript, tag client)\\\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)\", MODULE_1 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_2 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_3 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_4 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_5 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_6 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_7 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/[category]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)\" } [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__next_app__",
    ()=>__next_app__,
    "handler",
    ()=>handler,
    "routeModule",
    ()=>routeModule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$lib$2f$metadata$2f$get$2d$metadata$2d$route$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/lib/metadata/get-metadata-route.js [app-rsc] (ecmascript, Next.js server utility)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29$__ = __turbopack_context__.i('[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico.mjs { IMAGE => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico (static in ecmascript, tag client)" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)');
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$module$2e$compiled$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/route-kind.js [app-rsc] (ecmascript, Next.js server utility)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$instrumentation$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/instrumentation/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$tracer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/trace/tracer.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/request-meta.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/trace/constants.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$interop$2d$default$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/interop-default.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$strip$2d$flight$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/strip-flight-headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$base$2d$http$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/base-http/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$experimental$2f$ppr$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/experimental/ppr.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2f$fallback$2d$params$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/request/fallback-params.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$manifests$2d$singleton$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/manifests-singleton.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$streaming$2d$metadata$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/streaming-metadata.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/app-paths.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$server$2d$action$2d$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/lib/server-action-request-meta.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/client/components/app-router-headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$is$2d$bot$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/is-bot.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/response-cache/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/response-cache/types.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/fallback.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$render$2d$result$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/render-result.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/constants.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$stream$2d$utils$2f$encoded$2d$tags$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/stream-utils/encoded-tags.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/send-payload.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$shared$2f$lib$2f$no$2d$fallback$2d$error$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$shared$2f$lib$2f$no$2d$fallback$2d$error$2e$external$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$size$2d$limit$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/size-limit.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript, Next.js server utility) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript, Next.js server utility)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$redirect$2d$status$2d$code$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/client/components/redirect-status-code.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$scheduler$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/lib/scheduler.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$routes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/shared/lib/router/utils/interception-routes.js [app-rsc] (ecmascript)");
;
;
const __TURBOPACK__layout__$23$1__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)");
const __TURBOPACK__not$2d$found__$23$2__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js [app-rsc] (ecmascript, Next.js Server Component)");
const __TURBOPACK__forbidden__$23$3__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js [app-rsc] (ecmascript, Next.js Server Component)");
const __TURBOPACK__unauthorized__$23$4__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js [app-rsc] (ecmascript, Next.js Server Component)");
const __TURBOPACK__global$2d$error__$23$5__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)");
const __TURBOPACK__layout__$23$6__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)");
const __TURBOPACK__page__$23$7__ = ()=>__turbopack_context__.r("[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/[category]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
// We inject the tree and pages here so that we can use them in the route
// module.
const tree = [
    "",
    {
        "children": [
            "[userId]",
            {
                "children": [
                    "practice",
                    {
                        "children": [
                            "[category]",
                            {
                                "children": [
                                    "__PAGE__",
                                    {},
                                    {
                                        metadata: {},
                                        "page": [
                                            __TURBOPACK__page__$23$7__,
                                            "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/[category]/page.tsx"
                                        ]
                                    }
                                ]
                            },
                            {
                                metadata: {}
                            }
                        ]
                    },
                    {
                        metadata: {}
                    }
                ]
            },
            {
                metadata: {},
                "layout": [
                    __TURBOPACK__layout__$23$6__,
                    "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/layout.tsx"
                ]
            }
        ]
    },
    {
        metadata: {
            icon: [
                async (props)=>[
                        {
                            url: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$lib$2f$metadata$2f$get$2d$metadata$2d$route$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["fillMetadataSegment"])("//", await props.params, "favicon.ico") + `?${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29$__["default"].src.split("/").splice(-1)[0]}`,
                            sizes: `${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29$__["default"].width}x${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29$__["default"].height}`,
                            type: `image/x-icon`
                        }
                    ]
            ]
        },
        "layout": [
            __TURBOPACK__layout__$23$1__,
            "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/layout.tsx"
        ],
        "not-found": [
            __TURBOPACK__not$2d$found__$23$2__,
            "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js"
        ],
        "forbidden": [
            __TURBOPACK__forbidden__$23$3__,
            "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js"
        ],
        "unauthorized": [
            __TURBOPACK__unauthorized__$23$4__,
            "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js"
        ],
        "global-error": [
            __TURBOPACK__global$2d$error__$23$5__,
            "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js"
        ]
    }
];
;
;
const __next_app_require__ = __turbopack_context__.r.bind(__turbopack_context__);
const __next_app_load_chunk__ = __turbopack_context__.l.bind(__turbopack_context__);
const __next_app__ = {
    require: __next_app_require__,
    loadChunk: __next_app_load_chunk__
};
;
;
;
;
;
;
const routeModule = new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$module$2e$compiled$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AppPageRouteModule"]({
    definition: {
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["RouteKind"].APP_PAGE,
        page: "/[userId]/practice/[category]/page",
        pathname: "/[userId]/practice/[category]",
        // The following aren't used in production.
        bundlePath: '',
        filename: '',
        appPaths: []
    },
    userland: {
        loaderTree: tree
    },
    distDir: ("TURBOPACK compile-time value", ".next\\dev") || '',
    relativeProjectDir: ("TURBOPACK compile-time value", "") || ''
});
async function handler(req, res, ctx) {
    var _this;
    if (routeModule.isDev) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addRequestMeta"])(req, 'devRequestTimingInternalsEnd', process.hrtime.bigint());
    }
    const isMinimalMode = Boolean(("TURBOPACK compile-time value", false) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'minimalMode'));
    let srcPage = "/[userId]/practice/[category]/page";
    // turbopack doesn't normalize `/index` in the page name
    // so we need to to process dynamic routes properly
    // TODO: fix turbopack providing differing value from webpack
    if ("TURBOPACK compile-time truthy", 1) {
        srcPage = srcPage.replace(/\/index$/, '') || '/';
    } else if (srcPage === '/index') {
        // we always normalize /index specifically
        srcPage = '/';
    }
    const multiZoneDraftMode = ("TURBOPACK compile-time value", false);
    const prepareResult = await routeModule.prepare(req, res, {
        srcPage,
        multiZoneDraftMode
    });
    if (!prepareResult) {
        res.statusCode = 400;
        res.end('Bad Request');
        ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, Promise.resolve());
        return null;
    }
    const { buildId, query, params, pageIsDynamic, buildManifest, nextFontManifest, reactLoadableManifest, serverActionsManifest, clientReferenceManifest, subresourceIntegrityManifest, prerenderManifest, isDraftMode, resolvedPathname, revalidateOnlyGenerated, routerServerContext, nextConfig, parsedUrl, interceptionRoutePatterns, deploymentId } = prepareResult;
    const normalizedSrcPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeAppPath"])(srcPage);
    let { isOnDemandRevalidate } = prepareResult;
    // We use the resolvedPathname instead of the parsedUrl.pathname because it
    // is not rewritten as resolvedPathname is. This will ensure that the correct
    // prerender info is used instead of using the original pathname as the
    // source. If however PPR is enabled and cacheComponents is disabled, we
    // treat the pathname as dynamic. Currently, there's a bug in the PPR
    // implementation that incorrectly leaves %%drp placeholders in the output of
    // parallel routes. This is addressed with cacheComponents.
    const prerenderInfo = nextConfig.experimental.ppr && !nextConfig.cacheComponents && (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$interception$2d$routes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isInterceptionRouteAppPath"])(resolvedPathname) ? null : routeModule.match(resolvedPathname, prerenderManifest);
    const isPrerendered = !!prerenderManifest.routes[resolvedPathname];
    const userAgent = req.headers['user-agent'] || '';
    const botType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$is$2d$bot$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getBotType"])(userAgent);
    const isHtmlBot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$streaming$2d$metadata$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHtmlBotRequest"])(req);
    /**
   * If true, this indicates that the request being made is for an app
   * prefetch request.
   */ const isPrefetchRSCRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'isPrefetchRSCRequest') ?? req.headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_ROUTER_PREFETCH_HEADER"]] === '1' // exclude runtime prefetches, which use '2'
    ;
    // NOTE: Don't delete headers[RSC] yet, it still needs to be used in renderToHTML later
    const isRSCRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'isRSCRequest') ?? Boolean(req.headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RSC_HEADER"]]);
    const isPossibleServerAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$server$2d$action$2d$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getIsPossibleServerAction"])(req);
    /**
   * If the route being rendered is an app page, and the ppr feature has been
   * enabled, then the given route _could_ support PPR.
   */ const couldSupportPPR = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$experimental$2f$ppr$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkIsAppPPREnabled"])(nextConfig.experimental.ppr);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'postponed') && couldSupportPPR && req.headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_RESUME_HEADER"]] === '1' && req.method === 'POST') {
        // Decode the postponed state from the request body, it will come as
        // an array of buffers, so collect them and then concat them to form
        // the string.
        const body = [];
        for await (const chunk of req){
            body.push(chunk);
        }
        const postponed = Buffer.concat(body).toString('utf8');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addRequestMeta"])(req, 'postponed', postponed);
    }
    // When enabled, this will allow the use of the `?__nextppronly` query to
    // enable debugging of the static shell.
    const hasDebugStaticShellQuery = ("TURBOPACK compile-time value", false) === '1' && typeof query.__nextppronly !== 'undefined' && couldSupportPPR;
    // When enabled, this will allow the use of the `?__nextppronly` query
    // to enable debugging of the fallback shell.
    const hasDebugFallbackShellQuery = hasDebugStaticShellQuery && query.__nextppronly === 'fallback';
    // This page supports PPR if it is marked as being `PARTIALLY_STATIC` in the
    // prerender manifest and this is an app page.
    const isRoutePPREnabled = couldSupportPPR && (((_this = prerenderManifest.routes[normalizedSrcPage] ?? prerenderManifest.dynamicRoutes[normalizedSrcPage]) == null ? void 0 : _this.renderingMode) === 'PARTIALLY_STATIC' || // Ideally we'd want to check the appConfig to see if this page has PPR
    // enabled or not, but that would require plumbing the appConfig through
    // to the server during development. We assume that the page supports it
    // but only during development.
    hasDebugStaticShellQuery && (routeModule.isDev === true || (routerServerContext == null ? void 0 : routerServerContext.experimentalTestProxy) === true));
    const isDebugStaticShell = hasDebugStaticShellQuery && isRoutePPREnabled;
    // We should enable debugging dynamic accesses when the static shell
    // debugging has been enabled and we're also in development mode.
    const isDebugDynamicAccesses = isDebugStaticShell && routeModule.isDev === true;
    const isDebugFallbackShell = hasDebugFallbackShellQuery && isRoutePPREnabled;
    // If we're in minimal mode, then try to get the postponed information from
    // the request metadata. If available, use it for resuming the postponed
    // render.
    const minimalPostponed = isRoutePPREnabled ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'postponed') : undefined;
    // If PPR is enabled, and this is a RSC request (but not a prefetch), then
    // we can use this fact to only generate the flight data for the request
    // because we can't cache the HTML (as it's also dynamic).
    let isDynamicRSCRequest = isRoutePPREnabled && isRSCRequest && !isPrefetchRSCRequest;
    // During a PPR revalidation, the RSC request is not dynamic if we do not have the postponed data.
    // We only attach the postponed data during a resume. If there's no postponed data, then it must be a revalidation.
    // This is to ensure that we don't bypass the cache during a revalidation.
    if (isMinimalMode) {
        isDynamicRSCRequest = isDynamicRSCRequest && !!minimalPostponed;
    }
    // Need to read this before it's stripped by stripFlightHeaders. We don't
    // need to transfer it to the request meta because it's only read
    // within this function; the static segment data should have already been
    // generated, so we will always either return a static response or a 404.
    const segmentPrefetchHeader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'segmentPrefetchRSCRequest');
    // TODO: investigate existing bug with shouldServeStreamingMetadata always
    // being true for a revalidate due to modifying the base-server this.renderOpts
    // when fixing this to correct logic it causes hydration issue since we set
    // serveStreamingMetadata to true during export
    const serveStreamingMetadata = isHtmlBot && isRoutePPREnabled ? false : !userAgent ? true : (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$streaming$2d$metadata$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["shouldServeStreamingMetadata"])(userAgent, nextConfig.htmlLimitedBots);
    const isSSG = Boolean((prerenderInfo || isPrerendered || prerenderManifest.routes[normalizedSrcPage]) && // If this is a html bot request and PPR is enabled, then we don't want
    // to serve a static response.
    !(isHtmlBot && isRoutePPREnabled));
    // When a page supports cacheComponents, we can support RDC for Navigations
    const supportsRDCForNavigations = isRoutePPREnabled && nextConfig.cacheComponents === true;
    // In development, we always want to generate dynamic HTML.
    const supportsDynamicResponse = // a data request, in which case we only produce static HTML.
    routeModule.isDev === true || // If this is not SSG or does not have static paths, then it supports
    // dynamic HTML.
    !isSSG || // If this request has provided postponed data, it supports dynamic
    // HTML.
    typeof minimalPostponed === 'string' || // If this handler supports onCacheEntryV2, then we can only support
    // dynamic responses if it's a dynamic RSC request and not in minimal mode. If it
    // doesn't support it we must fallback to the default behavior.
    (supportsRDCForNavigations && (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'onCacheEntryV2') ? // RSC request, we'll pass the minimal postponed data to the render
    // which will trigger the `supportsDynamicResponse` to be true.
    isDynamicRSCRequest && !isMinimalMode : isDynamicRSCRequest);
    // When html bots request PPR page, perform the full dynamic rendering.
    const shouldWaitOnAllReady = isHtmlBot && isRoutePPREnabled;
    let ssgCacheKey = null;
    if (!isDraftMode && isSSG && !supportsDynamicResponse && !isPossibleServerAction && !minimalPostponed && !isDynamicRSCRequest) {
        ssgCacheKey = resolvedPathname;
    }
    // the staticPathKey differs from ssgCacheKey since
    // ssgCacheKey is null in dev since we're always in "dynamic"
    // mode in dev to bypass the cache, but we still need to honor
    // dynamicParams = false in dev mode
    let staticPathKey = ssgCacheKey;
    if (!staticPathKey && routeModule.isDev) {
        staticPathKey = resolvedPathname;
    }
    // If this is a request for an app path that should be statically generated
    // and we aren't in the edge runtime, strip the flight headers so it will
    // generate the static response.
    if (!routeModule.isDev && !isDraftMode && isSSG && isRSCRequest && !isDynamicRSCRequest) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$strip$2d$flight$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stripFlightHeaders"])(req.headers);
    }
    const ComponentMod = {
        ...__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__,
        tree,
        GlobalError: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29$__["default"],
        handler,
        routeModule,
        __next_app__
    };
    // Before rendering (which initializes component tree modules), we have to
    // set the reference manifests to our global store so Server Action's
    // encryption util can access to them at the top level of the page module.
    if (serverActionsManifest && clientReferenceManifest) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$manifests$2d$singleton$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setManifestsSingleton"])({
            page: srcPage,
            clientReferenceManifest,
            serverActionsManifest
        });
    }
    const method = req.method || 'GET';
    const tracer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$tracer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTracer"])();
    const activeSpan = tracer.getActiveScopeSpan();
    const render404 = async ()=>{
        // TODO: should route-module itself handle rendering the 404
        if (routerServerContext == null ? void 0 : routerServerContext.render404) {
            await routerServerContext.render404(req, res, parsedUrl, false);
        } else {
            res.end('This page could not be found');
        }
        return null;
    };
    try {
        const varyHeader = routeModule.getVaryHeader(resolvedPathname, interceptionRoutePatterns);
        res.setHeader('Vary', varyHeader);
        const invokeRouteModule = async (span, context)=>{
            const nextReq = new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$base$2d$http$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NodeNextRequest"](req);
            const nextRes = new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$base$2d$http$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NodeNextResponse"](res);
            return routeModule.render(nextReq, nextRes, context).finally(()=>{
                if (!span) return;
                span.setAttributes({
                    'http.status_code': res.statusCode,
                    'next.rsc': false
                });
                const rootSpanAttributes = tracer.getRootSpanAttributes();
                // We were unable to get attributes, probably OTEL is not enabled
                if (!rootSpanAttributes) {
                    return;
                }
                if (rootSpanAttributes.get('next.span_type') !== __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BaseServerSpan"].handleRequest) {
                    console.warn(`Unexpected root span type '${rootSpanAttributes.get('next.span_type')}'. Please report this Next.js issue https://github.com/vercel/next.js`);
                    return;
                }
                const route = rootSpanAttributes.get('next.route');
                if (route) {
                    const name = `${method} ${route}`;
                    span.setAttributes({
                        'next.route': route,
                        'http.route': route,
                        'next.span_name': name
                    });
                    span.updateName(name);
                } else {
                    span.updateName(`${method} ${srcPage}`);
                }
            });
        };
        const incrementalCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'incrementalCache');
        const doRender = async ({ span, postponed, fallbackRouteParams, forceStaticRender })=>{
            const context = {
                query,
                params,
                page: normalizedSrcPage,
                sharedContext: {
                    buildId
                },
                serverComponentsHmrCache: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'serverComponentsHmrCache'),
                fallbackRouteParams,
                renderOpts: {
                    App: ()=>null,
                    Document: ()=>null,
                    pageConfig: {},
                    ComponentMod,
                    Component: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$interop$2d$default$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["interopDefault"])(ComponentMod),
                    params,
                    routeModule,
                    page: srcPage,
                    postponed,
                    shouldWaitOnAllReady,
                    serveStreamingMetadata,
                    supportsDynamicResponse: typeof postponed === 'string' || supportsDynamicResponse,
                    buildManifest,
                    nextFontManifest,
                    reactLoadableManifest,
                    subresourceIntegrityManifest,
                    setCacheStatus: routerServerContext == null ? void 0 : routerServerContext.setCacheStatus,
                    setIsrStatus: routerServerContext == null ? void 0 : routerServerContext.setIsrStatus,
                    setReactDebugChannel: routerServerContext == null ? void 0 : routerServerContext.setReactDebugChannel,
                    sendErrorsToBrowser: routerServerContext == null ? void 0 : routerServerContext.sendErrorsToBrowser,
                    dir: ("TURBOPACK compile-time truthy", 1) ? require('path').join(/* turbopackIgnore: true */ process.cwd(), routeModule.relativeProjectDir) : "TURBOPACK unreachable",
                    isDraftMode,
                    botType,
                    isOnDemandRevalidate,
                    isPossibleServerAction,
                    assetPrefix: nextConfig.assetPrefix,
                    nextConfigOutput: nextConfig.output,
                    crossOrigin: nextConfig.crossOrigin,
                    trailingSlash: nextConfig.trailingSlash,
                    images: nextConfig.images,
                    previewProps: prerenderManifest.preview,
                    deploymentId: deploymentId,
                    enableTainting: nextConfig.experimental.taint,
                    htmlLimitedBots: nextConfig.htmlLimitedBots,
                    reactMaxHeadersLength: nextConfig.reactMaxHeadersLength,
                    multiZoneDraftMode,
                    incrementalCache,
                    cacheLifeProfiles: nextConfig.cacheLife,
                    basePath: nextConfig.basePath,
                    serverActions: nextConfig.experimental.serverActions,
                    ...isDebugStaticShell || isDebugDynamicAccesses || isDebugFallbackShell ? {
                        nextExport: true,
                        supportsDynamicResponse: false,
                        isStaticGeneration: true,
                        isDebugDynamicAccesses: isDebugDynamicAccesses
                    } : {},
                    cacheComponents: Boolean(nextConfig.cacheComponents),
                    experimental: {
                        isRoutePPREnabled,
                        expireTime: nextConfig.expireTime,
                        staleTimes: nextConfig.experimental.staleTimes,
                        dynamicOnHover: Boolean(nextConfig.experimental.dynamicOnHover),
                        inlineCss: Boolean(nextConfig.experimental.inlineCss),
                        authInterrupts: Boolean(nextConfig.experimental.authInterrupts),
                        clientTraceMetadata: nextConfig.experimental.clientTraceMetadata || [],
                        clientParamParsingOrigins: nextConfig.experimental.clientParamParsingOrigins,
                        maxPostponedStateSizeBytes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$size$2d$limit$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseMaxPostponedStateSize"])(nextConfig.experimental.maxPostponedStateSize)
                    },
                    waitUntil: ctx.waitUntil,
                    onClose: (cb)=>{
                        res.on('close', cb);
                    },
                    onAfterTaskError: ()=>{},
                    onInstrumentationRequestError: (error, _request, errorContext, silenceLog)=>routeModule.onRequestError(req, error, errorContext, silenceLog, routerServerContext),
                    err: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'invokeError'),
                    dev: routeModule.isDev
                }
            };
            if (isDebugStaticShell || isDebugDynamicAccesses) {
                context.renderOpts.nextExport = true;
                context.renderOpts.supportsDynamicResponse = false;
                context.renderOpts.isDebugDynamicAccesses = isDebugDynamicAccesses;
            }
            // When we're revalidating in the background, we should not allow dynamic
            // responses.
            if (forceStaticRender) {
                context.renderOpts.supportsDynamicResponse = false;
            }
            const result = await invokeRouteModule(span, context);
            const { metadata } = result;
            const { cacheControl, headers = {}, fetchTags: cacheTags, fetchMetrics } = metadata;
            if (cacheTags) {
                headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_CACHE_TAGS_HEADER"]] = cacheTags;
            }
            // Pull any fetch metrics from the render onto the request.
            ;
            req.fetchMetrics = fetchMetrics;
            // we don't throw static to dynamic errors in dev as isSSG
            // is a best guess in dev since we don't have the prerender pass
            // to know whether the path is actually static or not
            if (isSSG && (cacheControl == null ? void 0 : cacheControl.revalidate) === 0 && !routeModule.isDev && !isRoutePPREnabled) {
                const staticBailoutInfo = metadata.staticBailoutInfo;
                const err = Object.defineProperty(new Error(`Page changed from static to dynamic at runtime ${resolvedPathname}${(staticBailoutInfo == null ? void 0 : staticBailoutInfo.description) ? `, reason: ${staticBailoutInfo.description}` : ``}` + `\nsee more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`), "__NEXT_ERROR_CODE", {
                    value: "E132",
                    enumerable: false,
                    configurable: true
                });
                if (staticBailoutInfo == null ? void 0 : staticBailoutInfo.stack) {
                    const stack = staticBailoutInfo.stack;
                    err.stack = err.message + stack.substring(stack.indexOf('\n'));
                }
                throw err;
            }
            return {
                value: {
                    kind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CachedRouteKind"].APP_PAGE,
                    html: result,
                    headers,
                    rscData: metadata.flightData,
                    postponed: metadata.postponed,
                    status: metadata.statusCode,
                    segmentData: metadata.segmentData
                },
                cacheControl
            };
        };
        const responseGenerator = async ({ hasResolved, previousCacheEntry: previousIncrementalCacheEntry, isRevalidating, span, forceStaticRender = false })=>{
            const isProduction = routeModule.isDev === false;
            const didRespond = hasResolved || res.writableEnded;
            // skip on-demand revalidate if cache is not present and
            // revalidate-if-generated is set
            if (isOnDemandRevalidate && revalidateOnlyGenerated && !previousIncrementalCacheEntry && !isMinimalMode) {
                if (routerServerContext == null ? void 0 : routerServerContext.render404) {
                    await routerServerContext.render404(req, res);
                } else {
                    res.statusCode = 404;
                    res.end('This page could not be found');
                }
                return null;
            }
            let fallbackMode;
            if (prerenderInfo) {
                fallbackMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseFallbackField"])(prerenderInfo.fallback);
            }
            // When serving a HTML bot request, we want to serve a blocking render and
            // not the prerendered page. This ensures that the correct content is served
            // to the bot in the head.
            if (fallbackMode === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FallbackMode"].PRERENDER && (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$router$2f$utils$2f$is$2d$bot$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["isBot"])(userAgent)) {
                if (!isRoutePPREnabled || isHtmlBot) {
                    fallbackMode = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FallbackMode"].BLOCKING_STATIC_RENDER;
                }
            }
            if ((previousIncrementalCacheEntry == null ? void 0 : previousIncrementalCacheEntry.isStale) === -1) {
                isOnDemandRevalidate = true;
            }
            // TODO: adapt for PPR
            // only allow on-demand revalidate for fallback: true/blocking
            // or for prerendered fallback: false paths
            if (isOnDemandRevalidate && (fallbackMode !== __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FallbackMode"].NOT_FOUND || previousIncrementalCacheEntry)) {
                fallbackMode = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FallbackMode"].BLOCKING_STATIC_RENDER;
            }
            if (!isMinimalMode && fallbackMode !== __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FallbackMode"].BLOCKING_STATIC_RENDER && staticPathKey && !didRespond && !isDraftMode && pageIsDynamic && (isProduction || !isPrerendered)) {
                // if the page has dynamicParams: false and this pathname wasn't
                // prerendered trigger the no fallback handling
                if (// getStaticPaths.
                (isProduction || prerenderInfo) && // When fallback isn't present, abort this render so we 404
                fallbackMode === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$fallback$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["FallbackMode"].NOT_FOUND) {
                    if (nextConfig.experimental.adapterPath) {
                        return await render404();
                    }
                    throw new __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$shared$2f$lib$2f$no$2d$fallback$2d$error$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$shared$2f$lib$2f$no$2d$fallback$2d$error$2e$external$2e$js$2c$__cjs$29$__["NoFallbackError"]();
                }
                // When cacheComponents is enabled, we can use the fallback
                // response if the request is not a dynamic RSC request because the
                // RSC data when this feature flag is enabled does not contain any
                // param references. Without this feature flag enabled, the RSC data
                // contains param references, and therefore we can't use the fallback.
                if (isRoutePPREnabled && (nextConfig.cacheComponents ? !isDynamicRSCRequest : !isRSCRequest)) {
                    const cacheKey = isProduction && typeof (prerenderInfo == null ? void 0 : prerenderInfo.fallback) === 'string' ? prerenderInfo.fallback : normalizedSrcPage;
                    const fallbackRouteParams = // can use the manifest fallback route params.
                    isProduction && (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2f$fallback$2d$params$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createOpaqueFallbackRouteParams"])(prerenderInfo.fallbackRouteParams) : isDebugFallbackShell ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2f$fallback$2d$params$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFallbackRouteParams"])(normalizedSrcPage, routeModule) : null;
                    // We use the response cache here to handle the revalidation and
                    // management of the fallback shell.
                    const fallbackResponse = await routeModule.handleResponse({
                        cacheKey,
                        req,
                        nextConfig,
                        routeKind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["RouteKind"].APP_PAGE,
                        isFallback: true,
                        prerenderManifest,
                        isRoutePPREnabled,
                        responseGenerator: async ()=>doRender({
                                span,
                                // We pass `undefined` as rendering a fallback isn't resumed
                                // here.
                                postponed: undefined,
                                fallbackRouteParams,
                                forceStaticRender: false
                            }),
                        waitUntil: ctx.waitUntil,
                        isMinimalMode
                    });
                    // If the fallback response was set to null, then we should return null.
                    if (fallbackResponse === null) return null;
                    // Otherwise, if we did get a fallback response, we should return it.
                    if (fallbackResponse) {
                        // Remove the cache control from the response to prevent it from being
                        // used in the surrounding cache.
                        delete fallbackResponse.cacheControl;
                        return fallbackResponse;
                    }
                }
            }
            // Only requests that aren't revalidating can be resumed. If we have the
            // minimal postponed data, then we should resume the render with it.
            let postponed = !isOnDemandRevalidate && !isRevalidating && minimalPostponed ? minimalPostponed : undefined;
            // If this is a dynamic RSC request, we should use the postponed data from
            // the static render (if available). This ensures that we can utilize the
            // resume data cache (RDC) from the static render to ensure that the data
            // is consistent between the static and dynamic renders.
            if (supportsRDCForNavigations && ("TURBOPACK compile-time value", "nodejs") !== 'edge' && !isMinimalMode && incrementalCache && isDynamicRSCRequest && // We don't typically trigger an on-demand revalidation for dynamic RSC
            // requests, as we're typically revalidating the page in the background
            // instead. However, if the cache entry is stale, we should trigger a
            // background revalidation on dynamic RSC requests. This prevents us
            // from entering an infinite loop of revalidations.
            !forceStaticRender) {
                const incrementalCacheEntry = await incrementalCache.get(resolvedPathname, {
                    kind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["IncrementalCacheKind"].APP_PAGE,
                    isRoutePPREnabled: true,
                    isFallback: false
                });
                // If the cache entry is found, we should use the postponed data from
                // the cache.
                if (incrementalCacheEntry && incrementalCacheEntry.value && incrementalCacheEntry.value.kind === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CachedRouteKind"].APP_PAGE) {
                    // CRITICAL: we're assigning the postponed data from the cache entry
                    // here as we're using the RDC to resume the render.
                    postponed = incrementalCacheEntry.value.postponed;
                    // If the cache entry is stale, we should trigger a background
                    // revalidation so that subsequent requests will get a fresh response.
                    if (incrementalCacheEntry && // We want to trigger this flow if the cache entry is stale and if
                    // the requested revalidation flow is either foreground or
                    // background.
                    (incrementalCacheEntry.isStale === -1 || incrementalCacheEntry.isStale === true)) {
                        // We want to schedule this on the next tick to ensure that the
                        // render is not blocked on it.
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$scheduler$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scheduleOnNextTick"])(async ()=>{
                            const responseCache = routeModule.getResponseCache(req);
                            try {
                                await responseCache.revalidate(resolvedPathname, incrementalCache, isRoutePPREnabled, false, (c)=>responseGenerator({
                                        ...c,
                                        // CRITICAL: we need to set this to true as we're
                                        // revalidating in the background and typically this dynamic
                                        // RSC request is not treated as static.
                                        forceStaticRender: true
                                    }), // previous cache entry here (which is stale) will switch on
                                // isOnDemandRevalidate and break the prerendering.
                                null, hasResolved, ctx.waitUntil);
                            } catch (err) {
                                console.error('Error revalidating the page in the background', err);
                            }
                        });
                    }
                }
            }
            // When we're in minimal mode, if we're trying to debug the static shell,
            // we should just return nothing instead of resuming the dynamic render.
            if ((isDebugStaticShell || isDebugDynamicAccesses) && typeof postponed !== 'undefined') {
                return {
                    cacheControl: {
                        revalidate: 1,
                        expire: undefined
                    },
                    value: {
                        kind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CachedRouteKind"].PAGES,
                        html: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$render$2d$result$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].EMPTY,
                        pageData: {},
                        headers: undefined,
                        status: undefined
                    }
                };
            }
            const fallbackRouteParams = // can use the manifest fallback route params if we need to render the
            // fallback shell.
            isProduction && (prerenderInfo == null ? void 0 : prerenderInfo.fallbackRouteParams) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'renderFallbackShell') ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2f$fallback$2d$params$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createOpaqueFallbackRouteParams"])(prerenderInfo.fallbackRouteParams) : isDebugFallbackShell ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2f$fallback$2d$params$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFallbackRouteParams"])(normalizedSrcPage, routeModule) : null;
            // Perform the render.
            return doRender({
                span,
                postponed,
                fallbackRouteParams,
                forceStaticRender
            });
        };
        const handleResponse = async (span)=>{
            var _cacheEntry_value, _cachedData_headers;
            const cacheEntry = await routeModule.handleResponse({
                cacheKey: ssgCacheKey,
                responseGenerator: (c)=>responseGenerator({
                        span,
                        ...c
                    }),
                routeKind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$route$2d$kind$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["RouteKind"].APP_PAGE,
                isOnDemandRevalidate,
                isRoutePPREnabled,
                req,
                nextConfig,
                prerenderManifest,
                waitUntil: ctx.waitUntil,
                isMinimalMode
            });
            if (isDraftMode) {
                res.setHeader('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
            }
            // In dev, we should not cache pages for any reason.
            if (routeModule.isDev) {
                res.setHeader('Cache-Control', 'no-store, must-revalidate');
            }
            if (!cacheEntry) {
                if (ssgCacheKey) {
                    // A cache entry might not be generated if a response is written
                    // in `getInitialProps` or `getServerSideProps`, but those shouldn't
                    // have a cache key. If we do have a cache key but we don't end up
                    // with a cache entry, then either Next.js or the application has a
                    // bug that needs fixing.
                    throw Object.defineProperty(new Error('invariant: cache entry required but not generated'), "__NEXT_ERROR_CODE", {
                        value: "E62",
                        enumerable: false,
                        configurable: true
                    });
                }
                return null;
            }
            if (((_cacheEntry_value = cacheEntry.value) == null ? void 0 : _cacheEntry_value.kind) !== __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CachedRouteKind"].APP_PAGE) {
                var _cacheEntry_value1;
                throw Object.defineProperty(new Error(`Invariant app-page handler received invalid cache entry ${(_cacheEntry_value1 = cacheEntry.value) == null ? void 0 : _cacheEntry_value1.kind}`), "__NEXT_ERROR_CODE", {
                    value: "E707",
                    enumerable: false,
                    configurable: true
                });
            }
            const didPostpone = typeof cacheEntry.value.postponed === 'string';
            if (isSSG && // We don't want to send a cache header for requests that contain dynamic
            // data. If this is a Dynamic RSC request or wasn't a Prefetch RSC
            // request, then we should set the cache header.
            !isDynamicRSCRequest && (!didPostpone || isPrefetchRSCRequest)) {
                if (!isMinimalMode) {
                    // set x-nextjs-cache header to match the header
                    // we set for the image-optimizer
                    res.setHeader('x-nextjs-cache', isOnDemandRevalidate ? 'REVALIDATED' : cacheEntry.isMiss ? 'MISS' : cacheEntry.isStale ? 'STALE' : 'HIT');
                }
                // Set a header used by the client router to signal the response is static
                // and should respect the `static` cache staleTime value.
                res.setHeader(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_IS_PRERENDER_HEADER"], '1');
            }
            const { value: cachedData } = cacheEntry;
            // Coerce the cache control parameter from the render.
            let cacheControl;
            // If this is a resume request in minimal mode it is streamed with dynamic
            // content and should not be cached.
            if (minimalPostponed) {
                cacheControl = {
                    revalidate: 0,
                    expire: undefined
                };
            } else if (isDynamicRSCRequest) {
                cacheControl = {
                    revalidate: 0,
                    expire: undefined
                };
            } else if (!routeModule.isDev) {
                // If this is a preview mode request, we shouldn't cache it
                if (isDraftMode) {
                    cacheControl = {
                        revalidate: 0,
                        expire: undefined
                    };
                } else if (!isSSG) {
                    if (!res.getHeader('Cache-Control')) {
                        cacheControl = {
                            revalidate: 0,
                            expire: undefined
                        };
                    }
                } else if (cacheEntry.cacheControl) {
                    // If the cache entry has a cache control with a revalidate value that's
                    // a number, use it.
                    if (typeof cacheEntry.cacheControl.revalidate === 'number') {
                        var _cacheEntry_cacheControl;
                        if (cacheEntry.cacheControl.revalidate < 1) {
                            throw Object.defineProperty(new Error(`Invalid revalidate configuration provided: ${cacheEntry.cacheControl.revalidate} < 1`), "__NEXT_ERROR_CODE", {
                                value: "E22",
                                enumerable: false,
                                configurable: true
                            });
                        }
                        cacheControl = {
                            revalidate: cacheEntry.cacheControl.revalidate,
                            expire: ((_cacheEntry_cacheControl = cacheEntry.cacheControl) == null ? void 0 : _cacheEntry_cacheControl.expire) ?? nextConfig.expireTime
                        };
                    } else {
                        cacheControl = {
                            revalidate: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CACHE_ONE_YEAR"],
                            expire: undefined
                        };
                    }
                }
            }
            cacheEntry.cacheControl = cacheControl;
            if (typeof segmentPrefetchHeader === 'string' && (cachedData == null ? void 0 : cachedData.kind) === __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CachedRouteKind"].APP_PAGE && cachedData.segmentData) {
                var _cachedData_headers1;
                // This is a prefetch request issued by the client Segment Cache. These
                // should never reach the application layer (lambda). We should either
                // respond from the cache (HIT) or respond with 204 No Content (MISS).
                // Set a header to indicate that PPR is enabled for this route. This
                // lets the client distinguish between a regular cache miss and a cache
                // miss due to PPR being disabled. In other contexts this header is used
                // to indicate that the response contains dynamic data, but here we're
                // only using it to indicate that the feature is enabled — the segment
                // response itself contains whether the data is dynamic.
                res.setHeader(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_DID_POSTPONE_HEADER"], '2');
                // Add the cache tags header to the response if it exists and we're in
                // minimal mode while rendering a static page.
                const tags = (_cachedData_headers1 = cachedData.headers) == null ? void 0 : _cachedData_headers1[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_CACHE_TAGS_HEADER"]];
                if (isMinimalMode && isSSG && tags && typeof tags === 'string') {
                    res.setHeader(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_CACHE_TAGS_HEADER"], tags);
                }
                const matchedSegment = cachedData.segmentData.get(segmentPrefetchHeader);
                if (matchedSegment !== undefined) {
                    // Cache hit
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$render$2d$result$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].fromStatic(matchedSegment, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RSC_CONTENT_TYPE_HEADER"]),
                        cacheControl: cacheEntry.cacheControl
                    });
                }
                // Cache miss. Either a cache entry for this route has not been generated
                // (which technically should not be possible when PPR is enabled, because
                // at a minimum there should always be a fallback entry) or there's no
                // match for the requested segment. Respond with a 204 No Content. We
                // don't bother to respond with 404, because these requests are only
                // issued as part of a prefetch.
                res.statusCode = 204;
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                    req,
                    res,
                    generateEtags: nextConfig.generateEtags,
                    poweredByHeader: nextConfig.poweredByHeader,
                    result: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$render$2d$result$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].EMPTY,
                    cacheControl: cacheEntry.cacheControl
                });
            }
            // If there's a callback for `onCacheEntry`, call it with the cache entry
            // and the revalidate options. If we support RDC for Navigations, we
            // prefer the `onCacheEntryV2` callback. Once RDC for Navigations is the
            // default, we can remove the fallback to `onCacheEntry` as
            // `onCacheEntryV2` is now fully supported.
            const onCacheEntry = supportsRDCForNavigations ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'onCacheEntryV2') ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'onCacheEntry') : (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'onCacheEntry');
            if (onCacheEntry) {
                const finished = await onCacheEntry(cacheEntry, {
                    url: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$request$2d$meta$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRequestMeta"])(req, 'initURL') ?? req.url
                });
                if (finished) return null;
            }
            if (cachedData.headers) {
                const headers = {
                    ...cachedData.headers
                };
                if (!isMinimalMode || !isSSG) {
                    delete headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_CACHE_TAGS_HEADER"]];
                }
                for (let [key, value] of Object.entries(headers)){
                    if (typeof value === 'undefined') continue;
                    if (Array.isArray(value)) {
                        for (const v of value){
                            res.appendHeader(key, v);
                        }
                    } else if (typeof value === 'number') {
                        value = value.toString();
                        res.appendHeader(key, value);
                    } else {
                        res.appendHeader(key, value);
                    }
                }
            }
            // Add the cache tags header to the response if it exists and we're in
            // minimal mode while rendering a static page.
            const tags = (_cachedData_headers = cachedData.headers) == null ? void 0 : _cachedData_headers[__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_CACHE_TAGS_HEADER"]];
            if (isMinimalMode && isSSG && tags && typeof tags === 'string') {
                res.setHeader(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$lib$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_CACHE_TAGS_HEADER"], tags);
            }
            // If the request is a data request, then we shouldn't set the status code
            // from the response because it should always be 200. This should be gated
            // behind the experimental PPR flag.
            if (cachedData.status && (!isRSCRequest || !isRoutePPREnabled)) {
                res.statusCode = cachedData.status;
            }
            // Redirect information is encoded in RSC payload, so we don't need to use redirect status codes
            if (!isMinimalMode && cachedData.status && __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$redirect$2d$status$2d$code$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RedirectStatusCode"][cachedData.status] && isRSCRequest) {
                res.statusCode = 200;
            }
            // Mark that the request did postpone.
            if (didPostpone && !isDynamicRSCRequest) {
                res.setHeader(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NEXT_DID_POSTPONE_HEADER"], '1');
            }
            // we don't go through this block when preview mode is true
            // as preview mode is a dynamic request (bypasses cache) and doesn't
            // generate both HTML and payloads in the same request so continue to just
            // return the generated payload
            if (isRSCRequest && !isDraftMode) {
                // If this is a dynamic RSC request, then stream the response.
                if (typeof cachedData.rscData === 'undefined') {
                    // If the response is not an RSC response, then we can't serve it.
                    if (cachedData.html.contentType !== __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RSC_CONTENT_TYPE_HEADER"]) {
                        if (nextConfig.cacheComponents) {
                            res.statusCode = 404;
                            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                                req,
                                res,
                                generateEtags: nextConfig.generateEtags,
                                poweredByHeader: nextConfig.poweredByHeader,
                                result: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$render$2d$result$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].EMPTY,
                                cacheControl: cacheEntry.cacheControl
                            });
                        } else {
                            // Otherwise this case is not expected.
                            throw Object.defineProperty(new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$shared$2f$lib$2f$invariant$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvariantError"](`Expected RSC response, got ${cachedData.html.contentType}`), "__NEXT_ERROR_CODE", {
                                value: "E789",
                                enumerable: false,
                                configurable: true
                            });
                        }
                    }
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                        req,
                        res,
                        generateEtags: nextConfig.generateEtags,
                        poweredByHeader: nextConfig.poweredByHeader,
                        result: cachedData.html,
                        cacheControl: cacheEntry.cacheControl
                    });
                }
                // As this isn't a prefetch request, we should serve the static flight
                // data.
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                    req,
                    res,
                    generateEtags: nextConfig.generateEtags,
                    poweredByHeader: nextConfig.poweredByHeader,
                    result: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$render$2d$result$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].fromStatic(cachedData.rscData, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$client$2f$components$2f$app$2d$router$2d$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RSC_CONTENT_TYPE_HEADER"]),
                    cacheControl: cacheEntry.cacheControl
                });
            }
            // This is a request for HTML data.
            const body = cachedData.html;
            // If there's no postponed state, we should just serve the HTML. This
            // should also be the case for a resume request because it's completed
            // as a server render (rather than a static render).
            if (!didPostpone || isMinimalMode || isRSCRequest) {
                // If we're in test mode, we should add a sentinel chunk to the response
                // that's between the static and dynamic parts so we can compare the
                // chunks and add assertions.
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                    req,
                    res,
                    generateEtags: nextConfig.generateEtags,
                    poweredByHeader: nextConfig.poweredByHeader,
                    result: body,
                    cacheControl: cacheEntry.cacheControl
                });
            }
            // If we're debugging the static shell or the dynamic API accesses, we
            // should just serve the HTML without resuming the render. The returned
            // HTML will be the static shell so all the Dynamic API's will be used
            // during static generation.
            if (isDebugStaticShell || isDebugDynamicAccesses) {
                // Since we're not resuming the render, we need to at least add the
                // closing body and html tags to create valid HTML.
                body.push(new ReadableStream({
                    start (controller) {
                        controller.enqueue(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$stream$2d$utils$2f$encoded$2d$tags$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ENCODED_TAGS"].CLOSED.BODY_AND_HTML);
                        controller.close();
                    }
                }));
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                    req,
                    res,
                    generateEtags: nextConfig.generateEtags,
                    poweredByHeader: nextConfig.poweredByHeader,
                    result: body,
                    cacheControl: {
                        revalidate: 0,
                        expire: undefined
                    }
                });
            }
            // If we're in test mode, we should add a sentinel chunk to the response
            // that's between the static and dynamic parts so we can compare the
            // chunks and add assertions.
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            // This request has postponed, so let's create a new transformer that the
            // dynamic data can pipe to that will attach the dynamic data to the end
            // of the response.
            const transformer = new TransformStream();
            body.push(transformer.readable);
            // Perform the render again, but this time, provide the postponed state.
            // We don't await because we want the result to start streaming now, and
            // we've already chained the transformer's readable to the render result.
            doRender({
                span,
                postponed: cachedData.postponed,
                // This is a resume render, not a fallback render, so we don't need to
                // set this.
                fallbackRouteParams: null,
                forceStaticRender: false
            }).then(async (result)=>{
                var _result_value;
                if (!result) {
                    throw Object.defineProperty(new Error('Invariant: expected a result to be returned'), "__NEXT_ERROR_CODE", {
                        value: "E463",
                        enumerable: false,
                        configurable: true
                    });
                }
                if (((_result_value = result.value) == null ? void 0 : _result_value.kind) !== __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$response$2d$cache$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CachedRouteKind"].APP_PAGE) {
                    var _result_value1;
                    throw Object.defineProperty(new Error(`Invariant: expected a page response, got ${(_result_value1 = result.value) == null ? void 0 : _result_value1.kind}`), "__NEXT_ERROR_CODE", {
                        value: "E305",
                        enumerable: false,
                        configurable: true
                    });
                }
                // Pipe the resume result to the transformer.
                await result.value.html.pipeTo(transformer.writable);
            }).catch((err)=>{
                // An error occurred during piping or preparing the render, abort
                // the transformers writer so we can terminate the stream.
                transformer.writable.abort(err).catch((e)=>{
                    console.error("couldn't abort transformer", e);
                });
            });
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$send$2d$payload$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendRenderResult"])({
                req,
                res,
                generateEtags: nextConfig.generateEtags,
                poweredByHeader: nextConfig.poweredByHeader,
                result: body,
                // We don't want to cache the response if it has postponed data because
                // the response being sent to the client it's dynamic parts are streamed
                // to the client on the same request.
                cacheControl: {
                    revalidate: 0,
                    expire: undefined
                }
            });
        };
        // TODO: activeSpan code path is for when wrapped by
        // next-server can be removed when this is no longer used
        if (activeSpan) {
            await handleResponse(activeSpan);
        } else {
            return await tracer.withPropagatedContext(req.headers, ()=>tracer.trace(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BaseServerSpan"].handleRequest, {
                    spanName: `${method} ${srcPage}`,
                    kind: __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$lib$2f$trace$2f$tracer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SpanKind"].SERVER,
                    attributes: {
                        'http.method': method,
                        'http.target': req.url
                    }
                }, handleResponse));
        }
    } catch (err) {
        if (!(err instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$next$2f$dist$2f$shared$2f$lib$2f$no$2d$fallback$2d$error$2e$external$2e$js__$5b$external$5d$__$28$next$2f$dist$2f$shared$2f$lib$2f$no$2d$fallback$2d$error$2e$external$2e$js$2c$__cjs$29$__["NoFallbackError"])) {
            const silenceLog = false;
            await routeModule.onRequestError(req, err, {
                routerKind: 'App Router',
                routePath: srcPage,
                routeType: 'render',
                revalidateReason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$instrumentation$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRevalidateReason"])({
                    isStaticGeneration: isSSG,
                    isOnDemandRevalidate
                })
            }, silenceLog, routerServerContext);
        }
        // rethrow so that we can handle serving error page
        throw err;
    }
}
// TODO: omit this from production builds, only test builds should include it
/**
 * Creates a readable stream that emits a PPR boundary sentinel.
 *
 * @returns A readable stream that emits a PPR boundary sentinel.
 */ function createPPRBoundarySentinel() {
    return new ReadableStream({
        start (controller) {
            controller.enqueue(new TextEncoder().encode('<!-- PPR_BOUNDARY_SENTINEL -->'));
            controller.close();
        }
    });
} //# sourceMappingURL=app-page.js.map
}),
"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/templates/app-page.js?page=/[userId]/practice/[category]/page { GLOBAL_ERROR_MODULE => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)\", METADATA_0 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico.mjs { IMAGE => \\\"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico (static in ecmascript, tag client)\\\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)\", MODULE_1 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_2 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_3 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_4 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_5 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_6 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)\", MODULE_7 => \"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/[category]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)\" } [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ClientPageRoot",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["ClientPageRoot"],
    "ClientSegmentRoot",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["ClientSegmentRoot"],
    "Fragment",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["Fragment"],
    "GlobalError",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29$__["default"],
    "HTTPAccessFallbackBoundary",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["HTTPAccessFallbackBoundary"],
    "LayoutRouter",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["LayoutRouter"],
    "Postpone",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["Postpone"],
    "RenderFromTemplateContext",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["RenderFromTemplateContext"],
    "RootLayoutBoundary",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["RootLayoutBoundary"],
    "SegmentViewNode",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["SegmentViewNode"],
    "SegmentViewStateNode",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["SegmentViewStateNode"],
    "__next_app__",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$app$2d$page$2e$js$3f$page$3d2f5b$userId$5d2f$practice$2f5b$category$5d2f$page__$7b$__GLOBAL_ERROR_MODULE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__METADATA_0__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$5c225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$295c22$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_1__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_2__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$not$2d$found$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_3__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$forbidden$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_4__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$unauthorized$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_5__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_6__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_7__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f5b$category$5d2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["__next_app__"],
    "actionAsyncStorage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["actionAsyncStorage"],
    "captureOwnerStack",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["captureOwnerStack"],
    "collectSegmentData",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["collectSegmentData"],
    "createElement",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createElement"],
    "createMetadataComponents",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createMetadataComponents"],
    "createPrerenderParamsForClientSegment",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createPrerenderParamsForClientSegment"],
    "createPrerenderSearchParamsForClientPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createPrerenderSearchParamsForClientPage"],
    "createServerParamsForServerSegment",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createServerParamsForServerSegment"],
    "createServerSearchParamsForServerPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createServerSearchParamsForServerPage"],
    "createTemporaryReferenceSet",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["createTemporaryReferenceSet"],
    "decodeAction",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["decodeAction"],
    "decodeFormState",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["decodeFormState"],
    "decodeReply",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["decodeReply"],
    "handler",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$app$2d$page$2e$js$3f$page$3d2f5b$userId$5d2f$practice$2f5b$category$5d2f$page__$7b$__GLOBAL_ERROR_MODULE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__METADATA_0__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$5c225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$295c22$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_1__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_2__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$not$2d$found$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_3__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$forbidden$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_4__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$unauthorized$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_5__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_6__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_7__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f5b$category$5d2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["handler"],
    "patchFetch",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["patchFetch"],
    "preconnect",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["preconnect"],
    "preloadFont",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["preloadFont"],
    "preloadStyle",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["preloadStyle"],
    "prerender",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["prerender"],
    "renderToReadableStream",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["renderToReadableStream"],
    "routeModule",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$app$2d$page$2e$js$3f$page$3d2f5b$userId$5d2f$practice$2f5b$category$5d2f$page__$7b$__GLOBAL_ERROR_MODULE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__METADATA_0__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$5c225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$295c22$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_1__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_2__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$not$2d$found$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_3__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$forbidden$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_4__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$unauthorized$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_5__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_6__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_7__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f5b$category$5d2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["routeModule"],
    "serverHooks",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["serverHooks"],
    "taintObjectReference",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["taintObjectReference"],
    "workAsyncStorage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["workAsyncStorage"],
    "workUnitAsyncStorage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__["workUnitAsyncStorage"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$build$2f$templates$2f$app$2d$page$2e$js$3f$page$3d2f5b$userId$5d2f$practice$2f5b$category$5d2f$page__$7b$__GLOBAL_ERROR_MODULE__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__METADATA_0__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico$2e$mjs__$7b$__IMAGE__$3d3e$__$5c225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$295c22$__$7d$__$5b$app$2d$rsc$5d$__$28$structured__image__object$2c$__ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_1__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_2__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$not$2d$found$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_3__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$forbidden$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_4__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$unauthorized$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_5__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_6__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$layout$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29222c$__MODULE_7__$3d3e$__$225b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$app$2f5b$userId$5d2f$practice$2f5b$category$5d2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/build/templates/app-page.js?page=/[userId]/practice/[category]/page { GLOBAL_ERROR_MODULE => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)", METADATA_0 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico.mjs { IMAGE => \\"[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/favicon.ico (static in ecmascript, tag client)\\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", MODULE_1 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", MODULE_2 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/not-found.js [app-rsc] (ecmascript, Next.js Server Component)", MODULE_3 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/forbidden.js [app-rsc] (ecmascript, Next.js Server Component)", MODULE_4 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/unauthorized.js [app-rsc] (ecmascript, Next.js Server Component)", MODULE_5 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)", MODULE_6 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", MODULE_7 => "[project]/OneDrive/Desktop/shiftB/music-app/music-app/app/[userId]/practice/[category]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)" } [app-rsc] (ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$builtin$2f$global$2d$error$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__Server__Component$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/client/components/builtin/global-error.js [app-rsc] (ecmascript, Next.js Server Component)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$shiftB$2f$music$2d$app$2f$music$2d$app$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$app$2d$render$2f$entry$2d$base$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$2c$__Next$2e$js__server__utility$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/shiftB/music-app/music-app/node_modules/next/dist/esm/server/app-render/entry-base.js [app-rsc] (ecmascript, Next.js server utility)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e4a00fc3._.js.map