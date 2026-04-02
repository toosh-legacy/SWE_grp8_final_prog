module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/StudyGroup.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StudyGroup",
    ()=>StudyGroup
]);
class StudyGroup {
    name;
    description;
    courses;
    visibility;
    creator;
    constructor(name, description, courses, visibility, creator){
        this.name = name;
        this.description = description;
        this.courses = courses;
        this.visibility = visibility;
        this.creator = creator;
    }
}
}),
"[project]/lib/Msg.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Msg",
    ()=>Msg
]);
class Msg {
    message;
    constructor(message){
        this.message = message;
    }
}
}),
"[project]/lib/GroupController.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GroupController",
    ()=>GroupController
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$StudyGroup$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/StudyGroup.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$Msg$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/Msg.ts [app-route] (ecmascript)");
;
;
class GroupController {
    db;
    constructor(db){
        this.db = db;
    }
    async createGroup(name, description, courses, visibility, creator) {
        if (!name || name.trim() === '') throw new Error('Name is required');
        if (name.length > 255) throw new Error('Name too long');
        if (!creator || creator.trim() === '') throw new Error('Creator is required');
        const g = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$StudyGroup$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StudyGroup"](name, description, courses, visibility, creator);
        await this.db.saveStudyGroup(g);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$Msg$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Msg"]('Study Group Created');
    }
}
}),
"[project]/lib/DBMgr.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DBMgr",
    ()=>DBMgr
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
class DBMgr {
    supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    async saveStudyGroup(g) {
        const { error } = await this.supabase.from('study_groups').insert([
            g
        ]);
        if (error) throw new Error(error.message);
    }
}
}),
"[project]/app/api/groups/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40f94c23647d1af643750a9ea6540abac848d54d63":{"name":"POST"}},"app/api/groups/route.ts",""] */ __turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$GroupController$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/GroupController.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$DBMgr$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/DBMgr.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
async function POST(req) {
    const { name, description, courses, visibility, creator } = await req.json();
    const controller = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$GroupController$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GroupController"](new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$DBMgr$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DBMgr"]());
    try {
        const msg = await controller.createGroup(name, description, courses, visibility, creator);
        return new Response(JSON.stringify({
            message: msg.message
        }), {
            status: 201
        });
    } catch (e) {
        return new Response(JSON.stringify({
            error: e.message
        }), {
            status: 400
        });
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    POST
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(POST, "40f94c23647d1af643750a9ea6540abac848d54d63", null);
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__06uwp5x._.js.map