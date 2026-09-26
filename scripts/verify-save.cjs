const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs');const os=require('node:os');
const ROOT=path.resolve(__dirname,'..');const QA=process.env.ATELIER_QA_DIR || fs.mkdtempSync(path.join(os.tmpdir(),'caking-qa-'));
fs.mkdirSync(QA,{recursive:true});
(async()=>{
 const {createServer}=await import(pathToFileURL(path.join(ROOT,'node_modules/vite/dist/node/index.js')).href);const server=await createServer({root:ROOT,server:{host:'127.0.0.1',port:5180}});await server.listen();
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE,args:process.env.PLAYWRIGHT_EXECUTABLE ? ['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] : [],headless:true});
 const p=await b.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('caking-save-v4')));
 const patch=async data=>{await p.evaluate(data=>{let s=JSON.parse(localStorage.getItem('caking-save-v4'));localStorage.setItem('caking-save-v4',JSON.stringify({...s,...data}))},data);await p.reload();if(await p.getByText("工房を再開する",{exact:true}).count()) await p.getByText("工房を再開する",{exact:true}).click();};
 try {
 await p.goto('http://127.0.0.1:5180/caking-game/');
 await p.getByText('スキップ',{exact:true}).click();
 await p.getByRole('button',{name:'営業スタート！'}).click();
 await p.getByRole('button',{name:'設定を開く',exact:true}).click();
 const before=await save();await p.waitForTimeout(5400);assert.deepEqual(await save(),before);
 await p.getByRole('button',{name:'バックアップを作る',exact:true}).click();
 const exported=await p.getByLabel('保管するバックアップ').inputValue();
 const decoded=JSON.parse(exported);assert.equal(decoded.save.businessTimer,before.businessTimer);
 await p.getByText('バックアップから復元',{exact:true}).click();
 await p.getByLabel('バックアップの全文').fill('{bad');
 await p.getByRole('button',{name:'復元内容を確認',exact:true}).click();
 assert.ok(await p.getByText('バックアップを読み取れません。全文を貼り付けてください。',{exact:true}).isVisible());
 assert.deepEqual(await save(),before);
 const restore={...decoded,save:{...decoded.save,money:45678,level:6,dayNumber:9,ownedCakeParts:['berry','mint','ribbon'],cakeStyle:{top:'mint',band:'ribbon'}}};
 await p.getByLabel('バックアップの全文').fill(JSON.stringify(restore));
 await p.getByRole('button',{name:'復元内容を確認',exact:true}).click();
 assert.ok(await p.getByText('9日目・Lv6・45,678P',{exact:true}).isVisible());
 await p.getByRole('button',{name:'やめる',exact:true}).click();assert.deepEqual(await save(),before);
 await p.getByRole('button',{name:'復元内容を確認',exact:true}).click();
 await p.getByRole('button',{name:'この内容で復元する',exact:true}).click();
 await p.getByRole('button',{name:'工房を再開する',exact:true}).waitFor();
 const after=await save();assert.equal(after.money,45678);assert.deepEqual(after.cakeStyle,{top:'mint',band:'ribbon'});
 await p.waitForTimeout(1300);assert.deepEqual(await save(),after);
 await p.reload();await p.getByRole('button',{name:'工房を再開する',exact:true}).click();
 await p.getByRole('button',{name:'設定を開く',exact:true}).click();
 const slider=p.getByRole('slider',{name:'BGMの音量'});await slider.focus();await p.keyboard.press('ArrowLeft');
 assert.equal(await slider.evaluate(el=>el===document.activeElement),true);
 const last=p.getByRole('button',{name:'はじめから',exact:true});await last.focus();await p.keyboard.press('Tab');
 assert.equal(await p.getByRole('button',{name:'閉じる',exact:true}).evaluate(el=>el===document.activeElement),true);
 await p.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(el=>el===document.activeElement),true);
 await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'設定を開く',exact:true}).evaluate(el=>el===document.activeElement),true);
 await p.getByRole('button',{name:'レシピ',exact:true}).click();assert.ok(await p.getByRole('region',{name:'レシピ帳の完成度'}).isVisible());
 for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.getByRole('button',{name:'設定を開く',exact:true}).click();
   await p.getByRole('button',{name:'バックアップを作る',exact:true}).click();
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`settings overflow ${width}`);
   await p.keyboard.press('Escape');
 }
 // Simulate denied writes: warn persistently; allow export; never replace live progress on failed restore.
 await p.evaluate(()=>{window.__write=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')}});
 await p.getByRole('button',{name:'設定を開く',exact:true}).click();
 await p.getByRole('switch',{name:'サウンド',exact:true}).click();
 await p.getByRole('button',{name:'バックアップを作る',exact:true}).click();
 assert.ok((await p.getByLabel('保管するバックアップ').inputValue()).includes('CAKING-backup'));
 await p.getByText('バックアップから復元',{exact:true}).click();await p.getByLabel('バックアップの全文').fill(exported);
 await p.getByRole('button',{name:'復元内容を確認',exact:true}).click();await p.getByRole('button',{name:'この内容で復元する',exact:true}).click();
 assert.ok(await p.getByText('端末に保存できないため復元を中止しました。現在の進行は変更していません。',{exact:true}).isVisible());
 assert.equal((await save()).money,45678);
 await p.evaluate(()=>{Storage.prototype.setItem=window.__write});await p.getByRole('button',{name:'保存を再試行',exact:true}).click();
 assert.ok(await p.getByText('✓ この端末に保存済み',{exact:true}).isVisible());
 await p.screenshot({path:path.join(QA,'save-panel.png'),fullPage:true});
 await p.keyboard.press('Escape');
 // Recovery banner survives a successful rewrite of the recovered save.
 await p.evaluate(()=>localStorage.setItem('caking-save-v4','{broken'));await p.reload();
 await p.getByRole('button',{name:'工房を再開する',exact:true}).click();
 assert.ok(await p.getByText('保存データを控えから復旧しました。直前の操作が戻っている場合があります。',{exact:true}).isVisible());
 assert.deepEqual(errors,[]);
 console.log('PASS: settings freeze, export, invalid/cancelled/confirmed restore, reload pause, focus stability/trap/return, album, 3 widths, quota failure and retry, corruption recovery; no page errors');
 }finally {await b.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
