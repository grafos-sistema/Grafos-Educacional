C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\services\users.service.ts:611  POST https://hwbnmnbieqcxbejtbsdu.supabase.co/functions/v1/admin-create-user 403 (Forbidden)
eval @ index.mjs:386
eval @ index.mjs:411
await in eval
eval @ helper.js:7
eval @ FunctionsClient.js:254
eval @ tslib.es6.mjs:157
__awaiter @ tslib.es6.mjs:153
invoke @ FunctionsClient.js:184
create @ C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\services\users.service.ts:611
(anonymous) @ C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\lib\institution-unit-directors.ts:57
resolveInstitutionUnitDirectors @ C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\lib\institution-unit-directors.ts:39
(anonymous) @ C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\app\(authenticated)\super-admin\institutions\new\page.tsx:60
await in (anonymous)
eval @ index.esm.mjs:2142
await in eval
executeDispatch @ react-dom-client.development.js:20611
runWithFiberInDEV @ react-dom-client.development.js:987
processDispatchQueue @ react-dom-client.development.js:20661
eval @ react-dom-client.development.js:21235
batchedUpdates$1 @ react-dom-client.development.js:3378
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20815
dispatchEvent @ react-dom-client.development.js:25818
dispatchDiscreteEvent @ react-dom-client.development.js:25786
C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\app\(authenticated)\super-admin\institutions\new\page.tsx:79 Erro ao cadastrar instituição: Error: Você não tem permissão para redefinir a senha deste usuário.
    at Object.create (C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\services\users.service.ts:618:17)
    at async eval (C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\lib\institution-unit-directors.ts:57:33)
    at async Promise.all (index 0)
    at async onSubmit (C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\app\(authenticated)\super-admin\institutions\new\page.tsx:60:34)
    at async eval (index.esm.mjs:2142:17)
error @ intercept-console-error.js:58
(anonymous) @ C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\app\(authenticated)\super-admin\institutions\new\page.tsx:79
await in (anonymous)
eval @ index.esm.mjs:2142
await in eval
executeDispatch @ react-dom-client.development.js:20611
runWithFiberInDEV @ react-dom-client.development.js:987
processDispatchQueue @ react-dom-client.development.js:20661
eval @ react-dom-client.development.js:21235
batchedUpdates$1 @ react-dom-client.development.js:3378
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20815
dispatchEvent @ react-dom-client.development.js:25818
dispatchDiscreteEvent @ react-dom-client.development.js:25786
index.mjs:386  POST https://hwbnmnbieqcxbejtbsdu.supabase.co/rest/v1/institutions?select=id 409 (Conflict)
eval @ index.mjs:386
eval @ index.mjs:411
await in eval
executeWithRetry @ index.mjs:306
then @ index.mjs:335
C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\app\(authenticated)\super-admin\institutions\new\page.tsx:79 Erro ao cadastrar instituição: {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "institutions_slug_key"'}code: "23505"details: nullhint: nullmessage: "duplicate key value violates unique constraint \"institutions_slug_key\""[[Prototype]]: Object
error @ intercept-console-error.js:58
(anonymous) @ C:\Users\Eric Victor\Documents\GitHub\Grafos-Educacional\frontend\src\app\(authenticated)\super-admin\institutions\new\page.tsx:79
await in (anonymous)
eval @ index.esm.mjs:2142
await in eval
executeDispatch @ react-dom-client.development.js:20611
runWithFiberInDEV @ react-dom-client.development.js:987
processDispatchQueue @ react-dom-client.development.js:20661
eval @ react-dom-client.development.js:21235
batchedUpdates$1 @ react-dom-client.development.js:3378
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20815
dispatchEvent @ react-dom-client.development.js:25818
dispatchDiscreteEvent @ react-dom-client.development.js:25786
