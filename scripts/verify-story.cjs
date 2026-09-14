const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs');const os=require('node:os');
const ROOT=path.resolve(__dirname,'..');const QA=process.env.ATELIER_QA_DIR || fs.mkdtempSync(path.join(os.tmpdir(),'caking-qa-'));
fs.mkdirSync(QA,{recursive:true});
(async()=>{
 const {createServer}=await import(pathToFileURL(path.join(ROOT,'node_modules/vite/dist/node/index.js')).href);const server=await createServer({root:ROOT,server:{host:'127.0.0.1',port:5182}});await server.listen();
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE,args:process.env.PLAYWRIGHT_EXECUTABLE ? ['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] : [],headless:true});
 const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('caking-save-v4')));
 const patch=async data=>{await p.evaluate(data=>{let s=JSON.parse(localStorage.getItem('caking-save-v4'));localStorage.setItem('caking-save-v4',JSON.stringify({...s,...data}))},data);await p.reload();if(await p.getByText("工房を再開する",{exact:true}).count()) await p.getByText("工房を再開する",{exact:true}).click();};
 try {
 await p.goto('http://127.0.0.1:5182/caking-game/');await p.getByText('スキップ',{exact:true}).click();
 assert.equal(await p.locator('.chapterList button').count(),8);
 assert.equal(await p.locator('.chapterList button:disabled').count(),7);
 await p.getByRole('button',{name:'営業スタート！'}).click();
 const openFirst=()=>p.getByRole('button',{name:'海風が運んだ鍵 読む',exact:true}).click();
 await openFirst();
 const before=await save();await p.waitForTimeout(5300);assert.deepEqual(await save(),before);
 assert.equal(await p.locator('.storyPortrait.isSpeaking img').getAttribute('alt'),'ミフィ');
 await p.getByRole('button',{name:'次へ',exact:true}).click();
 assert.equal(await p.locator('.storyPortrait.isSpeaking img').getAttribute('alt'),'ミル');
 await p.getByRole('button',{name:'前へ',exact:true}).click();
 await p.keyboard.press('Escape');assert.deepEqual((await save()).readStoryIds,[]);
 assert.ok(await p.getByRole('button',{name:'海風が運んだ鍵 読む',exact:true}).evaluate(el=>el===document.activeElement));
 await openFirst();await p.getByRole('button',{name:'次へ',exact:true}).click();
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await p.getByRole('button',{name:'工房を再開する',exact:true}).waitFor();
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await p.getByRole('button',{name:'工房を再開する',exact:true}).click();
 assert.equal(await p.locator('.storyReaderControls>span').textContent(),'2 / 5');
 for(let i=0;i<3;i++) await p.getByRole('button',{name:'次へ',exact:true}).click();
 await p.getByRole('button',{name:'読み終えて工房へ',exact:true}).click();
 assert.deepEqual((await save()).readStoryIds,['first-light']);await p.reload();
 await p.getByRole('button',{name:'工房を再開する',exact:true}).click();
 await p.getByRole('button',{name:'海風が運んだ鍵 読み返す',exact:true}).click();
 assert.equal(await p.locator('.storyReaderControls>span').textContent(),'1 / 5');await p.keyboard.press('Escape');
 await patch({level:10,dayPhase:'prep'});
 const {STORY_CHAPTERS}=await import(pathToFileURL(path.join(ROOT,'src/game/story.js')).href);
 for(const chapter of STORY_CHAPTERS){
   await p.getByRole('button',{name:new RegExp('^'+chapter.title+' ')}).click();
   for(let i=0;i<4;i++) await p.getByRole('button',{name:'次へ',exact:true}).click();
   await p.getByRole('button',{name:'読み終えて工房へ',exact:true}).click();
 }
 assert.equal((await save()).readStoryIds.length,8);
 for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.getByRole('button',{name:'海風が運んだ鍵 読み返す',exact:true}).click();
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
   assert.ok(await p.locator('.storyPortrait img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)));
   await p.keyboard.press('Escape');
 }
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'海風が運んだ鍵 読み返す',exact:true}).click();
 assert.equal(await p.locator('.storyPortrait.isSpeaking img').evaluate(el=>getComputedStyle(el).animationName),'none');
 if(process.env.STORY_QA_FONT){await p.addStyleTag({content:`@font-face{font-family:StoryQA;src:url(data:font/woff2;base64,${fs.readFileSync(process.env.STORY_QA_FONT).toString('base64')})}body,button{font-family:StoryQA,sans-serif!important}`});await p.evaluate(()=>document.fonts.ready);}
 await p.setViewportSize({width:390,height:844});
 await p.screenshot({path:path.join(QA,'story.png')});assert.deepEqual(errors,[]);
 console.log('PASS: 8 chapters/40 dialogue beats, locks, timer freeze, previous/next/close/focus, visibility/resume, completion/reload/replay, 3 widths, portraits and reduced motion; no page errors');
 }finally {await b.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
