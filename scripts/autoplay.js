/* Dev tool (not part of the app): plays a lesson automatically to check it end to end.
   1. Open lesson.html?id=<id>&debug&all
   2. In the browser console, load this file:
        document.body.append(Object.assign(document.createElement("script"), { src: "scripts/autoplay.js" }))
   3. Run:  await playUnit(0, "en")              play unit 1 in English
            await playUnit(2, "as", ["mcq"])     unit 3 in Assamese, answering the first mcq wrong
            await practise()                     play the "Practise your mistakes" round
            await playRun()                      play an open round (daily review, era checkpoint) */
(() => {
const sl=ms=>new Promise(r=>setTimeout(r,ms)); const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const click=el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})); const act=()=>click($('#action')); const isAS=()=>$('#as').checked;
async function solve(s, wrong){
  const scr=$('#screen'); const lg=isAS()?'as':'en';
  switch(s.type){
    case 'story': act(); return 'story';
    case 'mcq': case 'odd': case 'inline': case 'picture': case 'whoami':
      click($('[data-opt="'+(wrong?(s.answer+1)%s.options.length:s.answer)+'"]',scr)); await sl(3); act(); break;
    case 'tf': click($('[data-tf="'+((wrong?!s.answer:s.answer)?1:0)+'"]',scr)); break;
    case 'fill': if(isAS()) click($('[data-chip="'+(wrong?(s.asAnswer+1)%4:s.asAnswer)+'"]',scr)); else { const i=$('.en input',scr); i.value=wrong?'x'.repeat(s.answer.length-1):s.answer.slice(1); i.dispatchEvent(new Event('input',{bubbles:true})); } await sl(3); act(); break;
    case 'map': { const id = wrong? s.choices.find(c=>c!==s.target): s.target; const h=$('.hit[data-place="'+id+'"]',scr); click(h.querySelector('.zone,.dot')||h); await sl(3); act(); break; }
    case 'unscramble': { const word=s.word[lg]; for(const ch of word){ const t=$$('.letters[data-lang="'+lg+'"] .tile',scr).find(x=>!x.classList.contains('used')&&x.textContent===ch); click(t); await sl(2);} act(); break; }
    case 'spot': click($('.tok[data-lang="'+lg+'"][data-tok="'+(wrong?0:s.wrong[lg])+'"]',scr)); await sl(3); act(); break;
    case 'order': { const ids = wrong ? [1,0,...s.items.map((_,k)=>k).slice(2)] : s.items.map((_,k)=>k); for(const k of ids){ click($('.bank [data-step="'+k+'"]',scr)); await sl(2);} act(); break; }
    case 'match': for(let k=0;k<s.pairs.length;k++){ click($('[data-side=left] [data-pair="'+k+'"]',scr)); click($('[data-side=right] [data-pair="'+k+'"]',scr)); await sl(2);} break;
    case 'timeline': for(let k=0;k<s.items.length;k++){ click($('.tbank [data-item="'+k+'"]',scr)); await sl(2); click($('.tslot[data-slot="'+(wrong?(s.items[k].slot+1)%3:s.items[k].slot)+'"]',scr)); await sl(2);} act(); break;
  }
  await sl(8); const r=$('#foot').className.includes('good')?'✓':$('#foot').className.includes('bad')?'✗':'?'; act(); return s.type+r;
}
window.playUnit = async function(k, lang, wrongTypes=[]){
  const want = lang==='as'; if(isAS()!==want){ $('#as').checked=want; $('#as').dispatchEvent(new Event('change')); }
  await sl(10); click($('[data-node="'+k+'"]')); await sl(5); click($('[data-start="'+k+'"]')); await sl(10);
  const seq=[]; let g=0; const wd=new Set();
  while($('#v-play').classList.contains('on') && g++<40){ const U=__L.run(); const it=U.queue[U.pos]; const w=!it.retry && wrongTypes.includes(it.s.type) && !wd.has(it.s.type); if(w) wd.add(it.s.type); seq.push((it.retry?'R:':'')+await solve(it.s,w)); await sl(8); }
  const done=$('#v-done').classList.contains('on'); const st=[...document.querySelectorAll('#done .stat .v')].map(v=>v.textContent.replace(/[০-৯]/g,'')).join('|');
  click($('#done-btn')); await sl(10);
  return 'U'+(k+1)+' '+lang+' '+(done?'DONE':'STUCK')+' ['+st+'] '+seq.join(' ');
};
window.practise = async function(){ const b=$('#practise'); if(!b) return 'no practise card'; click(b); await sl(10); const seq=[]; let g=0; while($('#v-play').classList.contains('on') && g++<30){ const U=__L.run(); const it=U.queue[U.pos]; seq.push(await solve(it.s,false)); await sl(8);} const t=$('#done h1').textContent; click($('#done-btn')); await sl(10); return 'PRACTICE '+t+' :: '+seq.join(' '); };
window.playRun = async function(wrongEvery=0){ const seq=[]; let g=0; while($('#v-play').classList.contains('on') && g++<60){ const U=__L.run(); const it=U.queue[U.pos]; seq.push(await solve(it.s, wrongEvery && g%wrongEvery===0)); await sl(8);} return ($('#done h1')||{}).textContent+' :: '+seq.join(' '); };
window.solveStep = solve;
window.solverReady = true;
})();
