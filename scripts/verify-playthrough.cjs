const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs');const os=require('node:os');
const ROOT=path.resolve(__dirname,'..');const QA=process.env.ATELIER_QA_DIR || fs.mkdtempSync(path.join(os.tmpdir(),'caking-qa-'));
fs.mkdirSync(QA,{recursive:true});
(async()=>{
 const {createServer}=await import(pathToFileURL(path.join(ROOT,'node_modules/vite/dist/node/index.js')).href);const server=await createServer({root:ROOT,server:{host:'127.0.0.1',port:5181}});await server.listen();
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE,args:process.env.PLAYWRIGHT_EXECUTABLE ? ['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] : [],headless:true});
 const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('caking-save-v4')));
 const patch=async data=>{await p.evaluate(data=>{let s=JSON.parse(localStorage.getItem('caking-save-v4'));localStorage.setItem('caking-save-v4',JSON.stringify({...s,...data}))},data);await p.reload();if(await p.getByText("工房を再開する",{exact:true}).count()) await p.getByText("工房を再開する",{exact:true}).click();};
 try {
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.clock.install();
 await p.goto('http://127.0.0.1:5181/caking-game/');await p.getByText('スキップ',{exact:true}).click();
 await p.clock.pauseAt(await p.evaluate(()=>Date.now()+1000));
 const {RECIPES}=await import(pathToFileURL(path.join(ROOT,'src/game/data.js')).href);
 let reached=false, elapsed=0;
 for(let turn=0;turn<1500;turn++){
   const s=await save();
   if(s.gamePhase==='ending'){reached=true;console.log(`PASS: unmodified fresh save reached ending: level ${s.level}, money ${s.money}, crafts ${s.craftCount}, day ${s.dayNumber}, simulated seconds ${elapsed}`);break;}
   if(s.dayPhase==='report'){await p.getByRole('button',{name:'次の日へ'}).click();continue;}
   if(s.dayPhase==='prep'){await p.getByRole('button',{name:'営業スタート！'}).click();continue;}
   const ready=RECIPES.filter(r=>r.level<=s.level&&Object.entries(r.ingredients).every(([k,n])=>s.materials[k]>=n));
   ready.sort((a,b)=>{
     const wanted=r=>Number(s.customerQueue.some(c=>c.status==='waiting'&&c.orderRecipe===r.name));
     return wanted(b)-wanted(a)||b.exp-a.exp;
   });
   if(ready.length){
     await p.getByRole('button',{name:'レシピ',exact:true}).click();
     await p.locator('.recipeCard').filter({has:p.getByText(ready[0].name,{exact:true})}).getByRole('button',{name:'つくる',exact:true}).click();
     await p.getByRole('button',{name:'工房にもどる',exact:true}).click();
   }
   await p.clock.runFor(5000);elapsed+=5;
   if(turn%100===0) console.log(`progress ${turn}: Lv${s.level}, ${s.money}P, day ${s.dayNumber}`);
 }
 assert.ok(reached,'fresh game must reach ending within the simulated play budget');
 await p.getByText('つづける',{exact:true}).click();assert.equal((await save()).gamePhase,'playing');assert.deepEqual(errors,[]);
 console.log('PASS: no injected save, real crafting and regenerating materials, daily reports, ending and continued play; no page errors');
 }finally {await b.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
