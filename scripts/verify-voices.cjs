const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const {createServer} = await import(pathToFileURL(path.join(ROOT, 'node_modules/vite/dist/node/index.js')));
  const server = await createServer({root: ROOT, server: {host:'127.0.0.1',port:5184}, logLevel:'silent'});
  await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE,headless:true,
    args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage(); const errors=[];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5184/caking-game/');
    await page.getByText('スキップ',{exact:true}).click();
    const played = await page.evaluate(async () => {
      const {audioBus: bus} = await import('/caking-game/src/game/audio.js');
      const {VOICE_KEYS} = await import('/caking-game/src/game/audioAssets.js');
      const manifest = await (await fetch('/caking-game/sounds/manifest.json')).json();
      const done=[];
      for (const key of VOICE_KEYS) {
        const bytes = await (await fetch(`/caking-game/sounds/${key}.mp3`)).arrayBuffer();
        if (bytes.byteLength !== manifest.assets.find(a => a.file === key+'.mp3').bytes) throw Error('stale voice '+key);
        const buffer=await bus.ctx.decodeAudioData(bytes);
        if (buffer.duration < .3 || buffer.duration > 2.5 || buffer.numberOfChannels !== 2) throw Error('invalid voice '+key);
        const previous=bus.activeVoice;
        bus.playVoice(key);
        await new Promise((resolve,reject) => {
          const timeout=setTimeout(()=>reject(Error('voice playback timed out')),7000);
          const start=performance.now();
          const poll=setInterval(() => {
            if (bus.activeVoice !== previous && bus.activeVoice) {
              clearInterval(poll); bus.activeVoice.addEventListener('ended',()=>{clearTimeout(timeout);resolve();},{once:true});
            } else if (performance.now()-start>5000) {clearInterval(poll);clearTimeout(timeout);reject(Error('voice did not start'));}
          },5);
        });
        done.push(key);
      }
      bus.configure({...bus.settings, voiceMuted:true});
      bus.playVoice(VOICE_KEYS[0]);
      await new Promise(resolve=>setTimeout(resolve,100));
      if (bus.activeVoice) throw Error('muted voice started');
      return done;
    });
    assert.equal(played.length,9); assert.deepEqual(errors,[]);
    await page.getByRole('button',{name:'設定を開く',exact:true}).click();
    assert.ok(await page.getByText(/ミフィ：VOICEVOX:四国めたん/).isVisible());
    console.log('PASS: 9 current MP3 files decoded and played to completion, voice mute, credits, no page errors');
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
