const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..');
// Track every AudioContext the page creates so state can be read from outside.
const track=()=>{const O=window.AudioContext;window.__ctxs=[];window.AudioContext=class extends O{constructor(...a){super(...a);window.__ctxs.push(this);}};window.webkitAudioContext=window.AudioContext;};
const st=p=>p.evaluate(()=>window.__ctxs.map(c=>c.state));
(async()=>{
 const {createServer}=await import(pathToFileURL(path.join(ROOT,'node_modules/vite/dist/node/index.js')).href);
 const server=await createServer({root:ROOT,server:{host:'127.0.0.1',port:5181},logLevel:'silent'});await server.listen();
 const url='http://127.0.0.1:5181/caking-game/';
 const run=async(policy,fn)=>{const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE,headless:true,args:['--no-sandbox',`--autoplay-policy=${policy}`]});const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(track);try{await fn(p);assert.deepEqual(errs,[]);}finally{await b.close();}};
 try{
  // 1. Autoplay allowed (installed PWA): audio runs with no tap.
  await run('no-user-gesture-required',async p=>{await p.goto(url);await p.waitForTimeout(2500);const s=await st(p);console.log('allowed, no tap:',s);assert.ok(s.includes('running'));});
  // 2. Autoplay blocked: a tap brings it up. Headless Chromium ignores the blocking policy, so the pre-tap state is logged, not asserted.
  await run('user-gesture-required',async p=>{await p.goto(url);await p.waitForTimeout(2000);const s0=await st(p);console.log('blocked, no tap:',s0);await p.mouse.click(5,5);await p.waitForTimeout(800);const s1=await st(p);console.log('blocked, after tap:',s1);assert.ok(s1.includes('running'));});
  // 3. Relaunch mid-business with autoplay allowed: stays silent behind the resume dialog, runs after resume.
  await run('no-user-gesture-required',async p=>{await p.goto(url);await p.getByText('スキップ',{exact:true}).click();await p.getByRole('button',{name:'営業スタート！'}).click();await p.waitForTimeout(500);
   await p.reload();await p.getByRole('button',{name:'工房を再開する',exact:true}).waitFor();await p.waitForTimeout(2500);const s=await st(p);console.log('relaunch paused:',s);assert.ok(!s.includes('running'));
   await p.mouse.click(5,5);await p.waitForTimeout(500);const s2=await st(p);console.log('paused, stray tap:',s2);assert.ok(!s2.includes('running'));
   await p.getByRole('button',{name:'工房を再開する',exact:true}).click();await p.waitForTimeout(800);const s3=await st(p);console.log('after resume:',s3);assert.ok(s3.includes('running'));
   // 4. Pause button during business keeps audio suspended through retries.
   await p.getByRole('button',{name:'一時停止',exact:true}).click();await p.waitForTimeout(2000);const s4=await st(p);console.log('pause button:',s4);assert.ok(!s4.includes('running'));
   await p.getByRole('button',{name:'工房を再開する',exact:true}).click();await p.waitForTimeout(800);assert.ok((await st(p)).includes('running'));
   // 5. Hidden -> visible: pause dialog shows, audio stays down.
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(500);
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(2000);
   const s5=await st(p);console.log('after hide/show:',s5);assert.ok(!s5.includes('running'));assert.ok(await p.getByRole('button',{name:'工房を再開する',exact:true}).isVisible());
  });
  console.log('ALL PASS');
 }finally{await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
