const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs');const os=require('node:os');
const ROOT=path.resolve(__dirname,'..');const QA=process.env.ATELIER_QA_DIR || fs.mkdtempSync(path.join(os.tmpdir(),'caking-qa-'));
fs.mkdirSync(QA,{recursive:true});
(async()=>{
 const {createServer}=await import(pathToFileURL(path.join(ROOT,'node_modules/vite/dist/node/index.js')).href);const server=await createServer({root:ROOT,server:{host:'127.0.0.1',port:5173}});await server.listen();
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE,args:process.env.PLAYWRIGHT_EXECUTABLE ? ['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] : [],headless:true});
 const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('caking-save-v4')));
 const patch=async data=>{await p.evaluate(data=>{let s=JSON.parse(localStorage.getItem('caking-save-v4'));localStorage.setItem('caking-save-v4',JSON.stringify({...s,...data}))},data);await p.reload();if(await p.getByText("工房を再開する",{exact:true}).count()) await p.getByText("工房を再開する",{exact:true}).click();};
 try {
 await p.goto('http://127.0.0.1:5173/caking-game/');await p.getByText('スキップ',{exact:true}).click();
 await p.getByRole('button',{name:'営業スタート！'}).click();assert.equal((await save()).dayPhase,'open');assert.equal(await p.locator('.shopGuest').count(),2);
 // Manual pause and reload must preserve business time, inventory and earnings.
 await p.getByRole('button',{name:'一時停止',exact:true}).click();
 const pausedSave=await save();await p.waitForTimeout(5200);assert.deepEqual(await save(),pausedSave);
 await p.reload();await p.getByRole('button',{name:'工房を再開する'}).waitFor();
 await p.waitForTimeout(1200);assert.equal((await save()).businessTimer,pausedSave.businessTimer);
 await p.getByRole('button',{name:'工房を再開する'}).click();await p.waitForTimeout(1100);assert.ok((await save()).businessTimer<pausedSave.businessTimer);
 // Simulated OS visibility event exercises the actual lifecycle handler.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 const hiddenSave=await save();await p.waitForTimeout(1200);assert.deepEqual(await save(),hiddenSave);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await p.getByRole('button',{name:'工房を再開する'}).click();
 console.log('PASS: manual pause, hidden page, reload and explicit resume');
 await p.locator('.shopGuest').first().click();await p.waitForTimeout(300);
 const before=await save();await p.getByRole('button',{name:'つくる',exact:true}).first().evaluate(el=>{el.click();el.click()});
 assert.equal((await save()).craftCount,before.craftCount+1);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await p.getByRole('button',{name:'工房を再開する'}).waitFor();
 const duringCraft=await save();await p.waitForTimeout(2800);assert.deepEqual(await save(),duringCraft);
 assert.equal(await p.locator('.productionStep--0').count(),1);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await p.getByRole('button',{name:'工房を再開する'}).click();
await p.getByText('演出をスキップ',{exact:true}).click();await p.waitForTimeout(1600);assert.equal(await p.getByText('演出をスキップ',{exact:true}).count(),0);await p.getByText('工房にもどる',{exact:true}).click();
 await p.getByRole('button',{name:'デコレーション',exact:true}).click();await p.locator('.partCard').filter({hasText:'小さなハーブ園'}).getByText('Pで購入',{exact:true}).click();await p.locator('.partCard').filter({hasText:'小さなハーブ園'}).getByText('飾る',{exact:true}).click();assert.equal((await save()).cakeStyle.top,'mint');
 await p.locator('.partCard').filter({hasText:'港町の小さな王冠'}).getByRole('button',{name:'港町の小さな王冠を試着'}).click();assert.equal((await save()).cakeStyle.top,'mint');assert.equal(await p.locator('.partCard').filter({hasText:'港町の小さな王冠'}).getByText('試着のみ',{exact:true}).isDisabled(),true);
 await p.screenshot({path:path.join(QA,'atelier.png'),fullPage:true});await p.reload();assert.equal((await save()).cakeStyle.top,'mint');
 await patch({dayPhase:'open',businessTimer:1,materials:{egg:30,cream:30,strawberry:30,flour:30,sugar:30,milk:30,butter:30}});
 await p.getByRole('button',{name:'レシピ',exact:true}).click();await p.getByRole('button',{name:'つくる',exact:true}).first().click();await p.waitForTimeout(2700);
 assert.equal((await save()).dayPhase,'report');assert.equal(await p.locator('.productionCard').evaluate(el=>getComputedStyle(el).opacity),'1');assert.equal(await p.locator('.reportCard').count(),0);
 await p.screenshot({path:path.join(QA,'craft.png')});await p.getByText('工房にもどる',{exact:true}).click();await p.getByRole('button',{name:'次の日へ'}).click();assert.equal((await save()).dayNumber,2);
 await patch({dayPhase:'prep',level:10,money:100001,endingReached:false,materials:{egg:30,cream:30,strawberry:30,flour:30,sugar:30,milk:30,butter:30}});
 await p.getByRole('button',{name:'レシピ',exact:true}).click();await p.getByRole('button',{name:'つくる',exact:true}).first().click();await p.getByText('演出をスキップ',{exact:true}).click();await p.getByText('工房にもどる',{exact:true}).click();await p.getByText('つづける',{exact:true}).click();
 await p.getByRole('button',{name:'レシピ',exact:true}).click();await p.getByRole('button',{name:'つくる',exact:true}).first().click();assert.equal(await p.locator('.productionCard').count(),1);await p.getByText('演出をスキップ',{exact:true}).click();await p.getByText('工房にもどる',{exact:true}).click();
 const {RECIPES}=await import(pathToFileURL(path.join(ROOT,'src/game/data.js')).href);
 const {getCraftPresentation}=await import(pathToFileURL(path.join(ROOT,'src/game/craftPresentation.js')).href);
 for(const recipe of RECIPES){
   await patch({dayPhase:'prep',level:10,endingReached:true,materials:{egg:30,cream:30,strawberry:30,flour:30,sugar:30,milk:30,butter:30},ownedCakeParts:['berry','mint'],cakeStyle:{top:'mint',band:null}});
   await p.getByRole('button',{name:'レシピ',exact:true}).click();
   await p.locator('.recipeCard').filter({has:p.getByText(recipe.name,{exact:true})}).getByRole('button',{name:'つくる',exact:true}).click();
   const profile=getCraftPresentation(recipe.name);
   assert.equal(await p.locator('.craftStation--'+profile.steps[0].kind).count(),1);
   await p.waitForTimeout(950);assert.equal(await p.locator('.craftStation--'+profile.steps[1].kind).count(),1);
   await p.waitForTimeout(800);assert.equal(await p.locator('.craftStation--'+profile.steps[2].kind).count(),1);
   await p.getByText('演出をスキップ',{exact:true}).click();
   assert.equal(await p.locator('.finishedRecipe').getAttribute('data-shape'),profile.shape);
   await p.getByText('工房にもどる',{exact:true}).click();
 }
 console.log('PASS: all 8 recipes, 24 stage props, decorated recipe shapes');
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'つくる',exact:true}).first().click();assert.equal(await p.getByText('演出をスキップ',{exact:true}).count(),0);await p.getByText('工房にもどる',{exact:true}).click();
 for(const width of [320,390,430,768]) {await p.setViewportSize({width,height:844});for(const label of ['営業','レシピ','デコレーション','食材','スタッフ']){await p.getByRole('button',{name:label,exact:true}).click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${label}`);}}
 await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'営業',exact:true}).click();await p.screenshot({path:path.join(QA,'home.png'),fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: opening, guest-order link, double craft, skip, purchase/equip/reload, paid preview guard, report during production, next day, ending/continue, reduced motion, 20 viewport/tab overflow checks; no page errors');
 }finally {await b.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
