import { chromium } from '@playwright/test';
const b=await chromium.launch();const c=await b.newContext({viewport:{width:1280,height:900}});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('muscu-auth',JSON.stringify({email:'v@test.fr',name:'V'})));
await p.goto('http://127.0.0.1:4321/',{waitUntil:'networkidle'});
const logo=p.locator('.sidebar__logo-icon');
console.log('visible:',await logo.isVisible(),'natural:',await logo.evaluate(i=>[i.naturalWidth,i.naturalHeight]),'errors:',errs.length);
await p.screenshot({path:'/home/agent/scratch/tmp/logo-sidebar.png'});
await c.close();
