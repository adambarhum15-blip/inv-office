(function(){
'use strict';
document.documentElement.lang='he';
document.documentElement.dir='rtl';

/* ---------- constants ---------- */
const M=6e4, H=36e5, D=864e5, ESC_MS=8*H, WD_HOUR=6;
const UKEY='inv-live-ui-v1';
const ALL_SHIFTS=['A','AC','MS','M','K','KC'];
/* the team as written in the spec; the live team is read from the database (team/roster) once it exists */
const DEFAULT_PEOPLE=(window.__LOCAL===true&&window.__SEED_PEOPLE)||[];
const ANCHOR='2026-01-04';
const DEPTS=[{id:'general',name:'כללי'},{id:'crimes',name:'פשעים'},{id:'youth',name:'נוער'},{id:'dv',name:'אלמ"ב'}];
const PRIO={high:{name:'גבוהה',rank:3},med:{name:'בינונית',rank:2},low:{name:'נמוכה',rank:1}};
const STATUS={open:'פתוחה',progress:'בביצוע',done:'בוצעה'};
const FIELDS=[
  ['cases','תיקים בטיפול','תיקים פעילים שטופלו במשמרת'],
  ['closed','תיקים שנסגרו','תיקים שהטיפול בהם הסתיים'],
  ['complaints','תלונות שנלקחו','תלונות חדשות שנגבו'],
  ['court','תיקים שסוכמו לדין','הועברו להמשך טיפול משפטי']
];
const DAYS=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const DSH=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];

/* shift codes: s = grid label, l = short label, n = official name, ds = description, t = second line, k = color kind */
const SH={
  A:{s:'א',l:'בוקר',n:'א',ds:'בוקר רגיל · 08:00',t:'08:00',k:'am'},
  AC:{s:'א-בימ"ש',l:'א-בימ"ש',n:'א-בימ"ש',ds:'בוקר בית משפט · 08:00',t:'08:00',k:'court'},
  MS:{s:'א-מש"ל',l:'א-מש"ל',n:'א-מש"ל',ds:'בוקר מש"ל קבוע · 08:00',t:'08:00',k:'am'},
  A9:{s:'א 09',l:'בוקר',n:'א-09:00',ds:'בוקר גמיש · 09:00',t:'09:00',k:'am'},
  M:{s:'מתואמת',l:'מתואמת',n:'מתואמת 12:00',ds:'משמרת ביניים',t:'12:00',k:'mid'},
  M14:{s:'מתואמת',l:'מתואמת',n:'מתואמת 14:00',ds:'משמרת ביניים',t:'14:00',k:'mid'},
  M15:{s:'מתואמת',l:'מתואמת',n:'מתואמת 15:00',ds:'משמרת ביניים',t:'15:00',k:'mid'},
  K:{s:'ב כונן',l:'ב כונן',n:'ב כונן',ds:'ערב וכוננות לילה · 17:00',t:'17:00',k:'night'},
  KC:{s:'ב-בימ"ש',l:'ב-בימ"ש',n:'ב-בימ"ש',ds:'בית משפט · מוצ"ש',t:'מוצ"ש',k:'court'},
  R1:{s:'הר הבית',l:'הר הבית',n:'א הר הבית',ds:'תגבור בוקר · 08:00',t:'תגבור',k:'reinf'},
  R2:{s:'תגב׳ מש"ל',l:'תגבור',n:'תגבור מש"ל',ds:'תגבור בוקר · 08:00',t:'תגבור',k:'reinf'},
  R3:{s:'תגבור 12',l:'תגבור',n:'תגבור צהריים',ds:'תגבור · 12:00',t:'12:00',k:'reinf'},
  MGR:{s:'ניהולי',l:'ניהולי',n:'ניהולי',ds:'תפקיד ניהולי',t:'',k:'staff'},
  P:{s:'פ',l:'פגרה',n:'פ',ds:'פגרה · מנוחה שבועית',t:'',k:'off',g:'פגרה'},
  VAC:{s:'ח"ש',l:'ח"ש',n:'ח"ש',ds:'חופשה שנתית',t:'',k:'status',g:'חופשה'},
  SICK:{s:'מחלה',l:'מחלה',n:'מחלה',ds:'יום מחלה',t:'',k:'status',g:'מחלה'},
  STUDY:{s:'לימ׳',l:'לימודים',n:'לימודים',ds:'יום לימודים',t:'',k:'status',g:'לימודים'},
  LEAVE:{s:'חל"ד',l:'חל"ד',n:'חל"ד',ds:'חופשת לידה',t:'',k:'status',g:'חל"ד'},
  COURSE:{s:'קק"צ',l:'קק"צ',n:'קק"צ',ds:'קורס קצינים',t:'',k:'status',g:'קק"צ'}
};
const SHIFT_NAMES={A:'בוקר (א)',AC:'א-בימ"ש',MS:'א-מש"ל',M:'מתואמת',K:'ב כונן',KC:'ב-בימ"ש מוצ"ש'};
const NOT_ALLOWED={A:'ללא משמרת בוקר',AC:'ללא משמרות בית משפט',KC:'ללא משמרות בית משפט',MS:'ללא א-מש"ל',M:'ללא מתואמת',K:'ללא ב כונן'};
const FAM={A:'A',A9:'A',AC:'AC',MS:'MS',M:'M',M14:'M',M15:'M',K:'K',KC:'KC'};
const STANDARD=new Set(['A','AC','MS','A9','M','M14','M15','K','KC']);
const MORNING=new Set(['A','AC','MS','A9']);
const MID=new Set(['M','M14','M15']);
const REINF=new Set(['R1','R2','R3']);
const OFF=new Set(['P','VAC','SICK','STUDY','LEAVE','COURSE']);
const STATUSES=['VAC','SICK','STUDY','LEAVE','COURSE'];
const isWork=c=>!!c&&!OFF.has(c);
const MIDC=['M','M14','M15'];
const KIND_NAMES={rot:'בסידור האוטומטי',manual:'שיבוץ ידני',staff:'קבוע (קצינים ומטה)',absent:'מוחרג משיבוץ'};

/* ---------- team (derived from the roster) ---------- */
let PEOPLE=[], ALLP={}, RP={}, IDS=[], ROT=[], DYN=[], INV=[], REINF_IDS=[], TRIPLETS=[[],[],[]], COURT_P=[], COURT_B=[];
function normPerson(p){
  const r=Object.assign({},p);
  r.kind=['rot','manual','staff','absent'].includes(r.kind)?r.kind:'rot';
  if(r.kind==='rot'){
    r.off=Number.isFinite(+r.off)?Math.max(0,Math.min(5,+r.off)):2;
    r.shifts=Array.isArray(r.shifts)&&r.shifts.length?r.shifts.filter(s=>ALL_SHIFTS.includes(s)):ALL_SHIFTS.slice();
    r.weekend=!!r.weekend; r.reinf=!!r.reinf;
    r.triplet=[0,1,2].includes(r.triplet)?r.triplet:null;
    r.studyDay=[0,1,2,3,4].includes(r.studyDay)?r.studyDay:null;
    r.court=r.court==='primary'||r.court==='backup'?r.court:null;
  }
  if(r.kind==='staff') r.fixed=['A','MS','MGR'].includes(r.fixed)?r.fixed:'A';
  if(r.kind==='absent') r.status=['LEAVE','COURSE'].includes(r.status)?r.status:'LEAVE';
  r.tasks=r.tasks===undefined?(r.kind==='rot'||r.kind==='manual'):!!r.tasks;
  r.notes=typeof r.notes==='string'?r.notes:'';
  return r;
}
function setRoster(list){
  const all=(Array.isArray(list)&&list.length?list:DEFAULT_PEOPLE).map(normPerson);
  ALLP={}; all.forEach(p=>{ALLP[p.id]=p;});
  PEOPLE=all.filter(p=>!p.removed);
  RP={}; PEOPLE.forEach(p=>{RP[p.id]=p;});
  IDS=PEOPLE.map(p=>p.id);
  ROT=PEOPLE.filter(p=>p.kind==='rot').map(p=>p.id);
  DYN=PEOPLE.filter(p=>p.kind==='rot'||p.kind==='manual').map(p=>p.id);
  INV=PEOPLE.filter(p=>p.tasks);
  REINF_IDS=ROT.filter(p=>RP[p].reinf);
  TRIPLETS=[0,1,2].map(i=>ROT.filter(p=>RP[p].weekend&&RP[p].triplet===i));
  COURT_P=ROT.filter(p=>RP[p].court==='primary');
  COURT_B=ROT.filter(p=>RP[p].court==='backup');
  Object.values(S.sched).forEach(W=>{if(W.grid)ensureRows(W.grid);if(W.pubGrid)ensureRows(W.pubGrid);});
}
function ensureRows(g){IDS.forEach(p=>{if(!Array.isArray(g[p]))g[p]=[null,null,null,null,null,null,null];});return g;}
const grpOf=r=>r.kind==='rot'?(r.off>=3?'B':'C'):r.kind==='staff'?'A':'S';
function personRules(r){
  const out=[];
  if(r.kind==='rot'){
    out.push(`${r.off} פגרות`);
    const s=r.shifts;
    if(s.length===ALL_SHIFTS.length) out.push('כל המשמרות');
    else if(s.every(x=>x==='A'||x==='MS')) out.push('בוקר בלבד');
    else if(s.length<=2) out.push('רק '+s.map(x=>SHIFT_NAMES[x]).join(' או '));
    else{const miss=ALL_SHIFTS.filter(x=>!s.includes(x));const t=[];if(miss.includes('AC')||miss.includes('KC'))t.push('ללא בית משפט');miss.filter(x=>x!=='AC'&&x!=='KC').forEach(x=>t.push(NOT_ALLOWED[x]));out.push(...t);}
    out.push(r.weekend?(r.triplet!=null?`סופ"ש: שלישייה ${r.triplet+1}`:'סופ"ש: מחליף'):'ללא סופ"ש');
    if(!r.reinf) out.push('ללא תגבורים');
    if(r.studyDay!=null) out.push(`יום ${DSH[r.studyDay]} קבוע: לימודים`);
    if(r.court==='primary') out.push('קבוע ב-א-בימ"ש');
    if(r.court==='backup') out.push('מחליף ב-א-בימ"ש בימי המנוחה של הקבוע');
  }else if(r.kind==='manual') out.push('שיבוץ ידני');
  else if(r.kind==='staff') out.push(`קבוע: ${SH[r.fixed].n} בימים א׳–ה׳`);
  else out.push(`${SH[r.status].n} · מוחרג משיבוץ`);
  if(!r.tasks) out.push('לא מקבל משימות');
  return out;
}
const TABS={
  admin:[['feed','משימות','feed'],['sched','סידור','calendar'],['archive','ארכיון','archive'],['summary','סיכום','summary'],['stats','ביצועים','stats'],['notifs','התראות','bell']],
  inv:[['feed','משימות','feed'],['sched','סידור','calendar'],['report','דיווח משמרת','report'],['notifs','התראות','bell']],
  staff:[['feed','משימות','feed'],['sched','סידור','calendar'],['notifs','התראות','bell']]
};

/* ---------- icons ---------- */
const P={
  feed:'<rect x="4" y="4" width="16" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.6"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h3M13.5 14h3M7.5 17h3"/>',
  archive:'<path d="M4.5 8h15v11a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"/><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M10 12h4"/>',
  summary:'<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  stats:'<path d="M5 20V11M12 20V4M19 20v-6"/>',
  bell:'<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  report:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M9 10h6M9 14h6M9 18h3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
  hand:'<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L4 13.8a1.5 1.5 0 0 1 2.5-1.6L8 14"/>',
  alert:'<path d="M12 3.5l9 16H3z"/><path d="M12 10v4.2M12 17.2v.3"/>',
  reset:'<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  chevR:'<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  chevL:'<path d="M15 5.5L8.5 12l6.5 6.5"/>',
  spark:'<path d="M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z"/>',
  send:'<path d="M4.5 12L20 4.5 15.5 20l-3.5-6.5z"/><path d="M12 13.5L20 4.5"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><circle cx="17" cy="8.5" r="2.5"/><path d="M16.5 13.6c2.4.2 4 1.9 4.6 4.6"/>',
  shift:'<path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/>',
  note:'<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/>',
  face:'<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5"/><path d="M9 9.5v1.2M15 9.5v1.2M12.2 9.5v3.6h-1M9.6 15.6a3.6 3.6 0 0 0 4.8 0"/>',
  finger:'<path d="M12 11.2v3.2a7 7 0 0 1-1.4 4.2"/><path d="M8.8 10.4a3.3 3.3 0 0 1 6.5.8v2.6a11 11 0 0 1-.9 4.4"/><path d="M6.2 14.6v-3.4a5.8 5.8 0 0 1 10.3-3.7"/><path d="M17.8 11v1.6a14 14 0 0 1-.5 3.6"/><path d="M4.6 8.6A8.2 8.2 0 0 1 12 3.8a8 8 0 0 1 4.7 1.5"/>',
  share:'<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M7 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-1"/>',
  download:'<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
  del:'<path d="M9 5.5h10.5a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5.5-6.5z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/>'
};
const svg=n=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=(a,k)=>a.reduce((x,r)=>x+(Number(r[k])||0),0);
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const name=id=>id==='admin'?'המנהל':((ALLP[id]&&ALLP[id].name)||pubName(id)||'');
const pubName=id=>{const p=S.pubNames&&S.pubNames.people&&S.pubNames.people.find(x=>x.id===id);return p?p.name:'';};
const fmtDate=ts=>{const d=new Date(ts);return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;};
const fmtTime=ts=>{const d=new Date(ts);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const fmtStamp=(ts,sep=' · ')=>{const d=new Date(ts);return `${fmtDate(ts)}${sep}${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;};
const fmtDur=ms=>{ms=Math.max(0,ms);return `${Math.floor(ms/H)}:${pad(Math.floor(ms%H/M))}`;};
const ago=ts=>{const d=Date.now()-ts;if(d<M)return 'עכשיו';if(d<H)return `לפני ${Math.floor(d/M)} ד'`;if(d<24*H)return `לפני ${Math.floor(d/H)} ש'`;return fmtDate(ts);};
const dkey=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
function wdStart(ts){const d=new Date(ts);if(d.getHours()<WD_HOUR)d.setDate(d.getDate()-1);d.setHours(WD_HOUR,0,0,0);return d.getTime();}
const wdKey=ts=>dkey(wdStart(ts));
const isToday=ts=>!!ts&&wdStart(ts)===wdStart(Date.now());
function keyLabel(k){const [y,m,d]=k.split('-').map(Number);const dt=new Date(y,m-1,d);return `יום ${DAYS[dt.getDay()]} ${pad(d)}.${pad(m)}.${y}`;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function shuffle(a,rng){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
const many=(n,one,more)=>n===1?one:`${n} ${more}`;
const cnt=(row,c)=>row.filter(x=>x===c).length;

const keyToUTC=k=>{const [y,m,d]=k.split('-').map(Number);return Date.UTC(y,m-1,d);};
const utcToKey=t=>{const d=new Date(t);return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;};
const addDays=(k,n)=>utcToKey(keyToUTC(k)+n*D);
const sundayOf=ts=>addDays(dkey(ts),-new Date(ts).getDay());
const weekIndex=k=>Math.round((keyToUTC(k)-keyToUTC(ANCHOR))/(7*D));
const mod3=i=>((i%3)+3)%3;
const dayDate=(wk,d)=>{const k=addDays(wk,d);return `${k.slice(8,10)}.${k.slice(5,7)}`;};
const curWeek=()=>sundayOf(Date.now());
const todayIdx=()=>new Date().getDay();

/* ---------- live state ----------
   Server layout (Firestore). The security rules on the server check every write:
   team/roster, team/perms, team/links   main admin only (links = which phone belongs to which person)
   tasks/{key}                            created by the admin or task managers; investigators may only take / finish
   sched/{week}                           admin or schedule managers
   claims/{deviceId}                      a phone asking to join; pub/names = the names list such phones may see
   data/users/{deviceId}/…                private per phone (shift reports, sign-in, read marker)
   outbox, timers                         notifications waiting for the push sender */
const CFG=window.APP_CONFIG||{};
/* inside the installed Android app (Capacitor shell) the page talks to the phone through the native bridge */
const NATIVE=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
const nat=(plugin,method,opts)=>window.Capacitor.nativePromise(plugin,method,opts||{});
const TASK_WINDOW=35*D;
const S={tasks:[],taskDocs:{},taskOpen:{},taskOld:{},schedDocs:{},sched:{},links:{},linkMeta:{},everLinked:{},perms:{managers:{}},claims:{},reports:{},lastSeen:null,rosterDoc:false,
  auth:null,authOf:{},pubNames:null,member:null,loadedFrom:null,
  ready:{tasks:false,sched:false,links:false,roster:false,perms:false,auth:false}};
const ME={uid:null,owner:false,write:true,preview:null,name:'',phase:'loading'};
let DB=null, FB=null;
setRoster(null);
const personOf=()=>ME.owner?ME.preview:(S.links[ME.uid]||null);
const isAdmin=()=>ME.owner&&!ME.preview;
const viewer=()=>isAdmin()?'admin':personOf();
const readOnly=()=>!!ME.preview;
const permOf=p=>(p&&S.perms.managers&&S.perms.managers[p])||{};
const isMgr=()=>{if(isAdmin())return false;const m=permOf(personOf());return !!(m.tasks||m.sched);};
const canSendV=()=>isAdmin()||!!permOf(personOf()).tasks;
const canSchedV=()=>isAdmin()||!!permOf(personOf()).sched;
const roleOf=()=>{if(isAdmin())return 'admin';if(isMgr())return 'mgr';const p=RP[personOf()];return p&&p.tasks?'inv':'staff';};
const tabsFor=role=>{
  if(role==='mgr'){const p=RP[personOf()];return [['feed','משימות','feed'],['sched','סידור','calendar'],['archive','ארכיון','archive']].concat(p&&p.tasks?[['report','דיווח','report']]:[]).concat([['notifs','התראות','bell']]);}
  return TABS[role];
};
const newId=()=>'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const isIOSDev=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const devLabel=()=>{const u=navigator.userAgent;if(/iPhone/.test(u))return 'iPhone';if(/iPad/.test(u)||isIOSDev())return 'iPad';const m=u.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build|\))/);if(m&&m[1]&&!/^(K|wv)$/.test(m[1].trim()))return m[1].trim().slice(0,30);if(/Android/.test(u))return 'Android';if(/Windows/.test(u))return 'מחשב Windows';if(/Mac/.test(u))return 'Mac';return 'מכשיר';};
const devText=u=>{const m=S.linkMeta[u];return m?`${m.dev||'מכשיר'}${m.at?' · חובר '+fmtDate(m.at):''}`:'מכשיר';};

/* the tasks the app shows: everything still open, plus everything created in the last 35 days (older ones load on demand) */
const RANK={open:0,progress:1,done:2};
function deriveTasks(){
  const all={};
  [S.taskOld,S.taskDocs,S.taskOpen].forEach(src=>Object.keys(src).forEach(k=>{const d=src[k];if(!d)return;const cur=all[k];if(!cur||(RANK[d.status]||0)>=(RANK[cur.status]||0))all[k]=d;}));
  S.tasks=Object.keys(all).map(key=>{
    const d=all[key]; if(!d||!d.desc||d.test) return null;
    const status=d.status==='done'||d.status==='progress'?d.status:'open';
    const log=[{t:'created',by:d.createdBy||'admin',at:d.createdAt}];
    if(status!=='open'&&d.takenBy) log.push({t:'taken',by:d.takenBy,at:d.takenAt});
    if(status==='done') log.push({t:'done',by:d.takenBy,at:d.doneAt});
    return {key,id:d.num,desc:String(d.desc),prio:PRIO[d.prio]?d.prio:'med',assignee:d.assignee||null,createdAt:d.createdAt,createdBy:d.createdBy||'admin',
      status,takenBy:status==='open'?null:(d.takenBy||null),takenAt:status==='open'?null:(d.takenAt||null),doneAt:status==='done'?(d.doneAt||null):null,log};
  }).filter(Boolean).sort((a,b)=>b.createdAt-a.createdAt);
}
function deriveSched(){
  const out={};
  Object.keys(S.schedDocs).forEach(wk=>{const W=clone(S.schedDocs[wk]);if(!W||W.test)return;W.locks=W.locks||{};if(W.grid)ensureRows(W.grid);if(W.pubGrid)ensureRows(W.pubGrid);out[wk]=W;});
  S.sched=out;
}
function derive(){deriveTasks();deriveSched();}

/* ---------- schedule engine ---------- */
/* weekday standard: 4 morning (2 א + 1 א-בימ"ש + 1 א-מש"ל), 2 מתואמת, 1 ב כונן. Reduction 1 drops one א, reduction 2 also one מתואמת. */
const tgt=(W,d)=>{const r=(W&&W.reduce&&W.reduce[d])||0;return {mo:4-(r>=1?1:0),mid:2-(r>=2?1:0),total:7-Math.min(r,2),r};};
function weekCtx(wk){
  const widx=weekIndex(wk), tri=TRIPLETS[mod3(widx)], nextTri=TRIPLETS[mod3(widx+1)];
  const prev=S.sched[addDays(wk,-7)];
  const prevSat={}; IDS.forEach(p=>{prevSat[p]=prev&&prev.grid&&prev.grid[p]?prev.grid[p][6]:null;});
  return {wk,widx,tri,nextTri,prevSat,hasPrev:!!(prev&&prev.grid),W:S.sched[wk]||{locks:{}},dates:[0,1,2,3,4,5,6].map(d=>dayDate(wk,d))};
}
function ruleBreak(p,code,d){
  const r=RP[p]; if(!r||!code||OFF.has(code)) return '';
  if(r.kind==='staff'||r.kind==='absent') return '';
  if(code==='KC'&&d!==6) return 'ב-בימ"ש מוגדרת למוצ"ש בלבד';
  if(REINF.has(code)) return r.kind==='rot'&&!r.reinf?'ללא תגבורים':'';
  if(r.kind!=='rot') return '';
  if(d>=5&&!r.weekend) return 'ללא סופ"ש';
  const fam=FAM[code];
  if(fam&&!r.shifts.includes(fam)) return NOT_ALLOWED[fam]||'לא לפי הכללים שלו';
  return '';
}
/* after ב כונן (or ב-בימ"ש) the next day may only be מתואמת, a noon reinforcement or a day off. Friday to Saturday is flexible inside the weekend team. */
function restBreak(prev,code,d){
  if(prev!=='K'&&prev!=='KC') return '';
  if(!code||OFF.has(code)||MID.has(code)||code==='R3'||code==='MGR') return '';
  if(d===6) return '';
  return 'אחרי ב כונן מותר למחרת רק מתואמת או פגרה';
}
function injections(n,c){
  const out=[],cur=[],used=new Set();
  (function rec(){if(cur.length===n){out.push(cur.slice());return;}for(const x of c){if(used.has(x))continue;used.add(x);cur.push(x);rec();cur.pop();used.delete(x);}})();
  return out;
}
const WE_NEED={5:['A','AC','K'],6:['A','K','KC']};
const SLOT_PRI=['K','AC','KC','A'];
function fillWeekend(g,ctx,rng){
  const sl={},cd={};
  for(const d of [5,6]){
    const s=WE_NEED[d].slice();
    DYN.forEach(p=>{const c=g[p][d];if(c){const i=s.indexOf(c==='A9'?'A':c);if(i>=0)s.splice(i,1);}});
    let c=ctx.tri.filter(p=>g[p][d]==null&&RP[p].weekend);
    if(c.length<s.length){
      const subs=shuffle(ROT.filter(p=>!ctx.tri.includes(p)&&RP[p].weekend&&g[p][d]==null),rng)
        .sort((a,b)=>(ctx.nextTri.includes(a)?1:0)-(ctx.nextTri.includes(b)?1:0));
      c=c.concat(subs.slice(0,s.length-c.length));
    }
    s.sort((a,b)=>SLOT_PRI.indexOf(a)-SLOT_PRI.indexOf(b));
    sl[d]=s.slice(0,c.length); cd[d]=c;
  }
  const F=injections(sl[5].length,shuffle(cd[5],rng)), Sa=injections(sl[6].length,shuffle(cd[6],rng));
  let best=null,bp=Infinity, tries=0;
  for(const f of F){ for(const s of Sa){
    if(++tries>4000) break;
    const fc={},sc={}; let pen=0;
    f.forEach((p,i)=>{fc[p]=sl[5][i];}); s.forEach((p,i)=>{sc[p]=sl[6][i];});
    for(const p in fc) if(ruleBreak(p,fc[p],5)) pen+=1000;
    for(const p in sc) if(ruleBreak(p,sc[p],6)) pen+=1000;
    for(const p in sc) if((sc[p]==='K'||sc[p]==='KC')&&COURT_P.includes(p)) pen+=8;  /* keep the fixed court investigator free for Sunday */
    for(const p in sc) if(sc[p]==='K'||sc[p]==='KC'){const f2=fc[p]||g[p][5];if(f2!=='A'&&f2!=='AC'&&f2!=='A9')pen+=3;}
    pen+=rng()*0.5;
    if(pen<bp){bp=pen;best=[fc,sc];}
  } if(tries>4000) break; }
  if(best){for(const p in best[0])g[p][5]=best[0][p];for(const p in best[1])g[p][6]=best[1][p];}
}
function placeOff(g,ctx,rng){
  const hc=[0,1,2,3,4].map(d=>DYN.filter(p=>(ROT.includes(p)&&g[p][d]==null)||STANDARD.has(g[p][d])).length);
  for(const p of shuffle(ROT,rng)){
    let need=RP[p].off-cnt(g[p],'P');
    while(need>0){
      const av=[0,1,2,3,4].filter(d=>g[p][d]==null);
      if(!av.length) break;
      let bd=av[0],bv=-Infinity;
      for(const d of av){
        let v=hc[d]+rng()*1.5;
        const ps=ctx.prevSat[p]; if(d===0&&(ps==='K'||ps==='KC')) v+=2.5;
        if(hc[d]<=tgt(ctx.W,d).total) v-=20;
        if(v>bv){bv=v;bd=d;}
      }
      g[p][bd]='P'; hc[bd]--; need--;
    }
  }
}
function fillDay(g,ctx,rng,d){
  const prev=p=>d===0?ctx.prevSat[p]:g[p][d-1];
  const restr=p=>prev(p)==='K'||prev(p)==='KC';
  const free=()=>ROT.filter(p=>g[p][d]==null);
  const n=c=>DYN.filter(p=>g[p][d]===c).length;
  const courtRole=p=>COURT_P.includes(p)||COURT_B.includes(p);
  if(n('AC')<1){
    const order=COURT_P.concat(COURT_B).concat(shuffle(ROT.filter(p=>!courtRole(p)),rng));
    const p=order.find(p=>g[p][d]==null&&!restr(p)&&!ruleBreak(p,'AC',d));
    if(p) g[p][d]='AC';
  }
  if(n('K')<1){
    let best=null,bv=Infinity;
    for(const p of free()){
      if(restr(p)||ruleBreak(p,'K',d)) continue;
      const tm=g[p][d+1]; let v=rng()*2;
      if(tm==null){
        if(d+1>4) continue; v+=4;
        if(COURT_P.includes(p)) v+=10;
        if(COURT_B.includes(p)&&COURT_P.some(c=>OFF.has(g[c][d+1]))) v+=10;
      }
      else if(OFF.has(tm)) v+=0;
      else if(MID.has(tm)) v+=1;
      else continue;
      v+=cnt(g[p],'K')*6;
      if(v<bv){bv=v;best=p;}
    }
    if(best) g[best][d]='K';
  }
  free().filter(restr).forEach(p=>{g[p][d]='M';});
  if(n('MS')<1){
    const c=shuffle(free().filter(p=>!ruleBreak(p,'MS',d)&&!courtRole(p)),rng).sort((a,b)=>cnt(g[a],'MS')-cnt(g[b],'MS'));
    const p=c[0]||free().find(p=>!ruleBreak(p,'MS',d));
    if(p) g[p][d]='MS';
  }
  const need=tgt(ctx.W,d).mid-DYN.filter(p=>MID.has(g[p][d])).length;
  if(need>0){
    const c=shuffle(free().filter(p=>!ruleBreak(p,'M',d)),rng).sort((a,b)=>g[a].filter(x=>MID.has(x)).length-g[b].filter(x=>MID.has(x)).length);
    c.slice(0,need).forEach(p=>{g[p][d]='M';});
  }
  free().forEach(p=>{g[p][d]=!ruleBreak(p,'A',d)?'A':!ruleBreak(p,'M',d)?'M':!ruleBreak(p,'MS',d)?'MS':'A';});
}
function attempt(W,ctx,rng){
  const g={};
  IDS.forEach(p=>{g[p]=[0,1,2,3,4,5,6].map(d=>{const l=W.locks&&W.locks[p]&&W.locks[p][d];return l?l.c:null;});});
  PEOPLE.forEach(r=>{
    const row=g[r.id];
    if(r.kind==='rot'&&r.studyDay!=null&&row[r.studyDay]==null) row[r.studyDay]='STUDY';
    if(r.kind==='absent') for(let d=0;d<7;d++) if(row[d]==null) row[d]=r.status;
    if(r.kind==='staff') for(let d=0;d<7;d++) if(row[d]==null) row[d]=d<5?r.fixed:'P';
  });
  fillWeekend(g,ctx,rng);
  ROT.forEach(p=>{if(g[p][5]==null)g[p][5]='P';if(g[p][6]==null)g[p][6]='P';});
  placeOff(g,ctx,rng);
  for(let d=0;d<5;d++) fillDay(g,ctx,rng,d);
  return g;
}
const activeCount=(g,d)=>DYN.filter(p=>g[p]&&STANDARD.has(g[p][d])).length;
function validate(g,ctx){
  const out=[];
  const add=(sev,w,msg,cells,day)=>out.push({sev,w,msg,cells:cells||[],day:day==null?-1:day});
  const short=n=>n===1?'חסר 1':`חסרים ${n}`;
  for(let d=0;d<7;d++){
    const c=code=>DYN.filter(p=>g[p][d]===code).length;
    const dl=`${DAYS[d]} ${ctx.dates[d]}`;
    if(d<5){
      const t=tgt(ctx.W,d);
      const mo=c('A')+c('AC')+c('A9')+c('MS'), mid=c('M')+c('M14')+c('M15');
      if(c('AC')<1) add('hard',1000,`${dl}: אין א-בימ"ש`,0,d);
      else if(c('AC')>1) add('warn',120,`${dl}: ${c('AC')} חוקרים ב-א-בימ"ש, התקן הוא 1`,0,d);
      if(c('MS')<1) add('hard',1000,`${dl}: אין א-מש"ל`,0,d);
      else if(c('MS')>1) add('warn',120,`${dl}: ${c('MS')} חוקרים ב-א-מש"ל, התקן הוא 1`,0,d);
      if(mo<t.mo) add('hard',1000*(t.mo-mo),`${dl}: ${short(t.mo-mo)} בבוקר`,0,d);
      if(mid<t.mid) add('hard',1000*(t.mid-mid),`${dl}: ${short(t.mid-mid)} במתואמת`,0,d);
      else if(mid>t.mid) add('warn',150*(mid-t.mid),`${dl}: ${mid} במתואמת, התקן הוא ${t.mid}`,0,d);
      if(c('K')<1) add('hard',1000,`${dl}: אין ב כונן`,0,d);
      else if(c('K')>1) add('warn',300,`${dl}: ${c('K')} חוקרים ב כונן, התקן הוא 1`,0,d);
    }else{
      WE_NEED[d].forEach(k=>{const have=k==='A'?c('A')+c('A9'):c(k);if(have<1) add('hard',1000,`${dl}: חסר ${SH[k].n}`,0,d);});
    }
  }
  PEOPLE.forEach(r=>{
    const row=g[r.id]; if(!row) return;
    for(let d=0;d<7;d++){
      const code=row[d];
      const rb=ruleBreak(r.id,code,d);
      if(rb) add('hard',1000,`${r.name}, ${DAYS[d]}: ${rb}`,[[r.id,d]]);
      const pv=d===0?ctx.prevSat[r.id]:row[d-1];
      if(code&&restBreak(pv,code,d)) add('hard',1000,`${r.name}, ${DAYS[d]}: ${SH[code].n} יום אחרי ב כונן. מותר רק מתואמת או פגרה`,d>0?[[r.id,d],[r.id,d-1]]:[[r.id,d]]);
    }
    if(r.kind!=='rot') return;
    const p=cnt(row,'P');
    const nonStatus=row.filter(c=>!c||!STATUSES.includes(c)).length;
    if(p<r.off&&nonStatus>p) add('warn',300*(r.off-p),`${r.name}: ${p} פגרות מתוך ${r.off}`);
    else if(p>r.off) add('warn',100,`${r.name}: ${p} פגרות, יותר מהזכאות (${r.off})`);
    if(row.some(c=>c==null)) add('warn',50,`${r.name}: יש ימים לא משובצים`,row.map((c,d)=>c==null?[r.id,d]:null).filter(Boolean));
  });
  return out;
}
function scoreGrid(g,ctx){
  let sc=validate(g,ctx).reduce((a,i)=>a+i.w,0);
  const hc=[0,1,2,3,4].map(d=>activeCount(g,d)-tgt(ctx.W,d).total);
  const mean=hc.reduce((a,b)=>a+b,0)/5;
  sc+=hc.reduce((a,h)=>a+(h-mean)*(h-mean),0)*2;
  ROT.forEach(p=>{
    const wd=g[p].slice(0,5);
    const k=cnt(wd,'K'); if(k>1) sc+=(k-1)*25;
    const m=wd.filter(c=>MID.has(c)).length; if(m>2) sc+=(m-2)*6;
    const ms=cnt(wd,'MS'); if(ms>2) sc+=(ms-2)*4;
  });
  for(let d=0;d<5;d++){
    COURT_P.forEach(cp=>{
      const c=g[cp][d], pv=d===0?ctx.prevSat[cp]:g[cp][d-1];
      if(isWork(c)&&c!=='AC'&&pv!=='K'&&pv!=='KC') sc+=40;
    });
    if(COURT_P.length+COURT_B.length&&!COURT_P.concat(COURT_B).some(p=>g[p][d]==='AC')) sc+=30;
  }
  return sc;
}
function generateGrid(wk,variant){
  const ctx=weekCtx(wk), W=ctx.W;
  const rng=mulberry32(hashStr(wk)+variant*7919+1);
  let best=null,bs=Infinity;
  for(let a=0;a<400;a++){
    const g=attempt(W,ctx,rng), sc=scoreGrid(g,ctx);
    if(sc<bs){bs=sc;best=g;}
  }
  return best;
}
function reinfCount(p){let n=0;for(const k in S.sched){const g=S.sched[k].grid;if(g&&g[p])n+=g[p].filter(c=>REINF.has(c)).length;}return n;}
function reinfRecs(wk,g){
  const W=S.sched[wk]||{locks:{}};
  const used={}; IDS.forEach(p=>{used[p]=reinfCount(p);});
  const out=[];
  for(let d=0;d<5;d++){
    const t=tgt(W,d), act=activeCount(g,d), surplus=act-t.total;
    const morning=DYN.filter(p=>MORNING.has(g[p][d])).length;
    const already=IDS.filter(p=>REINF.has(g[p][d]));
    if(surplus<=0){ if(already.length) out.push({d,act,surplus:0,people:[],already}); continue; }
    const max=Math.max(0,Math.min(surplus,morning-t.mo));
    const c=REINF_IDS.filter(p=>(g[p][d]==='A'||g[p][d]==='A9')&&!(W.locks&&W.locks[p]&&W.locks[p][d]))
      .sort((a,b)=>used[a]-used[b]||(hashStr(wk+a+d)%97)-(hashStr(wk+b+d)%97));
    const people=c.slice(0,max); people.forEach(p=>{used[p]++;});
    out.push({d,act,surplus,people,already});
  }
  return out;
}
function shortages(wk,g){
  const W=S.sched[wk]||{};
  const out=[];
  for(let d=0;d<5;d++){
    const act=activeCount(g,d), r=(W.reduce&&W.reduce[d])||0;
    if(act<7||r) out.push({d,act,r});
  }
  return out;
}
function repairDay(W,wk,d){
  const g=W.grid; if(!g) return;
  const t=tgt(W,d), ctx=weekCtx(wk);
  const prevK=p=>{const pv=d===0?ctx.prevSat[p]:g[p][d-1];return pv==='K'||pv==='KC';};
  let mids=DYN.filter(p=>MID.has(g[p][d]));
  let mo=DYN.filter(p=>MORNING.has(g[p][d])).length;
  while(mids.length>t.mid&&mo<t.mo){
    const p=mids.find(p=>!(W.locks&&W.locks[p]&&W.locks[p][d])&&!prevK(p)&&!ruleBreak(p,'A',d));
    if(!p) break;
    g[p][d]='A'; mids=mids.filter(x=>x!==p); mo++;
  }
}

/* ---------- local stand-in (only for automated tests) ---------- */
function LocalDB(){
  const KEY='inv-live-localdb';
  let store={}; try{store=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
  const subs=new Set();
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}};
  const notify=()=>subs.forEach(fn=>fn());
  window.addEventListener('storage',e=>{if(e.key===KEY){try{store=JSON.parse(e.newValue||'{}');}catch(x){}notify();}});
  const snap=p=>{const d=store[p];return {id:p.split('/').pop(),exists:!!d,data:()=>d?clone(d):undefined,metadata:{fromCache:false,hasPendingWrites:false}};};
  const merge=(a,b)=>{const o=Object.assign({},a);for(const k in b){o[k]=(b[k]&&typeof b[k]==='object'&&b[k]!==DEL&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==='object')?merge(o[k],b[k]):b[k];}return o;};
  const applyDel=o=>{if(o&&typeof o==='object'&&!Array.isArray(o)){Object.keys(o).forEach(k=>{if(o[k]===DEL||(o[k]&&o[k].__del===1))delete o[k];else applyDel(o[k]);});}return o;};
  const DEL={__del:1};
  const cmp=(a,op,v)=>op==='=='?a===v:op==='!='?a!==v:op==='<'?a<v:op==='<='?a<=v:op==='>'?a>v:op==='>='?a>=v:op==='in'?v.includes(a):op==='not-in'?!v.includes(a):op==='array-contains'?Array.isArray(a)&&a.includes(v):false;
  function docRef(path){return {id:path.split('/').pop(),path,
    get:async()=>snap(path),
    set:async(d,o)=>{store[path]=o&&o.merge&&store[path]?applyDel(merge(store[path],d)):applyDel(clone(d));persist();setTimeout(notify);},
    update:async(d)=>{if(!store[path])throw {code:'not-found',message:'missing'};const o=clone(store[path]);Object.keys(d).forEach(k=>{const ks=k.split('.');let t=o;for(let i=0;i<ks.length-1;i++){t[ks[i]]=t[ks[i]]||{};t=t[ks[i]];}t[ks[ks.length-1]]=d[k]===DEL?DEL:clone(d[k]);});store[path]=applyDel(o);persist();setTimeout(notify);},
    delete:async()=>{delete store[path];persist();setTimeout(notify);},
    acquire:async()=>({acquired:true}),
    onSnapshot:(next)=>{const fn=()=>next(snap(path));subs.add(fn);setTimeout(fn);return()=>subs.delete(fn);},
    collection:(p)=>collRef(path+'/'+p)};}
  function query(path,f,o,l){
    const run=()=>{const depth=path.split('/').length+1;let docs=Object.keys(store).filter(k=>k.startsWith(path+'/')&&k.split('/').length===depth).map(snap);
      f.forEach(([fl,op,v])=>{docs=docs.filter(d=>cmp(fl==='__id__'?d.id:(d.data()||{})[fl],op,v));});
      if(o) docs.sort((a,b)=>{const x=a.data()[o[0]],y=b.data()[o[0]];return (x<y?-1:x>y?1:0)*(o[1]==='desc'?-1:1);});
      if(l) docs=docs.slice(0,l);
      return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}};};
    return {where:(a,b,c)=>query(path,f.concat([[a,b,c]]),o,l),orderBy:(a,b)=>query(path,f,[a,b||'asc'],l),limit:(n)=>query(path,f,o,n),get:async()=>run(),
      onSnapshot:(next)=>{const fn=()=>next(run());subs.add(fn);setTimeout(fn);return()=>subs.delete(fn);}};
  }
  function collRef(path){const id=()=>Math.random().toString(36).slice(2,12);return Object.assign(query(path,[],null,0),{path,doc:(i)=>docRef(path+'/'+(i||id())),add:async(d)=>{const r=docRef(path+'/'+id());await r.set(d);return r;}});}
  /* transactions across tabs: one at a time through a Web Lock, reading the freshest copy inside the lock */
  async function tx(fn){
    const run=async()=>{
      try{store=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
      const w=[];
      await fn({get:async p=>store[p]?clone(store[p]):null,
        set:(p,d)=>{w.push(()=>{store[p]=clone(d);});},update:(p,d)=>{w.push(()=>{if(!store[p])throw {code:'not-found'};store[p]=merge(store[p],clone(d));});},delete:p=>{w.push(()=>{delete store[p];});}});
      w.forEach(f=>f()); persist(); setTimeout(notify);
    };
    return navigator.locks&&navigator.locks.request?navigator.locks.request('inv-localdb-tx',run):run();
  }
  return {doc:docRef,collection:collRef,tx,fieldDelete:()=>DEL};
}
function LocalUser(){
  const u=window.__LOCAL_USER||{id:'local-owner',owner:true,name:'בודק'};
  return {isOwner:async()=>!!u.owner,canEdit:async()=>!!u.owner,can:async()=>u.write===false?false:true,id:async()=>u.id,
    me:async()=>({id:u.id,name:u.name||'',avatarUrl:'',color:'#888',email:null,isOwner:!!u.owner,canEdit:!!u.owner}),
    profiles:async(ids)=>{const o={};[].concat(ids).forEach(i=>{o[i]={id:i,name:(window.__LOCAL_NAMES||{})[i]||'',avatarUrl:'',color:'#888',email:null,isMe:i===u.id,guest:true};});return o;},
    search:async()=>[]};
}

/* ---------- writes ---------- */
const queues={};
function serial(path,fn){const prev=queues[path]||Promise.resolve();const p=prev.catch(()=>{}).then(fn);queues[path]=p;return p;}
async function withRetry(fn){try{return await fn();}catch(e){if(e&&e.code==='unavailable'){await new Promise(r=>setTimeout(r,400+Math.random()*600));return fn();}throw e;}}
function errMsg(e){
  const c=e&&e.code;
  if(c==='invalid_argument'||c==='permission-denied') return 'אין לך הרשאה לפעולה הזו.';
  if(c==='unavailable'||c==='failed-precondition'||c==='deadline-exceeded') return 'אין חיבור לשרת. בדוק את האינטרנט ונסה שוב.';
  if(c==='quota_exceeded') return 'האחסון מלא. צריך למחוק נתונים ישנים.';
  if(c==='resource_exhausted'||c==='resource-exhausted') return 'יותר מדי פעולות ברגע אחד. נסה שוב בעוד כמה שניות.';
  if(c==='revoked') return 'הגישה שלך לאפליקציה בוטלה.';
  return 'השמירה נכשלה. בדוק את החיבור ונסה שוב.';
}

/* ---------- sign-in: personal number + the phone's own biometrics ----------
   Each phone signs in to the server on its own (anonymous device account, or the main admin's email); this is the app's entry screen on top of it.
   Only a salted, stretched SHA-256 hash of the personal number is stored, in the viewer's private
   data/users/<id>/auth document (the main admin can read it to show status and reset it). */
const IDLE_MS=10*M, PN_MIN=5, PN_MAX=9, HASH_ITER=20000;
const AUTH={unlocked:false,pad:'',mode:null,first:'',err:'',busy:false,bioBusy:false,bioOffer:false,bioState:null,pending:null,change:false,autoTried:false};
const LK=k=>`inv-${k}-${ME.uid||'x'}`;
const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const lsSet=(k,v)=>{try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,String(v));}catch(e){}};
const b64=buf=>{const a=new Uint8Array(buf);let s='';for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const b64u=buf=>b64(buf).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>unb64(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4));
const rand=n=>crypto.getRandomValues(new Uint8Array(n));
/* self-contained SHA-256 so the check works the same in every browser and frame, with or without WebCrypto */
const SHA=(()=>{const K=[],H=[];let n=2,c=0;const frac=x=>((x-Math.floor(x))*4294967296)|0;
  while(c<64){let p=true;for(let d=2;d*d<=n;d++)if(n%d===0){p=false;break;}if(p){if(c<8)H[c]=frac(Math.pow(n,1/2));K[c]=frac(Math.pow(n,1/3));c++;}n++;}
  return {K,H};})();
function sha256(msg){
  const l=msg.length, bl=((l+9+63)>>6)<<6, b=new Uint8Array(bl); b.set(msg); b[l]=0x80;
  const dv=new DataView(b.buffer), bits=l*8; dv.setUint32(bl-4,bits>>>0); dv.setUint32(bl-8,Math.floor(bits/4294967296));
  const H=SHA.H.slice(), K=SHA.K, w=new Int32Array(64);
  for(let o=0;o<bl;o+=64){
    for(let i=0;i<16;i++) w[i]=dv.getInt32(o+i*4);
    for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];
      w[i]=(w[i-16]+(((x>>>7)|(x<<25))^((x>>>18)|(x<<14))^(x>>>3))+w[i-7]+(((y>>>17)|(y<<15))^((y>>>19)|(y<<13))^(y>>>10)))|0;}
    let a=H[0],bb=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(let i=0;i<64;i++){
      const t1=(h+(((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))+((e&f)^(~e&g))+K[i]+w[i])|0;
      const t2=((((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))+((a&bb)^(a&c)^(bb&c)))|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0;}
    H[0]=(H[0]+a)|0;H[1]=(H[1]+bb)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;}
  const out=new Uint8Array(32), ov=new DataView(out.buffer); H.forEach((x,i)=>ov.setInt32(i*4,x)); return out;
}
/* salted, stretched hash of the personal number (iterated SHA-256) */
async function pnHash(pn,salt,iter){
  const s=unb64(salt), m=new TextEncoder().encode('inv-pn:'+pn), first=new Uint8Array(s.length+m.length);
  first.set(s); first.set(m,s.length);
  let h=sha256(first); const buf=new Uint8Array(32+s.length);
  for(let i=0;i<iter;i++){buf.set(h);buf.set(s,32);h=sha256(buf);if(i%10000===9999)await new Promise(r=>setTimeout(r));}
  return b64(h);
}
const authOn=()=>!!ME.uid&&!!DB;
const hasPN=()=>!!(S.auth&&S.auth.hash);
const isLocked=()=>authOn()&&S.ready.auth&&hasPN()&&!AUTH.unlocked;
const myName=()=>{
  if(ME.owner) return ME.name||'';
  const p=S.links[ME.uid]; if(p&&RP[p]) return name(p);
  const c=S.claims[ME.uid]||AUTH.pending; return c?claimLabel(c):'';
};
/* wrong-number throttle: 5 free tries, then 30s, 60s, 2m … up to 15 minutes */
function failState(){try{return JSON.parse(lsGet(LK('fails'))||'null')||{n:0,until:0};}catch(e){return {n:0,until:0};}}
function noteFail(){const f=failState();f.n++;if(f.n>=5)f.until=Date.now()+Math.min(15*M,30e3*Math.pow(2,f.n-5));lsSet(LK('fails'),JSON.stringify(f));return f;}
const lockWait=()=>Math.max(0,failState().until-Date.now());
function touchActive(){if(AUTH.unlocked)lsSet(LK('active'),Date.now());}
function restoreSession(){const last=+lsGet(LK('active'))||0;AUTH.unlocked=Date.now()-last<IDLE_MS;}
function unlockOk(){
  AUTH.unlocked=true;AUTH.pad='';AUTH.err='';AUTH.busy=false;lsSet(LK('fails'),null);lsSet(LK('active'),Date.now());
  render();window.scrollTo(0,0);
}
function lockNow(){
  /* no automatic Face ID right after locking: it prompts again when the app is next opened or returned to */
  AUTH.unlocked=false;AUTH.pad='';AUTH.err='';AUTH.autoTried=true;AUTH.mode=null;AUTH.change=false;AUTH.first='';
  lsSet(LK('active'),null);U.sheet=null;renderSheet();const p=$('#push');if(p)p.hidden=true;
  render();window.scrollTo(0,0);
}
let lastTouch=0;
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>{const n=Date.now();if(n-lastTouch>15000){lastTouch=n;touchActive();}},{passive:true,capture:true}));
function idleCheck(){if(AUTH.unlocked&&hasPN()&&Date.now()-(+lsGet(LK('active'))||0)>IDLE_MS)lockNow();}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){touchActive();return;}
  idleCheck();
  if(isLocked()){AUTH.autoTried=false;setTimeout(autoBio,250);}
});

/* device biometrics through WebAuthn (Face ID, fingerprint, or the phone's own unlock code) */
const isIOS=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=()=>/Android/i.test(navigator.userAgent);
const bioName=()=>isIOS()?'Face ID':isAndroid()?'טביעת אצבע':'זיהוי ביומטרי';
const bioIcon=()=>isIOS()?'face':'finger';
const BIO_OPTS=reason=>({reason,androidTitle:'משימות',androidSubtitle:reason,cancelTitle:'ביטול',allowDeviceCredential:true,androidConfirmationRequired:false});
async function bioAvailable(){
  if(AUTH.bioState) return AUTH.bioState==='ok';
  if(NATIVE){try{const r=await nat('BiometricAuthNative','checkBiometry');AUTH.bioState=r&&(r.isAvailable||r.deviceIsSecure)?'ok':'no';}catch(e){AUTH.bioState='no';}return AUTH.bioState==='ok';}
  let ok=false;
  try{
    if(window.isSecureContext&&window.PublicKeyCredential&&navigator.credentials&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable){
      const fp=document.permissionsPolicy||document.featurePolicy;
      if(fp&&fp.allowsFeature&&(!fp.allowsFeature('publickey-credentials-get')||!fp.allowsFeature('publickey-credentials-create'))) ok=false;
      else ok=!!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    }
  }catch(e){ok=false;}
  AUTH.bioState=ok?'ok':'no';
  return ok;
}
const bioId=()=>lsGet(LK('bio'));
const bioOnDevice=()=>{const id=bioId();return !!id&&AUTH.bioState!=='no'&&!!(S.auth&&(S.auth.bio||[]).some(x=>x&&x.id===id));};
async function saveAuth(body){await withRetry(()=>DB.doc(`data/users/${ME.uid}/auth`).set(body));S.auth=body;}
async function bioEnable(){
  if(AUTH.bioBusy) return;
  if(!(await bioAvailable())){AUTH.bioOffer=false;render();toast('במכשיר או בדפדפן הזה אין זיהוי ביומטרי שהאפליקציה יכולה להשתמש בו. הכניסה נשארת במספר אישי.');return;}
  AUTH.bioBusy=true;
  if(NATIVE){
    try{
      await nat('BiometricAuthNative','internalAuthenticate',BIO_OPTS('הפעלת כניסה מהירה'));
      const id='n'+Date.now().toString(36);
      const list=((S.auth&&S.auth.bio)||[]).concat([{id,at:Date.now(),dev:devLabel()}]).slice(-6);
      await saveAuth(Object.assign({},S.auth,{bio:list}));
      lsSet(LK('bio'),id); AUTH.bioOffer=false;
      toast(`הכניסה עם ${bioName()} הופעלה. בכניסה הבאה לא צריך להקליד.`);
    }catch(e){toast('ההפעלה בוטלה. אפשר להפעיל בכל זמן מהתפריט האישי (לחיצה על השם למעלה).');}
    AUTH.bioBusy=false; render(); if(U.sheet&&U.sheet.type==='me') renderSheet();
    return;
  }
  try{
    const nm=myName()||'משתמש';
    const cred=await navigator.credentials.create({publicKey:{
      rp:{name:'משימות משרד החקירות'},
      user:{id:rand(16),name:nm,displayName:nm},
      challenge:rand(32),
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged',requireResidentKey:false},
      timeout:60000,attestation:'none'}});
    if(!cred) throw {name:'NotAllowedError'};
    const id=b64u(cred.rawId);
    const list=((S.auth&&S.auth.bio)||[]).filter(x=>x&&x.id!==id).concat([{id,at:Date.now(),dev:bioName()}]).slice(-6);
    await saveAuth(Object.assign({},S.auth,{bio:list}));
    lsSet(LK('bio'),id); AUTH.bioOffer=false;
    toast(`הכניסה עם ${bioName()} הופעלה. בכניסה הבאה לא צריך להקליד.`);
  }catch(e){
    const msg=String((e&&e.message)||'');
    if(e&&typeof e.code==='string') toast(errMsg(e));
    else if(e&&(e.name==='SecurityError'||e.name==='NotSupportedError'||/feature|policy|not enabled|iframe|origin/i.test(msg))){
      AUTH.bioState='no';AUTH.bioOffer=false;
      toast('הדפדפן לא מאפשר זיהוי ביומטרי בתוך דף האפליקציה. הכניסה נשארת במספר אישי.');
    }else toast('ההפעלה בוטלה. אפשר להפעיל בכל זמן מהתפריט האישי (לחיצה על השם למעלה).');
  }
  AUTH.bioBusy=false; render(); if(U.sheet&&U.sheet.type==='me') renderSheet();
}
async function bioDisable(){
  const id=bioId(); lsSet(LK('bio'),null);
  try{if(S.auth&&id)await saveAuth(Object.assign({},S.auth,{bio:(S.auth.bio||[]).filter(x=>x&&x.id!==id)}));}catch(e){}
  toast(`הכניסה עם ${bioName()} בוטלה במכשיר הזה.`); renderSheet(); render();
}
async function bioUnlock(auto){
  if(AUTH.bioBusy||!bioOnDevice()||!isLocked()) return;
  AUTH.bioBusy=true;
  if(NATIVE){
    try{await nat('BiometricAuthNative','internalAuthenticate',BIO_OPTS('כניסה לאפליקציה'));AUTH.bioBusy=false;unlockOk();return;}
    catch(e){if(!auto){AUTH.err='הזיהוי בוטל או לא הצליח. אפשר להזין מספר אישי.';paintPad(true);}AUTH.bioBusy=false;return;}
  }
  try{
    const id=bioId();
    const a=await navigator.credentials.get({publicKey:{challenge:rand(32),allowCredentials:[{type:'public-key',id:unb64u(id),transports:['internal']}],userVerification:'required',timeout:60000}});
    const ad=a&&a.response&&a.response.authenticatorData?new Uint8Array(a.response.authenticatorData):null;
    if(a&&b64u(a.rawId)===id&&ad&&ad.length>32&&(ad[32]&0x04)){AUTH.bioBusy=false;unlockOk();return;}
    if(!auto){AUTH.err='הזיהוי לא הצליח. הזן מספר אישי.';paintPad(true);}
  }catch(e){if(!auto){AUTH.err='הזיהוי בוטל או לא הצליח. אפשר להזין מספר אישי.';paintPad(true);}}
  AUTH.bioBusy=false;
}
function autoBio(){if(AUTH.autoTried||!isLocked()||!bioOnDevice()||document.hidden)return;AUTH.autoTried=true;bioUnlock(true);}

/* keypad */
function dotsHtml(){
  const n=AUTH.pad.length, len=isLocked()&&S.auth.len?S.auth.len:Math.min(PN_MAX,Math.max(PN_MIN,n+1));
  let s='';for(let i=0;i<Math.max(len,n);i++)s+=`<i${i<n?' class="on"':''}></i>`;
  return s;
}
function paintPad(shake){
  const d=$('#pn-dots'); if(!d) return;
  d.innerHTML=dotsHtml(); d.setAttribute('aria-label',AUTH.pad.length?`הוקלדו ${AUTH.pad.length} ספרות`:'לא הוקלדו ספרות');
  const er=$('#pn-err'); if(er){er.textContent=AUTH.err;er.hidden=!AUTH.err;}
  const ok=$('#pn-ok'); if(ok) ok.disabled=AUTH.busy||AUTH.pad.length<PN_MIN;
  document.querySelectorAll('.keys .key').forEach(k=>{k.disabled=AUTH.busy||lockWait()>0;});
  if(shake){d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');}
}
function keysHtml(){
  const wait=lockWait()>0||AUTH.busy, k=n=>`<button type="button" class="key" data-act="pn-key" data-k="${n}"${wait?' disabled':''}>${n}</button>`;
  return `<div class="keys" dir="ltr" role="group" aria-label="מקלדת ספרות">${[1,2,3,4,5,6,7,8,9].map(k).join('')}
    <span aria-hidden="true"></span>${k(0)}<button type="button" class="key fn" data-act="pn-del" aria-label="מחיקת ספרה"${wait?' disabled':''}>${svg('del')}</button></div>`;
}
const fmtWait=ms=>{const s=Math.ceil(ms/1000);return `${Math.floor(s/60)}:${pad(s%60)}`;};
function lockHtml(){
  const nm=myName(), wait=lockWait(), req=S.auth&&S.auth.resetReq;
  return `<div class="lock">
    <div class="lk-top"><span class="lk-ic">${svg('lock')}</span><h2>${nm?'שלום, '+esc(nm):'כניסה'}</h2><p>הזן את המספר האישי שלך</p></div>
    <div class="dots" id="pn-dots" role="status" aria-label="לא הוקלדו ספרות">${dotsHtml()}</div>
    <p class="err" id="pn-err"${AUTH.err?'':' hidden'}>${esc(AUTH.err)}</p>
    ${wait>0?`<p class="err">יותר מדי ניסיונות שגויים. אפשר לנסות שוב בעוד <span class="mono" id="pn-wait">${fmtWait(wait)}</span></p>`:''}
    ${bioOnDevice()?`<button type="button" class="btn btn-ghost bio-btn" data-act="bio-unlock">${svg(bioIcon())}כניסה עם ${bioName()}</button>`:''}
    ${keysHtml()}
    ${S.auth&&S.auth.len?'':`<button type="button" class="btn btn-primary" id="pn-ok" data-act="pn-ok" disabled>כניסה</button>`}
    <div class="lk-foot">${req?'<p class="hint">ביקשת מהמנהל לאפס את המספר. אחרי האיפוס תגדיר כאן מספר חדש.</p>':'<button type="button" class="linkbtn" data-act="pn-forgot">שכחתי את המספר האישי</button>'}</div>
  </div>`;
}
function setupHtml(){
  const mode=AUTH.mode||'set1', first=mode==='set1', nm=myName();
  const title=first?(AUTH.change?'מספר אישי חדש':'הזן את המספר האישי שלך'):'הקלד שוב לאימות';
  const sub=first?(AUTH.change?'הקלד את המספר האישי שישמש אותך מעכשיו לכניסה.':`${nm?`שלום ${esc(nm)}. `:''}מהפעם הבאה נכנסים איתו לאפליקציה.`):'כדי לוודא שלא הייתה טעות הקלדה.';
  const foot=AUTH.pending?'<button type="button" class="linkbtn" data-act="pn-cancel">חזרה לרשימת השמות</button>'
    :AUTH.change?'<button type="button" class="linkbtn" data-act="pn-cancel">ביטול</button>':'';
  return `<div class="lock">
    <div class="lk-top"><span class="lk-ic">${svg('lock')}</span><h2>${title}</h2><p>${sub}</p></div>
    <div class="dots" id="pn-dots" role="status" aria-label="לא הוקלדו ספרות">${dotsHtml()}</div>
    <p class="err" id="pn-err"${AUTH.err?'':' hidden'}>${esc(AUTH.err)}</p>
    ${keysHtml()}
    <button type="button" class="btn btn-primary" id="pn-ok" data-act="pn-ok"${AUTH.busy||AUTH.pad.length<PN_MIN?' disabled':''}>${AUTH.busy?'שומר…':first?'המשך':'שמירה'}</button>
    <div class="lk-foot"><p class="hint">בין ${PN_MIN} ל-${PN_MAX} ספרות. נשמר מוצפן: אף אחד לא רואה אותו, גם לא המנהל.</p>${foot}</div>
  </div>`;
}
function bioOfferHtml(){
  return `<div class="lock">
    <div class="lk-top"><span class="lk-ic">${svg(bioIcon())}</span><h2>כניסה מהירה</h2>
    <p>להיכנס בפעם הבאה עם ${bioName()} במקום להקליד? בטלפון בלי ${bioName()} זה עובד עם קוד הנעילה של המכשיר.</p></div>
    <button type="button" class="btn btn-primary" data-act="bio-enable"${AUTH.bioBusy?' disabled':''}>${svg(bioIcon())}הפעלת ${bioName()}</button>
    <button type="button" class="btn btn-ghost" data-act="bio-skip">לא עכשיו</button>
    <p class="hint">אפשר להפעיל או לבטל בכל זמן מהתפריט האישי (לחיצה על השם למעלה).</p>
  </div>`;
}
function pnKey(k){
  if(AUTH.busy||lockWait()>0||AUTH.pad.length>=PN_MAX) return;
  AUTH.pad+=k; AUTH.err=''; paintPad();
  if(isLocked()&&S.auth.len&&AUTH.pad.length===S.auth.len) pnSubmit();
}
function pnDel(){if(AUTH.busy)return;AUTH.pad=AUTH.pad.slice(0,-1);AUTH.err='';paintPad();}
async function pnSubmit(){
  const v=AUTH.pad;
  if(AUTH.busy) return;
  if(v.length<PN_MIN){AUTH.err=`מספר אישי הוא ${PN_MIN} עד ${PN_MAX} ספרות.`;paintPad(true);return;}
  if(isLocked()){
    if(lockWait()>0) return;
    AUTH.busy=true; paintPad();
    let ok=false; try{ok=(await pnHash(v,S.auth.salt,S.auth.iter||HASH_ITER))===S.auth.hash;}catch(e){}
    AUTH.busy=false;
    if(ok){unlockOk();return;}
    const f=noteFail(); AUTH.pad='';
    AUTH.err=f.until>Date.now()?'':'מספר אישי שגוי. נסה שוב.';
    if(f.until>Date.now()) render(); else paintPad(true);
    return;
  }
  if((AUTH.mode||'set1')==='set1'){AUTH.first=v;AUTH.pad='';AUTH.mode='set2';AUTH.err='';render();return;}
  if(v!==AUTH.first){AUTH.first='';AUTH.pad='';AUTH.mode='set1';AUTH.err='המספרים לא תאמו. הקלד שוב מההתחלה.';render();paintPad(true);return;}
  AUTH.busy=true; render();
  try{
    const salt=b64(rand(16)), hash=await pnHash(v,salt,HASH_ITER);
    await saveAuth({type:'auth',v:1,alg:'sha256x',salt,hash,iter:HASH_ITER,len:v.length,setAt:Date.now(),bio:(AUTH.change&&S.auth&&S.auth.bio)||[]});
    const pend=AUTH.pending, wasChange=AUTH.change;
    Object.assign(AUTH,{pending:null,mode:null,first:'',pad:'',busy:false,change:false,err:'',unlocked:true});
    lsSet(LK('active'),Date.now()); lsSet(LK('fails'),null);
    if(pend) await sendClaim(pend);
    if(!wasChange&&!bioOnDevice()&&(await bioAvailable())) AUTH.bioOffer=true;
    render(); window.scrollTo(0,0);
    toast(wasChange?'המספר האישי הוחלף.':'המספר האישי נשמר.');
  }catch(err){Object.assign(AUTH,{busy:false,pad:'',first:'',mode:'set1'});render();toast(errMsg(err));}
}
async function sendClaim(body){
  const b=Object.assign({},body,{at:Date.now(),dev:devLabel()});
  U.reclaim=false; U.newMe=false; S.claims[ME.uid]=b; render();
  try{
    await withRetry(()=>DB.doc('claims/'+ME.uid).set(b));
    sendPush(['admin'],`בקשת הצטרפות: ${claimLabel(b)}`,b.newName?'שם חדש שלא ברשימה. פתח את דף הצוות כדי להוסיף אותו.':'פתח את דף הצוות כדי לאשר.',{id:'claim-'+ME.uid,tag:'claim',always:true});
  }catch(err){delete S.claims[ME.uid];render();toast(errMsg(err));}
}
function pnForgot(){U.sheet={type:'forgot'};renderSheet();}
async function sendResetReq(){
  if(!S.auth) return;
  try{await saveAuth(Object.assign({},S.auth,{resetReq:Date.now()}));closeSheet();render();toast('הבקשה נשלחה למנהל. אחרי שיאפס, תגדיר כאן מספר חדש.');
    sendPush(['admin'],`שכח מספר אישי: ${myName()||'חוקר'}`,'וודא מולו שזה הוא, ואז אפס את הכניסה שלו בדף הצוות.',{id:'reset-'+ME.uid,tag:'reset',always:true});}
  catch(err){toast(errMsg(err));}
}
setInterval(()=>{
  const w=$('#pn-wait'); if(!w) return;
  const ms=lockWait(); if(ms>0) w.textContent=fmtWait(ms); else render();
},1000);
setInterval(()=>{if(!document.hidden)idleCheck();},30000);
document.addEventListener('keydown',e=>{
  if(U.sheet||!document.querySelector('#view .lock .keys')) return;
  if(/^[0-9]$/.test(e.key)){e.preventDefault();pnKey(e.key);}
  else if(e.key==='Backspace'){e.preventDefault();pnDel();}
  else if(e.key==='Enter'&&!(e.target&&e.target.closest&&e.target.closest('button'))){e.preventDefault();pnSubmit();}
});

function saveWeek(wk){
  const W=S.sched[wk]; if(!W) return Promise.resolve();
  W.savedAt=Date.now(); W.savedBy=ME.owner?'admin':personOf();
  const body=clone(W);
  S.schedDocs[wk]=clone(body);
  return serial('sched/'+wk,()=>withRetry(()=>DB.doc('sched/'+wk).set(body))).catch(e=>{toast(errMsg(e));});
}
/* main admin: manager permissions. The server rules read this table, so a change takes effect immediately everywhere. */
async function savePerms(person,next){
  const managers=Object.assign({},S.perms.managers||{});
  if(next.tasks||next.sched) managers[person]={tasks:!!next.tasks,sched:!!next.sched}; else delete managers[person];
  S.perms={managers}; derive();
  await serial('perms',()=>withRetry(()=>DB.doc('team/perms').set({managers,updatedAt:Date.now()})));
}
function saveRoster(list){
  setRoster(list);
  const body={people:list.map(p=>{const o=clone(p);Object.keys(o).forEach(k=>{if(o[k]===undefined)delete o[k];});return o;}),updatedAt:Date.now()};
  publishNames();
  return serial('roster',()=>withRetry(()=>DB.doc('team/roster').set(body)));
}
function saveLinks(map,ever,meta){
  S.links=map; S.everLinked=ever; if(meta) S.linkMeta=meta;
  publishNames();
  return serial('team',()=>withRetry(()=>DB.doc('team/links').set({map,ever,meta:S.linkMeta||{}})));
}
/* the names list phones see before they join: names and groups only, nothing else from the roster */
function publishNames(){
  if(!ME.owner||!DB||!S.ready.roster||!S.ready.links) return;
  const people=PEOPLE.map(r=>({id:r.id,name:r.name,grp:grpOf(r)}));
  const taken=[...new Set(Object.values(S.links))].sort();
  const cur=S.pubNames&&!S.pubNames.missing?JSON.stringify([S.pubNames.people||[],(S.pubNames.taken||[]).slice().sort()]):'';
  if(cur===JSON.stringify([people,taken])) return;
  S.pubNames={people,taken,updatedAt:Date.now()};
  serial('pub',()=>withRetry(()=>DB.doc('pub/names').set(S.pubNames))).catch(()=>{});
}
function blockedMsg(){
  return 'זו תצוגה בלבד. רק החוקר עצמו יכול לבצע את הפעולה.';
}
const rosterList=()=>Object.values(ALLP);

/* ---------- task actions ----------
   One document per task. Numbers come from a shared counter inside the same transaction, so two managers never get the same number.
   Taking is a transaction too: the first phone to commit wins, and the server rules refuse a second take outright. */
async function createTask(desc,prio,assignee){
  const key=newId(), now=Date.now(), by=ME.owner?'admin':personOf();
  let doc=null;
  await DB.tx(async t=>{
    const c=await t.get('meta/counter');
    const known=Math.max(1000,...S.tasks.map(x=>Number(x.id)||0));
    const num=Math.max((c&&c.n)||0,ME.owner?known:0,1000)+1;
    doc={num,desc,prio,assignee:assignee||null,createdAt:now,createdBy:by,status:'open',takenBy:null,takenAt:null,doneAt:null};
    t.set('meta/counter',{n:num});
    t.set('tasks/'+key,doc);
  });
  S.taskDocs[key]=doc; derive();
  notifyNewTask(key,doc);
  return {id:doc.num,key};
}
async function changeTask(key,kind){
  if(readOnly()){toast(blockedMsg());return;}
  const me=personOf(), t=S.tasks.find(x=>x.key===key);
  if(!t){toast('המשימה לא נמצאה.');return;}
  if(kind==='take'){
    if(t.status!=='open'){toast(`המשימה כבר נלקחה על ידי ${name(t.takenBy)}.`);return;}
    if(t.assignee&&t.assignee!==me){toast('המשימה מיועדת לחוקר אחר.');return;}
  }else if(t.status!=='progress'||t.takenBy!==me){toast('אפשר לסמן בוצע רק משימה שלקחת.');return;}
  const now=Date.now(); let res=null, cur=null;
  try{
    await DB.tx(async tr=>{
      cur=await tr.get('tasks/'+key); res=null;
      if(!cur){res='missing';return;}
      if(kind==='take'){
        if(cur.status!=='open'){res='taken';return;}
        if(cur.assignee&&cur.assignee!==me){res='assignee';return;}
        tr.update('tasks/'+key,{status:'progress',takenBy:me,takenAt:now});
      }else{
        if(cur.status!=='progress'||cur.takenBy!==me){res='notmine';return;}
        tr.update('tasks/'+key,{status:'done',doneAt:now});
      }
      res='ok';
    });
  }catch(e){toast(errMsg(e));return;}
  if(res==='ok'){
    const upd=kind==='take'?{status:'progress',takenBy:me,takenAt:now}:{status:'done',doneAt:now};
    S.taskDocs[key]=Object.assign({},cur,upd); if(S.taskOpen[key]) S.taskOpen[key]=Object.assign({},S.taskOpen[key],upd);
    derive(); render();
    if(U.sheet&&U.sheet.type==='task'){U.sheet.quiet=true;renderSheet();}
    toast(kind==='take'?`לקחת את משימה #${t.id}. היא ננעלה לשאר החוקרים.`:`משימה #${t.id} סומנה כבוצעה ועברה לארכיון.`);
    if(kind==='done') notifyDone(key,t);
  }else if(res==='taken') toast(`${name(cur&&cur.takenBy)||'חוקר אחר'} לקח את המשימה לפניך.`);
  else if(res==='assignee') toast('המשימה מיועדת לחוקר אחר.');
  else if(res==='notmine') toast('אפשר לסמן בוצע רק משימה שלקחת.');
  else toast('המשימה לא נמצאה.');
}
/* older tasks and reports (outside the live 35-day window) load when the archive or summary asks for them */
async function loadOlder(fromTs){
  if(!DB||!S.loadedFrom||fromTs>=S.loadedFrom) return;
  const to=S.loadedFrom;
  try{
    const s=await DB.collection('tasks').where('createdAt','>=',fromTs).where('createdAt','<',to).get();
    s.docs.forEach(d=>{S.taskOld[d.id]=d.data();});
    S.loadedFrom=fromTs;
    if(isAdmin()){
      const keys=[]; for(let t=wdStart(fromTs);t<to+D;t+=D) keys.push(dkey(t));
      const uids=Object.keys(Object.assign({},S.everLinked,S.links));
      await Promise.all(uids.map(async u=>{
        const r=await DB.collection('data/users/'+u).where('__id__','>=','r-'+keys[0]).where('__id__','<','r-'+keys[keys.length-1]+'~').get();
        const have=new Set((S.reports[u]||[]).map(x=>x.key+'|'+x.person));
        const add=r.docs.map(d=>d.data()).filter(x=>x&&x.type==='report'&&!have.has(x.key+'|'+x.person));
        S.reports[u]=(S.reports[u]||[]).concat(add);
      }));
    }
    derive(); render(); if(U.tab==='archive') renderArchiveResults();
  }catch(e){toast(errMsg(e));}
}
function loadOlderFor(dateKey){const [y,m,d]=dateKey.split('-').map(Number);const ts=new Date(y,m-1,d).getTime();if(ts<S.loadedFrom)loadOlder(ts-D);}

/* ---------- phone notifications: queued on the server, sent by the push service ---------- */
const uidsOf=p=>Object.keys(S.links).filter(u=>S.links[u]===p);
const taskMgrUids=()=>Object.keys(S.perms.managers||{}).filter(p=>S.perms.managers[p]&&S.perms.managers[p].tasks).reduce((a,p)=>a.concat(uidsOf(p)),[]);
function sendPush(to,title,body,opts){
  opts=opts||{};
  if(!CFG.push) return Promise.resolve();
  let list=[...new Set(to)].filter(u=>u&&(opts.self||u!==ME.uid));
  if(ME.owner&&!opts.self) list=list.filter(u=>u!=='admin');
  if(!list.length||!DB||(ME.preview&&!opts.always)) return Promise.resolve();
  const doc={to:list,title:trunc(String(title),130),body:trunc(String(body||''),280),url:opts.url||'./',tag:opts.tag||'',by:ME.uid,at:Date.now()};
  return DB.doc('outbox/'+(opts.id||newId())).set(doc).then(pingPush).catch(()=>{});
}
function pingPush(){try{if(CFG.pushPing&&window.__LOCAL!==true&&window.fetch)fetch(CFG.pushPing,{method:'POST',keepalive:true}).catch(()=>{});}catch(e){}}
function notifyNewTask(key,doc){
  const to=doc.assignee?uidsOf(doc.assignee):INV.reduce((a,p)=>a.concat(uidsOf(p.id)),[]);
  sendPush(to,`משימה חדשה · עדיפות ${PRIO[doc.prio].name}`,doc.desc,{tag:'task-'+key});
  /* the 8-hour alert waits on the server and is cancelled if the task is finished in time */
  if(CFG.push) DB.doc('timers/esc-'+key).set({due:doc.createdAt+ESC_MS,to:['admin'].concat(taskMgrUids()),title:`חריגה: משימה #${doc.num} לא הושלמה תוך 8 שעות`,body:trunc(doc.desc,200),url:'./',tag:'esc-'+key,by:ME.uid,at:Date.now()}).catch(()=>{});
}
function notifyDone(key,t){
  sendPush(['admin'].concat(taskMgrUids()),`בוצעה: משימה #${t.id}`,`${name(personOf())} · ${t.desc}`,{tag:'done-'+key});
  if(CFG.push) DB.doc('timers/esc-'+key).delete().catch(()=>{});
}
function notifySched(wk,upd){
  const range=`${dayDate(wk,0)}–${dayDate(wk,6)}`;
  sendPush(Object.keys(S.links).concat(['admin']),`${upd?'עדכון בסידור העבודה':'סידור עבודה פורסם'} · ${range}`,'פתח את האפליקציה כדי לראות את המשמרות שלך.',{tag:'sched-'+wk});
}

/* ---------- notifications (derived from shared data) ---------- */
function escInfo(t){
  const at=t.createdAt+ESC_MS;
  if(Date.now()<at) return null;
  if(t.doneAt&&t.doneAt<=at) return null;
  return {at,state:(t.takenAt&&t.takenAt<=at)?'progress':'open'};
}
const pendingClaims=()=>Object.keys(S.claims).filter(u=>{const c=S.claims[u];return c&&!c.approved&&!c.test&&(c.person||c.newName);});
const claimLabel=c=>c.person?name(c.person):(c.newName||'');
const resetReqs=()=>isAdmin()?Object.keys(S.authOf).filter(u=>S.authOf[u]&&S.authOf[u].resetReq&&S.links[u]):[];
function notifItems(){
  const out=[];
  const me=isAdmin()?null:personOf();
  if(canSendV()){
    S.tasks.forEach(t=>{
      if(t.status==='done'&&t.doneAt&&t.takenBy!==me) out.push({key:'done:'+t.key,kind:'done',at:t.doneAt,task:t.key});
      const e=escInfo(t); if(e) out.push({key:'esc:'+t.key,kind:'esc',at:e.at,task:t.key,state:e.state,by:e.state==='progress'?t.takenBy:null});
    });
  }
  if(isAdmin()) pendingClaims().forEach(u=>{const c=S.claims[u];out.push({key:'claim:'+u+':'+c.at,kind:'claim',at:c.at||0,uid:u,label:claimLabel(c),isNew:!c.person});});
  resetReqs().forEach(u=>{const at=S.authOf[u].resetReq;out.push({key:'reset:'+u+':'+at,kind:'reset',at,uid:u,label:name(S.links[u])});});
  if(me){
    const r=RP[me];
    if(r&&r.tasks) S.tasks.forEach(t=>{if((!t.assignee||t.assignee===me)&&t.createdBy!==me) out.push({key:'new:'+t.key,kind:'new',at:t.createdAt,task:t.key,to:me});});
    Object.keys(S.sched).forEach(wk=>{const W=S.sched[wk];if(W&&W.published&&W.pubAt&&W.savedBy!==me)out.push({key:'sched:'+wk+':'+W.pubAt,kind:'sched',at:W.pubAt,week:wk,upd:(W.pubCount||1)>1,to:me});});
  }
  return out.sort((a,b)=>b.at-a.at).slice(0,60);
}
const lastSeen=()=>S.lastSeen!=null?S.lastSeen:bootAt-12*H;
function notifText(n){
  if(n.kind==='sched'){
    const W=S.sched[n.week], g=W&&W.pubGrid, range=`${dayDate(n.week,0)}–${dayDate(n.week,6)}`;
    const mine=g&&g[n.to]?g[n.to].map((c,d)=>`${DSH[d]} ${c?SH[c].l:'—'}`).join(' · '):'';
    return {title:`${n.upd?'עדכון בסידור העבודה':'סידור עבודה פורסם'} · ${range}`,body:mine?`המשמרות שלך: ${mine}`:''};
  }
  if(n.kind==='reset') return {title:`שכח מספר אישי: ${n.label}`,body:'וודא מולו שזה הוא, ואז אפס את הכניסה שלו בדף הצוות.'};
  if(n.kind==='claim') return n.isNew?{title:`בקשת הצטרפות: ${n.label}`,body:'השם לא ברשימה. הוסף אותו לצוות וקבע לו כללים.'}:{title:`בקשת הצטרפות: ${n.label}`,body:'מישהו ביקש להתחבר בשם הזה. אשר או דחה בדף הצוות.'};
  const t=S.tasks.find(x=>x.key===n.task); const short=t?trunc(t.desc,96):'';
  if(n.kind==='new') return {title:`משימה חדשה · עדיפות ${t?PRIO[t.prio].name:''}`,body:short};
  const num=t?t.id:'';
  if(n.kind==='done') return {title:`בוצעה: משימה #${num}`,body:`${t?name(t.takenBy):''} · ${short}`};
  if(n.state==='progress') return {title:`חריגה: #${num} בביצוע 8 שעות`,body:`${name(n.by)} · ${short}`};
  return {title:`חריגה: #${num} לא נלקחה 8 שעות`,body:short};
}
const bootAt=Date.now();
let seenKeys=null, pushTimer=null, toastTimer=null;
function checkPush(){
  if(!S.ready.tasks||!S.ready.sched||ME.phase!=='ready') return;
  const items=notifItems();
  if(!seenKeys){seenKeys=new Set(items.map(i=>i.key));return;}
  const fresh=items.filter(i=>!seenKeys.has(i.key)); fresh.forEach(i=>seenKeys.add(i.key));
  const show=fresh.filter(i=>i.at>=bootAt-M);
  if(show.length&&!gateHtml()) showPush(show[0]);
}
function showPush(n){
  const {title,body}=notifText(n), el=$('#push');
  el.innerHTML=`<span class="appicon" aria-hidden="true">מ</span><span class="pb"><span class="app"><span>משימות · התראה</span><span>${ago(n.at)}</span></span><strong>${esc(title)}</strong><span>${esc(body)}</span></span>`;
  ['data-open','data-act','data-week'].forEach(a=>el.removeAttribute(a));
  if(n.kind==='sched'){el.dataset.act='open-week';el.dataset.week=n.week;}
  else if(n.kind==='claim'||n.kind==='reset'){el.dataset.act='team';}
  else el.dataset.open=n.task;
  el.hidden=false;
  clearTimeout(pushTimer); pushTimer=setTimeout(()=>{el.hidden=true;},6000);
}
function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>{el.hidden=true;},3800);
}
function copyText(text,okMsg,title){
  const fallback=()=>{U.sheet={type:'copy',text,title};renderSheet();};
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast(okMsg),fallback);}
    else fallback();
  }catch(e){fallback();}
}

/* ---------- UI state ---------- */
function loadUI(){
  const u={tab:'feed',feedFilter:'all',statsRange:7,summaryKey:null,archive:{q:'',from:'',to:'',inv:'',prio:'',status:''},reportEdit:false,draft:null,sheet:null,schedWeek:null,schedMode:'week',schedDay:todayIdx(),reclaim:false,newMe:false};
  try{const s=JSON.parse(localStorage.getItem(UKEY)||'null');if(s){if(s.tab)u.tab=s.tab;if(s.schedMode==='day'||s.schedMode==='week')u.schedMode=s.schedMode;}}catch(e){}
  return u;
}
function saveUI(){try{localStorage.setItem(UKEY,JSON.stringify({tab:U.tab,schedMode:U.schedMode}));}catch(e){}}
const U=loadUI();
const lockedFor=t=>!isAdmin()&&t.status==='progress'&&t.takenBy!==viewer();
const gridFor=wk=>{const W=S.sched[wk];if(!W)return null;return canSchedV()?(W.grid||null):(W.published?W.pubGrid:null);};

/* ---------- task pieces ---------- */
const prioChip=p=>`<span class="prio prio-${p}"><i></i>${PRIO[p].name}</span>`;
const statusChip=t=>`<span class="status status-${t.status}">${STATUS[t.status]}</span>`;
function clockHtml(t){
  const el=Date.now()-t.createdAt, pct=Math.min(100,el/ESC_MS*100), over=el>=ESC_MS;
  const cls=over?'over':pct>=75?'warn':'';
  const txt=over
    ? `<span class="over-txt">חריגה · <span class="mono">${fmtDur(el)}</span> ש' מאז היצירה</span>`
    : `<span><span class="mono">${fmtDur(el)}</span> ש' מאז היצירה · התראת חריגה ב-<span class="mono">${fmtTime(t.createdAt+ESC_MS)}</span></span>`;
  return `<div class="clock">${txt}<div class="track" aria-hidden="true"><b class="${cls}" style="width:${pct.toFixed(1)}%"></b></div></div>`;
}
function actionHtml(t){
  if(isAdmin()) return '';
  const me=viewer(), r=RP[me];
  if(t.status==='progress'&&t.takenBy!==me) return `<div class="lockline">${svg('lock')}ננעלה. בטיפול ${esc(name(t.takenBy))}</div>`;
  if(!r||!r.tasks) return '';
  if(t.status==='open'&&(!t.assignee||t.assignee===me)) return `<button type="button" class="btn btn-take" data-act="take" data-id="${t.key}">${svg('hand')}לקחתי</button>`;
  if(t.status==='progress'&&t.takenBy===me) return `<button type="button" class="btn btn-done" data-act="done" data-id="${t.key}">${svg('check')}בוצע</button>`;
  return '';
}
function card(t){
  const locked=lockedFor(t), over=t.status!=='done'&&Date.now()-t.createdAt>=ESC_MS;
  const meta=[`מיועד: <b>${t.assignee?esc(name(t.assignee)):'כלל החוקרים'}</b>`];
  if(t.createdBy&&t.createdBy!=='admin') meta.push(`נשלחה על ידי <b>${esc(name(t.createdBy))}</b>`);
  if(t.status==='progress') meta.push(`בביצוע: <b>${esc(name(t.takenBy))}</b> מ-<span class="mono">${fmtTime(t.takenAt)}</span>`);
  if(t.status==='done') meta.push(`בוצעה: <b>${esc(name(t.takenBy))}</b> ב-<span class="mono">${fmtTime(t.doneAt)}</span>`);
  else meta.push(`נוצרה ${ago(t.createdAt)}`);
  const act=actionHtml(t);
  return `<article class="card${locked?' is-locked':''}${over?' is-over':''}" data-open="${t.key}">
    <div class="ctop">${prioChip(t.prio)}${statusChip(t)}<button type="button" class="tid" data-open="${t.key}" aria-label="פרטי משימה ${t.id}">#${t.id}</button></div>
    <p class="desc">${esc(t.desc)}</p>
    <div class="meta">${meta.map(m=>`<span>${m}</span>`).join('')}</div>
    ${t.status!=='done'?clockHtml(t):''}
    ${act?`<div class="cact">${act}</div>`:''}
  </article>`;
}

/* ---------- gate screens ---------- */
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}};
const isPhone=()=>isIOSDev()||/Android/i.test(navigator.userAgent);
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(ME.phase!=='loading')render();});
window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('האפליקציה הותקנה. מעכשיו פותחים אותה מהאייקון במסך הבית.');render();});
const installGate=()=>!NATIVE&&(window.__LOCAL!==true||window.__FORCE_INSTALL===true)&&isPhone()&&!isStandalone()&&!U.skipInstall&&lsGet('inv-skip-install')!=='1';
function installSteps(){
  if(isIOSDev()) return `<ol class="howto">
      <li>לוחצים על כפתור השיתוף ${svg('share')} בתחתית המסך (בספארי) או בשורת הכתובת.</li>
      <li>בוחרים <b>"הוספה למסך הבית"</b>, ואז <b>"הוסף"</b>.</li>
      <li>פותחים את האפליקציה מהאייקון החדש ונרשמים שם.</li></ol>
    <p class="hint">מי שנרשם בדפדפן ומתקין אחר כך, צריך להירשם שוב מתוך האייקון.</p>`;
  if(CFG.apkUrl) return `<a class="btn btn-primary" href="${esc(CFG.apkUrl)}" data-act="apk">${svg('download')}הורדת האפליקציה לאנדרואיד</a>
    <ol class="howto">
      <li>פותחים את הקובץ שירד (מההתראה למעלה או מתיקיית ההורדות).</li>
      <li>אם הטלפון שואל, מאשרים <b>"התקנה ממקור זה"</b>. אם מופיעה אזהרה של Play Protect, בוחרים <b>"פרטים נוספים"</b> ואז <b>"להתקין בכל זאת"</b>.</li>
      <li>פותחים את האפליקציה <b>"משימות"</b> מהאייקון ונרשמים שם.</li></ol>`;
  if(deferredInstall) return `<button type="button" class="btn btn-primary" data-act="install">${svg('plus')}התקנת האפליקציה</button>
    <p class="hint">אחרי ההתקנה פותחים את האפליקציה מהאייקון במסך הבית.</p>`;
  return `<ol class="howto">
      <li>פותחים את התפריט ⋮ של הדפדפן (למעלה מימין או למטה).</li>
      <li>בוחרים <b>"התקנת האפליקציה"</b> או <b>"הוספה למסך הבית"</b>.</li>
      <li>פותחים את האפליקציה מהאייקון החדש.</li></ol>`;
}
function installHtml(){
  return `<div class="lock install">
    <div class="lk-top"><img class="appicon-lg" src="./icon-192.png" alt="" width="72" height="72"><h2>התקנת האפליקציה</h2>
    <p>${isIOSDev()?'פעם אחת, ואחר כך היא נפתחת מאייקון במסך מלא, בלי דפדפן.':'מתקינים פעם אחת, ואחר כך היא נפתחת מהאייקון כמו כל אפליקציה.'}</p></div>
    ${installSteps()}
    <button type="button" class="linkbtn" data-act="skip-install">להמשיך בדפדפן בינתיים</button>
  </div>`;
}
function installSheet(){
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">התקנת האפליקציה</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <div class="gate">${installSteps()}</div>`;
}
function adminLoginHtml(){
  return `<div class="gate"><h2>כניסת מנהל ראשי</h2><p>המייל והסיסמה של המנהל הראשי, כפי שהוגדרו בשרת.</p>
    <form id="admin-form" novalidate>
      <div class="field"><label for="ad-email">מייל</label><input id="ad-email" class="input" type="email" autocomplete="username" dir="ltr" inputmode="email"></div>
      <div class="field"><label for="ad-pass">סיסמה</label><input id="ad-pass" class="input" type="password" autocomplete="current-password" dir="ltr"></div>
      <p class="err" id="ad-err" hidden></p>
      <button type="submit" class="btn btn-primary" id="ad-submit">כניסה</button>
    </form>
    <button type="button" class="linkbtn" data-act="admin-back">חזרה</button></div>`;
}
function gateHtml(){
  if(ME.phase==='loading') return `<div class="gate"><p class="sub">מתחבר…</p></div>`;
  if(ME.phase==='config') return `<div class="gate"><h2>האפליקציה עוד לא מחוברת לשרת</h2><p>חסרים פרטי החיבור. פנה למנהל.</p></div>`;
  if(ME.phase==='offline') return `<div class="gate"><h2>אין חיבור לשרת</h2><p>בפתיחה הראשונה צריך אינטרנט. בדוק את החיבור, והאפליקציה תנסה שוב לבד.</p>
    <button type="button" class="btn btn-ghost" data-act="retry">לנסות עכשיו</button></div>`;
  if(installGate()) return installHtml();
  if(U.adminLogin) return adminLoginHtml();
  if(!S.ready.auth||S.member===null||(S.member&&(!S.ready.roster||!S.ready.links))) return `<div class="gate"><p class="sub">טוען…</p></div>`;
  if(isLocked()) return lockHtml();
  if(AUTH.mode) return setupHtml();
  if(AUTH.bioOffer) return bioOfferHtml();
  if(ME.owner){if(!hasPN())return setupHtml();if(S.ready.roster&&!S.rosterDoc&&!U.skipImport&&window.SEED_BOX)return importHtml();return '';}
  const linked=S.member?S.links[ME.uid]:null;
  if(linked&&RP[linked]) return hasPN()?'':setupHtml();
  const c=S.claims[ME.uid];
  if(c&&!c.approved&&(c.person||c.newName)&&!U.reclaim) return `<div class="gate"><h2>ממתין לאישור המנהל</h2>
    <p>ביקשת להתחבר בשם <b>${esc(claimLabel(c))}</b>${c.newName?' (שם חדש ברשימה)':''}. ברגע שהמנהל יאשר, האפליקציה תיפתח כאן מעצמה.</p>
    <p>מהפעם הבאה נכנסים עם המספר האישי${bioOnDevice()?` או עם ${bioName()}`:''}.</p>
    <button type="button" class="btn btn-ghost" data-act="reclaim">לשנות את הבקשה</button></div>`;
  if(U.newMe) return `<div class="gate"><h2>השם שלי לא ברשימה</h2><p>מלא את הפרטים. המנהל יוסיף אותך לצוות, יחליט אם אתה חלק מהסידור ויקבע לך כללי שיבוץ.</p>
    <form id="newme-form" novalidate>
      <div class="field"><label for="nm-name">שם מלא</label><input id="nm-name" class="input" maxlength="40" autocomplete="name"></div>
      <div class="field"><label for="nm-note">תפקיד, מחלק או אילוצים (לא חובה)</label><textarea id="nm-note" class="input" rows="3" maxlength="300" placeholder="למשל: חוקר במחלק נוער, לומד בימי רביעי"></textarea></div>
      <p class="err" id="nm-err" hidden>כתוב את השם שלך.</p>
      <button type="submit" class="btn btn-primary">${hasPN()?svg('send')+'שליחת בקשה למנהל':'המשך להגדרת מספר אישי'}</button>
    </form>
    <button type="button" class="linkbtn" data-act="newme-back">חזרה לרשימת השמות</button></div>`;
  const adminLink=`<button type="button" class="linkbtn subtle" data-act="admin-login">כניסת מנהל ראשי</button>`;
  const pub=S.member?{people:PEOPLE.map(r=>({id:r.id,name:r.name,grp:grpOf(r)})),taken:Object.values(S.links)}:S.pubNames;
  if(!pub) return `<div class="gate"><p class="sub">טוען את רשימת השמות…</p></div>`;
  if(pub.missing||!(pub.people||[]).length) return `<div class="gate"><h2>הצוות עוד לא הוגדר</h2><p>המנהל עדיין מכין את האפליקציה. נסה שוב בעוד כמה דקות.</p>${adminLink}</div>`;
  const taken=new Set(pub.taken||[]);
  const groups=[['B','סידור צפוני'],['C','סידור רגיל'],['S','סטטוס מיוחד'],['A','קצינים ומטה']];
  return `<div class="gate"><h2>מי אתה?</h2><p>${hasPN()?'בחר את השם שלך. המנהל יאשר את החיבור פעם אחת, ומאותו רגע המשימות והסידור שלך יופיעו כאן.':'בחר את השם שלך ואז הזן את המספר האישי שלך. המנהל יאשר את החיבור פעם אחת, ומהפעם הבאה נכנסים עם המספר האישי.'}</p>
    ${groups.map(([gk,gl])=>{const ps=pub.people.filter(r=>r.grp===gk);return ps.length?`<h3 class="sec">${gl}</h3><div class="pick">${ps.map(r=>`<button type="button" data-act="claim" data-p="${esc(r.id)}"${taken.has(r.id)?' disabled':''}>${esc(r.name)}</button>`).join('')}</div>`:'';}).join('')}
    <p class="hint">שם שכבר מחובר לטלפון אחר מופיע באפור. החלפת טלפון? בחר את השם מהרשימה אחרי שהמנהל ינתק את הישן.</p>
    <button type="button" class="addbtn" data-act="newme">${svg('plus')}השם שלי לא ברשימה</button>
    ${adminLink}</div>`;
}

/* ---------- views ---------- */
function feedSets(){
  const admin=isAdmin()||isMgr(), me=viewer();
  const vis=S.tasks.filter(t=>admin||!t.assignee||t.assignee===me);
  const active=vis.filter(t=>t.status!=='done');
  const doneToday=vis.filter(t=>t.status==='done'&&isToday(t.doneAt));
  if(admin) return [
    ['all','הכל',active],
    ['open','ממתינות',active.filter(t=>t.status==='open')],
    ['progress','בביצוע',active.filter(t=>t.status==='progress')]]
    .concat(!isAdmin()&&RP[me]&&RP[me].tasks?[['mine','שלי',active.filter(t=>t.takenBy===me||t.assignee===me)]]:[])
    .concat([['esc','חריגות',active.filter(t=>escInfo(t))],['done','הושלמו היום',doneToday]]);
  return [
    ['all','הכל',active],
    ['mine','משימות שלי',active.filter(t=>t.takenBy===me||t.assignee===me)],
    ['openall','פתוחות לכולם',active.filter(t=>t.status==='open'&&!t.assignee)],
    ['done','הושלמו היום',doneToday]
  ];
}
const EMPTY={
  all:{admin:'אין משימות פעילות. לחץ "משימה חדשה" כדי לשלוח משימה לחוקרים.',inv:'אין משימות פעילות כרגע. משימה חדשה תופיע כאן ברגע שהמנהל ישלח אותה.'},
  mine:'אין משימות בטיפולך. לחיצה על "לקחתי" בכרטיס משייכת אליך את המשימה.',
  openall:'אין משימות פתוחות לכולם כרגע.',
  open:'כל המשימות נלקחו.',
  progress:'אין משימות בביצוע.',
  esc:'אין חריגות. כל המשימות הפעילות בתוך 8 השעות.',
  done:'עוד לא הושלמו משימות היום.'
};
function todayLine(){
  const g=gridFor(curWeek()); if(!g) return '';
  const d=todayIdx();
  if(isAdmin()){
    const act=activeCount(g,d), k=DYN.filter(p=>g[p][d]==='K').map(name);
    return `<button type="button" class="todayline" data-act="goto-sched">${svg('calendar')}<span>היום במשמרת: <b>${act}</b>${k.length?` · ב כונן: <b>${esc(k.join(', '))}</b>`:''}</span></button>`;
  }
  const c=g[viewer()]&&g[viewer()][d]; if(!c) return '';
  const sh=SH[c];
  const showT=sh.t&&!OFF.has(c)&&sh.k!=='reinf'&&c!=='KC'&&!MID.has(c);
  return `<button type="button" class="todayline" data-act="goto-sched">${svg('calendar')}<span>${OFF.has(c)?'היום':'המשמרת שלך היום:'} <span class="shchip k-${sh.k}">${esc(c==='P'?'פגרה':sh.n)}</span>${showT?` <span class="mono">${sh.t}</span>`:''}</span></button>`;
}
function adminHints(){
  let h='';
  const pend=isAdmin()?pendingClaims().length:0;
  if(pend) h+=`<button type="button" class="banner info" data-act="team">${svg('users')}<span><b>${many(pend,'בקשת הצטרפות אחת ממתינה','בקשות הצטרפות ממתינות')}</b> לאישור. הקש לטיפול.</span></button>`;
  const dow=todayIdx();
  if(canSchedV()&&(dow===3||dow===4)){
    const nw=addDays(curWeek(),7), W=S.sched[nw];
    if(!W||!W.grid) h+=`<button type="button" class="banner warn" data-act="open-week" data-week="${nw}">${svg('calendar')}<span><b>סידור השבוע הבא עוד לא נוצר.</b> הקש כדי ליצור אותו.</span></button>`;
    else{
      const n=reinfRecs(nw,W.grid).reduce((a,r)=>a+r.people.length,0);
      const sh=shortages(nw,W.grid).filter(s=>s.act<7&&!s.r).length;
      if(sh) h+=`<button type="button" class="banner warn" data-act="open-week" data-week="${nw}">${svg('alert')}<span><b>חוסר בסד"כ בשבוע הבא</b> ${sh===1?'ביום אחד':`ב-${sh} ימים`}. הקש לטיפול.</span></button>`;
      else if(n) h+=`<button type="button" class="banner info" data-act="open-week" data-week="${nw}">${svg('shift')}<span><b>שבוע הבא: ${many(n,'חוקר אחד','חוקרים')} מעל התקן.</b> יש המלצות לתגבור.</span></button>`;
    }
  }
  return h;
}
function viewFeed(){
  const admin=isAdmin(), mgr=isMgr(), me=viewer(), F=feedSets();
  let f=F.find(x=>x[0]===U.feedFilter); if(!f){f=F[0];U.feedFilter='all';}
  const all=F[0][2], doneToday=F[F.length-1][2], open=all.filter(t=>t.status==='open');
  const list=[...f[2]];
  if(f[0]==='done') list.sort((a,b)=>b.doneAt-a.doneAt);
  else list.sort((a,b)=>{const la=lockedFor(a)?1:0,lb=lockedFor(b)?1:0;if(la!==lb)return la-lb;return (PRIO[b.prio].rank-PRIO[a.prio].rank)||(a.createdAt-b.createdAt);});
  let head;
  if(admin){
    head=`<div class="vhead"><div><h2>משימות פעילות</h2><p class="sub">${all.length} פעילות · ${open.length} ממתינות לחוקר · ${doneToday.length} הושלמו היום</p></div></div>`;
  }else{
    const mine=all.filter(t=>t.status==='progress'&&t.takenBy===me).length;
    head=`<div class="vhead"><div><h2>שלום, ${esc(name(me))}</h2><p class="sub">${RP[me]&&RP[me].tasks?`${mine} בטיפולך · `:''}${open.length} ממתינות לחוקר</p></div></div>`;
  }
  head+=todayLine();
  if(admin||mgr) head+=adminHints();
  if(!ME.preview) head+=pushBanner();
  const escN=admin||mgr?all.filter(t=>escInfo(t)).length:0;
  const banner=escN&&U.feedFilter!=='esc'?`<button type="button" class="alert" data-act="filter" data-f="esc">${svg('alert')}<span><strong>${escN===1?'משימה אחת חרגה':`${escN} משימות חרגו`} מ-8 שעות</strong><span>עברו 8 שעות מהיצירה והמשימה לא נסגרה. הקש לצפייה.</span></span></button>`:'';
  const chips=`<div class="chips" role="group" aria-label="סינון משימות">${F.map(([k,l,a])=>`<button type="button" class="chip" data-act="filter" data-f="${k}" aria-pressed="${k===U.feedFilter}">${l}<span class="n">${a.length}</span></button>`).join('')}</div>`;
  const e=EMPTY[f[0]]; const emptyTxt=typeof e==='string'?e:e[canSendV()?'admin':'inv'];
  const body=!S.ready.tasks?`<div class="empty">טוען משימות…</div>`:list.length?`<div class="list">${list.map(card).join('')}</div>`:`<div class="empty">${esc(emptyTxt)}</div>`;
  const fab=canSendV()?`<button type="button" class="fab" data-act="new">${svg('plus')}משימה חדשה</button>`:'';
  return head+banner+chips+body+fab;
}

/* schedule view */
function cellCode(W,g,r,d){
  if(g) return g[r.id]?g[r.id][d]:null;
  const lk=W.locks&&W.locks[r.id]&&W.locks[r.id][d];
  if(lk) return lk.c;
  if(r.kind==='rot'&&r.studyDay===d) return 'STUDY';
  if(r.kind==='absent') return r.status;
  if(r.kind==='staff') return d<5?r.fixed:'P';
  return null;
}
const GROUPS=[['B','סידור צפוני'],['C','סידור רגיל'],['S','סטטוס מיוחד'],['A','קצינים ומטה · לא נספרים בתקן']];
function gridHtml(wk,g,o){
  const ctx=weekCtx(wk), W=ctx.W;
  const ti=wk===curWeek()?todayIdx():-1;
  const bad=o.bad||new Set(), dayBad=o.dayBad||new Set();
  const head=`<tr><th class="nm" scope="col"><span class="sr">שם</span></th>${[0,1,2,3,4,5,6].map(d=>{
    let cntH='';
    if(g){const a=activeCount(g,d), std=d<5?tgt(W,d).total:3; const cls=dayBad.has(d)||a<std?'short':a>std?'over':'ok'; cntH=`<span class="cnt ${cls}">${a}/${std}</span>`;}
    return `<th scope="col" class="${d===ti?'today':''}"><span class="dh"><span class="dn">${DSH[d]}</span><span class="dd">${ctx.dates[d]}</span>${cntH}</span></th>`;
  }).join('')}</tr>`;
  const row=r=>{
    const cells=[0,1,2,3,4,5,6].map(d=>{
      const lk=W.locks&&W.locks[r.id]&&W.locks[r.id][d];
      const code=cellCode(W,g,r,d);
      const sh=code?SH[code]:null;
      const label=sh?sh.s:'·';
      const inner=code&&MID.has(code)?`<span class="two"><span>${esc(label)}</span><small>${esc(sh.t)}</small></span>`:esc(label);
      const cls=`cell k-${sh?sh.k:'empty'}${label.length>=5?' sm':''}${lk?' lock':''}${bad.has(r.id+':'+d)?' bad':''}`;
      const aria=`${r.name}, ${DAYS[d]}: ${sh?sh.n:'לא משובץ'}`;
      return `<td>${o.editable?`<button type="button" class="${cls}" data-act="cell" data-p="${r.id}" data-d="${d}" aria-label="${esc(aria)}">${inner}</button>`:`<span class="${cls}" aria-label="${esc(aria)}">${inner}</span>`}</td>`;
    }).join('');
    return `<tr class="${r.id===o.me?'me':''}"><th class="nm" scope="row">${ctx.tri.includes(r.id)?'<i class="tri" aria-hidden="true"></i>':''}<span>${esc(r.name)}</span></th>${cells}</tr>`;
  };
  const body=GROUPS.map(([gk,gl])=>{const ps=PEOPLE.filter(r=>grpOf(r)===gk);return ps.length?`<tr class="grp"><th colspan="8" scope="colgroup">${gl}</th></tr>`+ps.map(row).join(''):'';}).join('');
  return `<div class="gridwrap"><table class="sched"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}
function legendHtml(admin){
  const items=[['A','בוקר 08:00'],['AC','בוקר בית משפט'],['MS','בוקר מש"ל'],['M','12:00, 14:00 או 15:00'],['K','ערב 17:00 וכוננות לילה'],['KC','בית משפט במוצ"ש'],['R1','תגבור'],['P','פגרה'],['VAC','חופשה, מחלה, לימודים, חל"ד, קק"צ']];
  return `<div class="legend">${items.map(([c,t])=>`<span class="lg"><span class="cell k-${SH[c].k} lgc">${esc(SH[c].s)}</span>${esc(t)}</span>`).join('')}<span class="lg"><i class="tri" aria-hidden="true"></i>בסבב סופ"ש השבוע</span>${admin?'<span class="lg"><span class="lgdot"></span>שינוי ידני</span>':''}</div>`;
}
function slotsFor(d,W){
  const t=tgt(W,d);
  if(d<5) return [{codes:['A','A9'],name:'בוקר',t:'08:00',need:t.mo-2,k:'am'},{codes:['AC'],name:'א-בימ"ש',t:'08:00',need:1,k:'court'},{codes:['MS'],name:'א-מש"ל',t:'08:00',need:1,k:'am'},{codes:MIDC,name:'מתואמת',t:'',need:t.mid,k:'mid'},{codes:['K'],name:'ב כונן',t:'17:00',need:1,k:'night'},{codes:['R1','R2','R3'],name:'תגבור',t:'',need:0,k:'reinf'}];
  if(d===5) return [{codes:['A','A9'],name:'בוקר',t:'08:00',need:1,k:'am'},{codes:['AC'],name:'א-בימ"ש',t:'08:00',need:1,k:'court'},{codes:['K'],name:'ב כונן',t:'17:00',need:1,k:'night'},{codes:['MS'],name:'א-מש"ל',t:'08:00',need:0,k:'am'},{codes:MIDC,name:'מתואמת',t:'',need:0,k:'mid'},{codes:['R1','R2','R3'],name:'תגבור',t:'',need:0,k:'reinf'}];
  return [{codes:['A','A9'],name:'בוקר',t:'08:00',need:1,k:'am'},{codes:['K'],name:'ב כונן',t:'17:00',need:1,k:'night'},{codes:['KC'],name:'ב-בימ"ש',t:'מוצ"ש',need:1,k:'court'},{codes:['MS'],name:'א-מש"ל',t:'08:00',need:0,k:'am'},{codes:MIDC,name:'מתואמת',t:'',need:0,k:'mid'},{codes:['R1','R2','R3'],name:'תגבור',t:'',need:0,k:'reinf'}];
}
function dayHtml(wk,g,me){
  const ctx=weekCtx(wk), d=U.schedDay;
  const chips=`<div class="chips" role="group" aria-label="בחירת יום">${[0,1,2,3,4,5,6].map(i=>`<button type="button" class="chip" data-act="sday" data-d="${i}" aria-pressed="${i===d}">${DSH[i]}<span class="n">${ctx.dates[i]}</span></button>`).join('')}</div>`;
  const sec=slotsFor(d,ctx.W).map(sl=>{
    const ps=DYN.filter(p=>g[p]&&sl.codes.includes(g[p][d]));
    if(!ps.length&&!sl.need) return '';
    const cls=ps.length<sl.need?'short':(sl.need&&ps.length>sl.need?'over':'');
    const chips2=ps.length?ps.map(p=>{
      const c=g[p][d], extra=c==='A9'?'09:00':MID.has(c)?SH[c].t:(sl.k==='reinf'?SH[c].n:'');
      return `<span class="nchip${p===me?' me':''}">${esc(name(p))}${extra?` <small>${esc(extra)}</small>`:''}</span>`;
    }).join(''):'<span class="hint">אין שיבוץ</span>';
    return `<section class="slot"><div class="slot-h"><span class="sw k-${sl.k}"></span><strong>${sl.name}</strong><span class="t">${sl.t}</span>${sl.need?`<span class="need ${cls}">${ps.length}/${sl.need}</span>`:''}</div><div class="names">${chips2}</div></section>`;
  }).join('');
  const offs=['P'].concat(STATUSES).map(c=>{const ps=DYN.filter(p=>g[p]&&g[p][d]===c);return ps.length?`<div><b>${SH[c].g}:</b> ${ps.map(p=>esc(name(p))).join(', ')}</div>`:'';}).join('');
  const staff=PEOPLE.filter(r=>r.kind==='staff'&&g[r.id]&&isWork(g[r.id][d]));
  const st=staff.length?`<div><b>קצינים ומטה:</b> ${staff.map(r=>`${esc(r.name)} (${esc(SH[g[r.id][d]].n)})`).join(', ')}</div>`:'';
  return chips+`<div class="list">${sec}</div>${offs||st?`<div class="offs">${offs}${st}</div>`:''}`;
}
function myWeekHtml(wk,g,me){
  const ti=wk===curWeek()?todayIdx():-1;
  if(!g[me]) return '';
  return `<h3 class="sec">המשמרות שלי</h3><div class="myweek">${[0,1,2,3,4,5,6].map(d=>{
    const c=g[me][d], sh=c?SH[c]:null;
    return `<div class="mw k-${sh?sh.k:'empty'}${d===ti?' today':''}"><span class="d">${DSH[d]}</span><span class="c${sh&&sh.l.length>=5?' sm':''}">${sh?esc(sh.l):'—'}</span><span class="t">${sh&&sh.t?esc(sh.t):'&nbsp;'}</span></div>`;
  }).join('')}</div>`;
}
function modeSeg(){
  return `<div><div class="seg" role="group" aria-label="תצוגה"><button type="button" data-act="smode" data-m="week" aria-pressed="${U.schedMode==='week'}">שבוע</button><button type="button" data-act="smode" data-m="day" aria-pressed="${U.schedMode==='day'}">יום</button></div></div>`;
}
function issuesHtml(iss){
  if(!iss.length) return `<div class="okline">${svg('check')}הסידור עומד בכל התקנים, הכללים וחוקי המנוחה.</div>`;
  const hard=iss.filter(i=>i.sev==='hard'), warn=iss.filter(i=>i.sev==='warn');
  const t=[hard.length?many(hard.length,'בעיה אחת','בעיות'):'',warn.length?many(warn.length,'הערה אחת','הערות'):''].filter(Boolean).join(' · ');
  return `<details class="issues${hard.length?'':' soft'}"${hard.length?' open':''}><summary>${svg('alert')}<span>${t} בסידור</span></summary><ul>${hard.map(i=>`<li>${esc(i.msg)}</li>`).join('')}${warn.map(i=>`<li class="warn">${esc(i.msg)}</li>`).join('')}</ul></details>`;
}
function shortageHtml(wk,g){
  const ctx=weekCtx(wk), list=shortages(wk,g);
  if(!list.length) return '';
  const real=list.filter(s=>s.act<7);
  const days=list.map(s=>{
    const dl=`${DAYS[s.d]} ${ctx.dates[s.d]}`;
    const state=s.r===0?'':s.r===1?'קוזז: 3 בבוקר':'קוזז: 3 בבוקר ומתואמת אחת';
    const acts=[];
    if(s.r===0) acts.push(`<button type="button" class="btn btn-ghost btn-sm" data-act="reduce" data-d="${s.d}" data-l="1">קיזוז: 3 בבוקר</button>`);
    if(s.r===1) acts.push(`<button type="button" class="btn btn-ghost btn-sm" data-act="reduce" data-d="${s.d}" data-l="2">קיזוז נוסף: מתואמת אחת</button>`);
    if(s.r>0) acts.push(`<button type="button" class="btn btn-ghost btn-sm" data-act="reduce" data-d="${s.d}" data-l="0">ביטול הקיזוז</button>`);
    return `<div class="sday"><div class="sday-h"><strong>${dl}</strong><span>${s.act} זמינים · התקן ${7-Math.min(s.r,2)}${state?` · ${state}`:''}</span></div><div class="acts">${acts.join('')}</div></div>`;
  }).join('');
  return `<section class="shortage"><div class="shortage-h">${svg('alert')}<strong>${real.length?(real.length===1?'חוסר בסד"כ ביום אחד':`חוסר בסד"כ ב-${real.length} ימים`):'קיזוז תקן פעיל'}</strong></div>
    <p class="hint">חופשות ומחלות הורידו את הסד"כ מתחת ל-7. אפשר לקזז את התקן לפי הסדר: קודם 3 בבוקר במקום 4 (א-בימ"ש ו-א-מש"ל נשארים), ואם עדיין חסר, מתואמת אחת במקום 2.</p>${days}</section>`;
}
function reinfHtml(wk,g){
  const ctx=weekCtx(wk), recs=reinfRecs(wk,g);
  const days=recs.map(r=>{
    const dl=`${DAYS[r.d]} ${ctx.dates[r.d]}`;
    const done=r.already.length?`<div class="rdone">בתגבור: ${r.already.map(p=>`${esc(name(p))} (${esc(SH[g[p][r.d]].n)})`).join(', ')}</div>`:'';
    if(!r.surplus) return `<div class="rday"><div class="rday-h"><strong>${dl}</strong><span>${r.act} פעילים</span></div>${done}</div>`;
    const ppl=r.people.length?r.people.map(p=>`<div class="rp"><span class="who2">${esc(name(p))}</span><button type="button" class="btn btn-ghost btn-sm" data-act="reinf" data-p="${p}" data-d="${r.d}" data-c="R1">הר הבית</button><button type="button" class="btn btn-ghost btn-sm" data-act="reinf" data-p="${p}" data-d="${r.d}" data-c="R2">מש"ל</button><button type="button" class="btn btn-ghost btn-sm" data-act="reinf" data-p="${p}" data-d="${r.d}" data-c="R3">צהריים</button></div>`).join(''):'<div class="rdone">אין חוקר כשיר שאפשר להסיט בלי לרדת מתחת לתקן הבוקר.</div>';
    return `<div class="rday"><div class="rday-h"><strong>${dl}</strong><span>${r.act} פעילים · <span class="plus">${r.surplus} מעל התקן</span></span></div>${ppl}${done}</div>`;
  }).join('');
  return `<section class="reinf"><div class="reinf-h">${svg('shift')}<strong>המלצות לתגבור</strong></div>${days||'<p class="hint">אין השבוע עודף מעל התקן.</p>'}<p class="hint">ההמלצות רק מתוך ${REINF_IDS.length} החוקרים הכשירים לתגבור, ומשאירות את תקן הבוקר מלא. בימים ד׳–ה׳ כדאי לבדוק את השבוע הבא.</p></section>`;
}
function viewSchedule(){
  const admin=canSchedV(), me=viewer(), cw=curWeek();
  if(!U.schedWeek) U.schedWeek=cw;
  const wk=U.schedWeek, W=S.sched[wk]||null, ctx=weekCtx(wk);
  const rel=wk===cw?'השבוע':wk===addDays(cw,7)?'שבוע הבא':wk===addDays(cw,-7)?'שבוע שעבר':'';
  let h=`<div class="vhead"><div><h2>סידור עבודה</h2><p class="sub">${admin?'שיבוץ אוטומטי לפי תקן, כללים אישיים וחוקי מנוחה':'המשמרות שלך ושל הצוות'}</p></div></div>
    <div class="weeknav">
      <button type="button" class="navbtn" data-act="week" data-dir="-1" aria-label="שבוע קודם">${svg('chevR')}</button>
      <div class="wk"><strong>${rel?`${rel} · `:''}<span class="mono">${ctx.dates[0]}–${ctx.dates[6]}</span></strong><span>סבב סופ"ש: ${esc(ctx.tri.map(name).join(', ')||'אין שלישייה')}</span></div>
      <button type="button" class="navbtn" data-act="week" data-dir="1" aria-label="שבוע הבא">${svg('chevL')}</button>
    </div>`;
  if(!S.ready.sched) return h+`<div class="empty">טוען סידור…</div>`;
  if(!admin){
    const g=W&&W.published?W.pubGrid:null;
    if(!g) return h+`<div class="empty">הסידור לשבוע הזה עוד לא פורסם. כשהמנהל יפרסם אותו תקבל התראה.</div>`;
    return h+myWeekHtml(wk,g,me)+modeSeg()+(U.schedMode==='day'?dayHtml(wk,g,me):gridHtml(wk,g,{me})+legendHtml(false));
  }
  const rosterBtn=`<button type="button" class="btn btn-ghost" data-act="team">${svg('users')}${isAdmin()?'צוות וכללי שיבוץ':'הצוות וכללי השיבוץ'}</button>`;
  if(!W||!W.grid){
    return h+`<div class="pubrow"><span class="pill pill-none">לא נוצר</span></div>
      <div class="gen-card"><strong>הסידור לשבוע הזה עוד לא נוצר</strong>
        <p>אפשר לסמן קודם חופשות, מחלות ואילוצים בלחיצה על משבצת בטבלה. המנוע ישבץ סביבם לפי התקן, הכללים של כל חוקר וחוקי המנוחה.</p>
        ${ctx.hasPrev?'':'<p class="hint">לשבוע הקודם אין סידור, לכן חוק המנוחה של יום ראשון לא ייבדק מולו.</p>'}
        <button type="button" class="btn btn-primary" data-act="gen">${svg('spark')}יצירת סידור אוטומטי</button></div>`
      +gridHtml(wk,null,{editable:true})+legendHtml(true)+rosterBtn;
  }
  const iss=validate(W.grid,ctx);
  const bad=new Set(); iss.forEach(i=>i.cells.forEach(([p,d])=>bad.add(p+':'+d)));
  const dayBad=new Set(iss.filter(i=>i.sev==='hard'&&i.day>=0).map(i=>i.day));
  const pill=!W.published?'<span class="pill pill-draft">טיוטה</span>':W.dirty?'<span class="pill pill-dirty">שונה אחרי פרסום</span>':'<span class="pill pill-pub">פורסם</span>';
  const by=W.savedBy?` · עודכן על ידי ${esc(W.savedBy==='admin'?'המנהל הראשי':name(W.savedBy))}`:'';
  const when=`<span class="when">${W.published?`פורסם ${fmtDate(W.pubAt)} ${fmtTime(W.pubAt)}`:''}${by}</span>`;
  const pubBtn=!W.published||W.dirty?`<button type="button" class="btn btn-primary btn-sm" data-act="publish">${svg('send')}${W.published?'פרסום העדכון':'פרסום לחוקרים'}</button>`:'';
  return h+`<div class="pubrow">${pill}${when}${pubBtn}</div>`
    +shortageHtml(wk,W.grid)
    +issuesHtml(iss)
    +modeSeg()
    +(U.schedMode==='day'?dayHtml(wk,W.grid,null):gridHtml(wk,W.grid,{editable:true,bad,dayBad})+legendHtml(true))
    +reinfHtml(wk,W.grid)
    +`<div class="actions"><button type="button" class="btn btn-ghost" data-act="copy-sched">${svg('copy')}העתקת הסידור</button><button type="button" class="btn btn-ghost" data-act="regen">${svg('reset')}יצירה מחדש</button><div class="full">${rosterBtn}</div><div class="full"><button type="button" class="btn btn-ghost" data-act="rules">${svg('note')}תקנים וחוקים כלליים</button></div></div>`;
}
function schedText(wk,g){
  const ctx=weekCtx(wk);
  const out=[`*סידור עבודה · ${ctx.dates[0]}–${ctx.dates[6]}*`];
  const staff=PEOPLE.filter(r=>r.kind==='staff');
  if(staff.length) out.push(`קבועים א׳–ה׳: ${staff.map(r=>`${r.name} (${SH[r.fixed].n})`).join(', ')}`);
  out.push('');
  for(let d=0;d<7;d++){
    out.push(`*${DAYS[d]} ${ctx.dates[d]}*`);
    slotsFor(d,ctx.W).forEach(sl=>{
      const ps=DYN.filter(p=>g[p]&&sl.codes.includes(g[p][d])); if(!ps.length) return;
      out.push(`${sl.name}${sl.t?' '+sl.t:''}: ${ps.map(p=>name(p)+(g[p][d]==='A9'?' (09:00)':'')+(MID.has(g[p][d])?` (${SH[g[p][d]].t})`:'')+(sl.k==='reinf'?` (${SH[g[p][d]].n})`:'')).join(', ')}`);
    });
    ['VAC','SICK','STUDY'].forEach(c=>{const ps=DYN.filter(p=>g[p]&&g[p][d]===c);if(ps.length)out.push(`${SH[c].g}: ${ps.map(name).join(', ')}`);});
    out.push('');
  }
  return out.join('\n').trim();
}

function viewReport(){
  const me=viewer(), key=wdKey(Date.now()), uid=ME.uid;
  const mine=(S.reports[uid]||[]).find(r=>r.key===key&&r.person===me);
  const last=(S.reports[uid]||[]).filter(r=>r.person===me).sort((a,b)=>b.at-a.at)[0];
  const head=`<div class="vhead"><div><h2>דיווח סוף משמרת</h2><p class="sub">${keyLabel(key)} · יום עבודה 06:00 עד 06:00</p></div></div>`;
  if(ME.preview) return head+`<div class="empty">דיווחי משמרת פרטיים לכל חוקר. במסך "סיכום" אפשר לראות את כל הדיווחים.</div>`;
  if(mine&&!U.reportEdit){
    return head+`<div class="sent"><div class="sent-h">${svg('check')}הדיווח הוגש ב-<span class="mono">${fmtTime(mine.at)}</span> · מחלק ${esc((DEPTS.find(d=>d.id===mine.dept)||{}).name||'')}</div>
      <dl>${FIELDS.map(([k,l])=>`<div><dt>${l}</dt><dd>${mine[k]}</dd></div>`).join('')}</dl></div>
      <button type="button" class="btn btn-ghost" data-act="report-edit">עדכון הדיווח</button>
      <p class="hint">הדיווח גלוי רק לך ולמנהל. בסיכום היומי הנתונים מוצגים לפי מחלק, ללא שמות.</p>`;
  }
  const dr=U.draft||(U.draft=Object.assign({dept:(mine&&mine.dept)||(last&&last.dept)||'general'},Object.fromEntries(FIELDS.map(([k])=>[k,mine?mine[k]:0]))));
  return head+`<form id="report-form" novalidate>
    <div class="field"><label for="r-dept">מחלק</label>
      <select id="r-dept" class="input">${DEPTS.map(d=>`<option value="${d.id}"${d.id===dr.dept?' selected':''}>${esc(d.name)}</option>`).join('')}</select></div>
    <div class="steps">${FIELDS.map(([k,l,h])=>`<div class="step"><div class="step-l"><label for="r-${k}">${l}</label><small>${h}</small></div>
      <div class="stepper"><button type="button" data-act="step" data-k="${k}" data-d="-1" aria-label="הפחתה">−</button><input id="r-${k}" data-k="${k}" type="number" inputmode="numeric" min="0" max="999" value="${dr[k]}"><button type="button" data-act="step" data-k="${k}" data-d="1" aria-label="הוספה">+</button></div></div>`).join('')}</div>
    <button type="submit" class="btn btn-primary">${mine?'שמירת הדיווח המעודכן':'הגשת דיווח'}</button>
    <p class="hint">הדיווח גלוי רק לך ולמנהל. בסיכום היומי הנתונים מוצגים לפי מחלק, ללא שמות.</p>
  </form>`;
}

const allReports=()=>{const a=[];Object.values(S.reports).forEach(l=>l.forEach(r=>a.push(r)));return a;};
function summaryData(key){
  const reps=allReports().filter(r=>r.key===key);
  const rows=DEPTS.map(d=>{const rs=reps.filter(r=>r.dept===d.id);const o={d,n:rs.length};FIELDS.forEach(([k])=>{o[k]=sum(rs,k);});return o;});
  const total={n:reps.length}; FIELDS.forEach(([k])=>{total[k]=sum(reps,k);});
  return {rows,total};
}
function summaryText(key,{rows,total}){
  const out=[`*סיכום יומי · משרד חקירות*`,keyLabel(key),''];
  for(const r of rows){
    out.push(`*${r.d.name}*`);
    if(!r.n) out.push('לא הוגשו דיווחים');
    else FIELDS.forEach(([k,l])=>out.push(`${l}: ${r[k]}`));
    out.push('');
  }
  out.push('*סה"כ*');
  FIELDS.forEach(([k,l])=>out.push(`${l}: ${total[k]}`));
  out.push(`דיווחים שהוגשו: ${total.n}`);
  return out.join('\n');
}
function viewSummary(){
  const today=wdKey(Date.now()), key=U.summaryKey||today;
  const data=summaryData(key), msg=summaryText(key,data);
  U.lastMsg=msg;
  const th=`<tr><th scope="col">מחלק</th><th scope="col">בטיפול</th><th scope="col">נסגרו</th><th scope="col">תלונות</th><th scope="col">לדין</th></tr>`;
  const tr=data.rows.map(r=>r.n
    ? `<tr><td>${esc(r.d.name)}</td>${FIELDS.map(([k])=>`<td class="num">${r[k]}</td>`).join('')}</tr>`
    : `<tr><td>${esc(r.d.name)}</td><td class="muted" colspan="4">לא הוגשו דיווחים</td></tr>`).join('');
  const tot=`<tr class="total"><td>סה"כ</td>${FIELDS.map(([k])=>`<td class="num">${data.total[k]}</td>`).join('')}</tr>`;
  return `<div class="vhead"><div><h2>סיכום יומי</h2><p class="sub">${data.total.n} דיווחי משמרת הוגשו · יום עבודה 06:00 עד 06:00</p></div></div>
    <div class="daterow"><label for="s-date" class="sub" style="margin:0">יום עבודה</label><input id="s-date" class="input" type="date" value="${key}" max="${today}"><span class="sub" style="margin:0">${keyLabel(key)}</span></div>
    <div class="tablewrap"><table class="sum"><thead>${th}</thead><tbody>${tr}${tot}</tbody></table></div>
    <h3 class="sec">הודעה מוכנה לשיתוף</h3>
    <div class="msg" id="s-msg">${esc(msg)}</div>
    <button type="button" class="btn btn-primary" data-act="copy-summary">${svg('copy')}העתקת ההודעה</button>
    <div class="note">${svg('eye')}<span>ההודעה מציגה נתונים ברמת מחלק בלבד, בלי שמות חוקרים. כוכביות מסמנות כותרות מודגשות ב-WhatsApp.</span></div>`;
}

function viewStats(){
  const now=Date.now(), r=U.statsRange;
  const cutoff=r?wdStart(now)-(r-1)*D:0;
  const reps=allReports();
  const rows=INV.map(u=>{
    const done=S.tasks.filter(t=>t.status==='done'&&t.takenBy===u.id&&t.doneAt>=cutoff);
    const rp=reps.filter(x=>x.person===u.id&&x.at>=cutoff);
    return {u,done:done.length,
      take:avg(done.map(t=>t.takenAt-t.createdAt)),
      dur:avg(done.map(t=>t.doneAt-t.takenAt)),
      now:S.tasks.filter(t=>t.status==='progress'&&t.takenBy===u.id).length,
      closed:sum(rp,'closed'),complaints:sum(rp,'complaints'),reps:rp.length};
  }).sort((a,b)=>b.done-a.done);
  const max=Math.max(1,...rows.map(x=>x.done));
  const seg=[[7,'7 ימים'],[30,'30 יום'],[0,'הכל']].map(([v,l])=>`<button type="button" data-act="range" data-r="${v}" aria-pressed="${v===r}">${l}</button>`).join('');
  const dur=v=>v==null?'—':`${fmtDur(v)} ש'`;
  return `<div class="vhead"><div><h2>ביצועים אישיים</h2><p class="sub">משימות שבוצעו ונתוני דיווחי משמרת לכל חוקר</p></div></div>
    <div class="note">${svg('lock')}<span>גלוי למנהל בלבד. הנתונים האלה לא מופיעים בסיכום היומי ולא מוצגים לחוקרים.</span></div>
    <div><div class="seg" role="group" aria-label="טווח זמן">${seg}</div></div>
    <div class="list">${rows.map(x=>`<article class="stat">
      <div class="stat-h"><span class="avatar" aria-hidden="true">${esc(x.u.name[0])}</span><strong>${esc(x.u.name)}</strong><span class="stat-big"><b>${x.done}</b><span>משימות בוצעו</span></span></div>
      <div class="track" aria-hidden="true"><b style="width:${(x.done/max*100).toFixed(1)}%"></b></div>
      <dl class="mini">
        <div><dt>זמן ממוצע עד לקיחה</dt><dd>${dur(x.take)}</dd></div>
        <div><dt>משך ביצוע ממוצע</dt><dd>${dur(x.dur)}</dd></div>
        <div><dt>תיקים שנסגרו</dt><dd>${x.closed}</dd></div>
        <div><dt>תלונות שנלקחו</dt><dd>${x.complaints}</dd></div>
        <div><dt>בביצוע כעת</dt><dd>${x.now}</dd></div>
        <div><dt>דיווחי משמרת</dt><dd>${x.reps}</dd></div>
      </dl></article>`).join('')}</div>`;
}

function archiveFiltered(){
  const a=U.archive, q=a.q.trim().replace(/^#/,'');
  return S.tasks.filter(t=>{
    if(q&&!(t.desc.includes(q)||String(t.id).includes(q))) return false;
    const k=dkey(t.createdAt);
    if(a.from&&k<a.from) return false;
    if(a.to&&k>a.to) return false;
    if(a.inv&&t.takenBy!==a.inv&&t.assignee!==a.inv) return false;
    if(a.prio&&t.prio!==a.prio) return false;
    if(a.status&&t.status!==a.status) return false;
    return true;
  }).sort((x,y)=>y.createdAt-x.createdAt);
}
function filterCount(){const a=U.archive;return ['from','to','inv','prio','status'].filter(k=>a[k]).length;}
function viewArchive(){
  const a=U.archive, n=filterCount();
  const opt=(v,l,cur)=>`<option value="${v}"${v===cur?' selected':''}>${esc(l)}</option>`;
  return `<div class="vhead"><div><h2>ארכיון וחיפוש</h2><p class="sub">כל המשימות, כולל יומן האירועים של כל אחת</p></div></div>
    <div class="field"><label for="a-q" class="sr">חיפוש</label>
      <input id="a-q" class="input" type="search" placeholder="חיפוש בתיאור, כתובת או מספר משימה" value="${esc(a.q)}"></div>
    <details class="filters" id="a-filters"${n?' open':''}><summary>${svg('filter')}סינון מתקדם<span class="cnt" id="a-cnt">${n?`${n} פעילים`:''}</span></summary>
      <div class="fgrid">
        <div class="field"><label for="a-from">מתאריך</label><input id="a-from" class="input" type="date" value="${a.from}"></div>
        <div class="field"><label for="a-to">עד תאריך</label><input id="a-to" class="input" type="date" value="${a.to}"></div>
        <div class="field full"><label for="a-inv">חוקר</label><select id="a-inv" class="input">${opt('','כל החוקרים',a.inv)}${INV.map(u=>opt(u.id,u.name,a.inv)).join('')}</select></div>
        <div class="field"><label for="a-prio">עדיפות</label><select id="a-prio" class="input">${opt('','הכל',a.prio)}${opt('high','גבוהה',a.prio)}${opt('med','בינונית',a.prio)}${opt('low','נמוכה',a.prio)}</select></div>
        <div class="field"><label for="a-status">סטטוס</label><select id="a-status" class="input">${opt('','הכל',a.status)}${opt('open','פתוחה',a.status)}${opt('progress','בביצוע',a.status)}${opt('done','בוצעה',a.status)}</select></div>
        <div class="full"><button type="button" class="btn btn-ghost btn-sm" data-act="clear-filters">ניקוי הסינון</button></div>
      </div></details>
    <div id="a-results"></div>`;
}
function renderArchiveResults(){
  const box=$('#a-results'); if(!box) return;
  const list=archiveFiltered(), n=filterCount();
  const cntEl=$('#a-cnt'); if(cntEl) cntEl.textContent=n?`${n} פעילים`:'';
  const rows=list.slice(0,200).map(t=>{
    const who=t.takenBy?name(t.takenBy):t.assignee?name(t.assignee):'לא שויכה';
    const side=t.status==='done'?`<span>בוצעה</span><span class="mono">${fmtDur(t.doneAt-t.createdAt)} ש'</span>`:`<span>${STATUS[t.status]}</span>`;
    return `<li><button type="button" class="row" data-open="${t.key}"><span class="dot" style="background:var(--p-${t.prio}-dot)"></span>
      <span class="rd"><span>${esc(t.desc)}</span><small><span class="mono">#${t.id}</span> · ${fmtDate(t.createdAt)} · ${esc(who)}</small></span>
      <span class="rs">${side}</span></button></li>`;
  }).join('');
  box.innerHTML=`<div class="list"><div class="reshead"><strong>${list.length} משימות</strong><button type="button" class="btn btn-ghost btn-sm" data-act="copy-csv"${list.length?'':' disabled'}>${svg('copy')}העתקה כטבלה (CSV)</button></div>
    ${list.length?`<ul class="rows">${rows}</ul>`:`<div class="empty">${S.tasks.length?'לא נמצאו משימות שמתאימות לחיפוש.':'עוד אין משימות בארכיון.'}</div>`}</div>
    ${S.loadedFrom?`<button type="button" class="linkbtn" data-act="load-older">מוצגות משימות מ-${fmtDate(S.loadedFrom)}. טעינת חודש קודם</button>`:''}`;
}
function csv(list){
  const q=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['מספר','תיאור','עדיפות','סטטוס','מיועד עבור','מבצע','נוצרה','נלקחה','בוצעה'];
  const st=ts=>ts?fmtStamp(ts,' '):'';
  return [head,...list.map(t=>[t.id,t.desc,PRIO[t.prio].name,STATUS[t.status],t.assignee?name(t.assignee):'כלל החוקרים',name(t.takenBy),st(t.createdAt),st(t.takenAt),st(t.doneAt)])].map(r=>r.map(q).join(',')).join('\n');
}

function viewNotifs(){
  const list=notifItems(), ls=lastSeen();
  const sub=isAdmin()?'משימות שבוצעו, חריגות, בקשות הצטרפות ואיפוס מספר אישי.':'משימות חדשות ופרסומי סידור עבודה.';
  const ic={new:'bell',done:'check',esc:'alert',sched:'calendar',claim:'users',reset:'lock'};
  const items=list.map(n=>{const {title,body}=notifText(n);
    const attr=n.kind==='sched'?`data-act="open-week" data-week="${n.week}"`:(n.kind==='claim'||n.kind==='reset')?'data-act="team"':`data-open="${n.task}"`;
    return `<li><button type="button" class="notif${n.at>ls?' unread':''}" ${attr}>
    <span class="nic ${n.kind}">${svg(ic[n.kind])}</span><span class="nb"><strong><span>${esc(title)}</span><time>${ago(n.at)}</time></strong><p>${esc(body)}</p></span></button></li>`;}).join('');
  return `<div class="vhead"><div><h2>התראות</h2><p class="sub">${sub}</p></div></div>
    <div class="note">${svg('bell')}<span>${!CFG.push?'התראות מופיעות כאן ובראש המסך כשהאפליקציה פתוחה.':pushState()==='on'?'ההתראות מגיעות לטלפון גם כשהאפליקציה סגורה. כאן מופיעה ההיסטוריה.':'כדי לקבל התראות לטלפון גם כשהאפליקציה סגורה, הפעל אותן בתפריט האישי (לחיצה על השם למעלה).'}</span></div>
    ${list.length?`<ul class="notifs">${items}</ul>`:`<div class="empty">אין התראות עדיין.</div>`}`;
}
function markSeen(){
  if(ME.preview||!ME.uid) return;
  const items=notifItems(); if(!items.length) return;
  const top=items[0].at; if(top<=lastSeen()) return;
  S.lastSeen=top;
  serial('state',()=>DB.doc(`data/users/${ME.uid}/state`).set({type:'state',lastSeen:top})).catch(()=>{});
}

/* ---------- sheets ---------- */
function taskSheet(t){
  const d=(a,b)=>a&&b?`<span class="mono">${fmtDur(b-a)}</span> ש'`:'—';
  const label=e=>e.t==='created'?(e.by&&e.by!=='admin'?`נשלחה על ידי ${name(e.by)}`:'נשלחה על ידי המנהל הראשי'):e.t==='taken'?`נלקחה על ידי ${name(e.by)}`:e.t==='done'?`סומנה כבוצעה על ידי ${name(e.by)}`:
    (e.state==='progress'?'חריגה: 8 שעות בביצוע. נשלחה התראה למנהל':'חריגה: 8 שעות ללא לקיחה. נשלחה התראה למנהל');
  const ev=(t.log||[]).slice(); const e=escInfo(t); if(e) ev.push({t:'escalated',at:e.at,state:e.state});
  const log=ev.sort((a,b)=>a.at-b.at).map(x=>`<li class="ev-${x.t}"><span class="ev">${esc(label(x))}</span><time>${fmtStamp(x.at)}</time></li>`).join('');
  const kv=[
    ['מיועד עבור',t.assignee?esc(name(t.assignee)):'כלל החוקרים'],
    ['נוצרה',`<span class="mono">${fmtTime(t.createdAt)}</span> · ${fmtDate(t.createdAt)}`],
    ['מבצע',t.takenBy?esc(name(t.takenBy)):'טרם נלקחה'],
    ['זמן עד לקיחה',t.takenAt?d(t.createdAt,t.takenAt):`<span class="mono">${fmtDur(Date.now()-t.createdAt)}</span> ש' ועדיין פתוחה`],
  ];
  if(t.takenAt) kv.push([t.doneAt?'משך ביצוע':'בביצוע כבר',t.doneAt?d(t.takenAt,t.doneAt):d(t.takenAt,Date.now())]);
  if(t.doneAt) kv.push(['סה"כ מיצירה לסיום',d(t.createdAt,t.doneAt)]);
  const act=actionHtml(t);
  return `<div class="grab"></div>
    <div class="phead">${prioChip(t.prio)}${statusChip(t)}<button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <h3 class="ptitle" id="sheet-title">משימה <span class="mono">#${t.id}</span></h3>
    <p class="fulldesc">${esc(t.desc)}</p>
    <dl class="kv">${kv.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <section class="logsec"><h4>${svg('lock')}יומן אירועים</h4><ol class="log">${log}</ol>
      <p class="locknote">היומן נכתב אוטומטית עם חותמת זמן לכל שלב. כל אירוע נשמר אצל מי שביצע אותו ואף אחד אחר לא יכול לשנות אותו.</p></section>
    ${act?`<div class="cact">${act}</div>`:''}`;
}
function assigneeOptions(){
  const g=gridFor(curWeek()), d=todayIdx();
  if(!g) return INV.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('');
  const on=INV.filter(r=>g[r.id]&&isWork(g[r.id][d])), offl=INV.filter(r=>!(g[r.id]&&isWork(g[r.id][d])));
  return `<optgroup label="במשמרת היום">${on.map(r=>`<option value="${r.id}">${esc(r.name)} · ${esc(SH[g[r.id][d]].n)}</option>`).join('')}</optgroup>`
    +(offl.length?`<optgroup label="לא במשמרת היום">${offl.map(r=>{const c=g[r.id]&&g[r.id][d];return `<option value="${r.id}">${esc(r.name)}${c&&SH[c].g?` · ${esc(SH[c].g)}`:''}</option>`;}).join('')}</optgroup>`:'');
}
function createSheet(){
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">משימה חדשה</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <form id="create-form" novalidate>
      <div class="field"><label for="f-desc">תיאור המשימה</label>
        <textarea id="f-desc" class="input" rows="4" placeholder="פירוט הדרישה המבצעית, כתובת והנחיות מיוחדות"></textarea></div>
      <fieldset><legend class="legend-t">עדיפות</legend><div class="prio-pick">
        <input type="radio" name="prio" id="f-p-low" value="low"><label for="f-p-low" class="p-low"><i></i>נמוכה</label>
        <input type="radio" name="prio" id="f-p-med" value="med" checked><label for="f-p-med" class="p-med"><i></i>בינונית</label>
        <input type="radio" name="prio" id="f-p-high" value="high"><label for="f-p-high" class="p-high"><i></i>גבוהה</label>
      </div></fieldset>
      <div class="field"><label for="f-assignee">מיועד עבור</label>
        <select id="f-assignee" class="input"><option value="">כלל החוקרים (פתוח לכולם)</option>${assigneeOptions()}</select>
        <p class="hint" id="f-hint">המשימה תופיע אצל כל החוקרים.</p></div>
      <p class="err" id="f-err" hidden>כתוב תיאור למשימה לפני השליחה.</p>
      <button type="submit" class="btn btn-primary" id="f-submit">${svg('send')}שליחת המשימה</button>
    </form>`;
}
function copySheet(text,title){
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">${esc(title)}</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <p class="sub" style="margin:0">ההעתקה האוטומטית לא זמינה כאן. הטקסט מסומן, אפשר להעתיק אותו ידנית.</p>
    <textarea id="copy-area" class="input" rows="12" readonly>${esc(text)}</textarea>`;
}
function cellSheet(wk,p,d){
  const ctx=weekCtx(wk), W=ctx.W, g=W.grid, r=RP[p]; if(!r) return '';
  const lk=W.locks&&W.locks[p]&&W.locks[p][d];
  const cur=cellCode(W,g,r,d);
  const prevC=d===0?ctx.prevSat[p]:(g&&g[p]?g[p][d-1]:null);
  const nextC=g&&g[p]&&d<6?g[p][d+1]:null;
  const warns=code=>{
    const w=[]; const rb=ruleBreak(p,code,d); if(rb) w.push(rb);
    if(restBreak(prevC,code,d)) w.push('יום אחרי ב כונן');
    if((code==='K'||code==='KC')&&nextC&&restBreak(code,nextC,d+1)) w.push(`מחר ${SH[nextC].n}, אסור אחרי כונן`);
    return w;
  };
  const grp=(t,codes)=>`<div class="opts-g"><h4>${t}</h4><div class="opts">${codes.map(c=>{const w=warns(c);return `<button type="button" class="opt" data-act="set-cell" data-c="${c}" aria-pressed="${c===cur}"><span class="sw k-${SH[c].k}"></span><span class="o"><b>${esc(SH[c].n)}</b><small>${esc(SH[c].ds)}</small>${w.length?`<em>${esc(w.join(' · '))}</em>`:''}</span></button>`;}).join('')}</div></div>`;
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">${esc(r.name)} · ${DAYS[d]} <span class="mono">${ctx.dates[d]}</span></h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <p class="hint">${esc(personRules(r).join(' · '))}</p>
    ${r.notes?`<div class="pnote">${svg('note')}<span>${esc(r.notes)}</span></div>`:''}
    ${grp('בוקר',['A','AC','MS','A9'])}
    ${grp('מתואמת',['M','M14','M15'])}
    ${grp('ערב',['K','KC'])}
    ${grp('היעדרות',['P','VAC','SICK','STUDY','LEAVE','COURSE'])}
    ${grp('תגבור',['R1','R2','R3'])}
    ${r.kind==='staff'?grp('קבועים',['MGR']):''}
    ${lk?`<button type="button" class="btn btn-ghost" data-act="unlock">${svg('reset')}ביטול השינוי הידני</button>`:''}
    <p class="hint">${g?'שינוי ידני נשאר במקומו גם ביצירה מחדש של הסידור.':'זה אילוץ לפני יצירת הסידור. המנוע ישבץ סביבו.'}</p>`;
}
function rulesSheet(){
  const cw=curWeek();
  const nextFor=i=>{let w=cw;for(let k=0;k<3;k++){if(mod3(weekIndex(w))===i)break;w=addDays(w,7);}return `${dayDate(w,5)}–${dayDate(w,6)}`;};
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">תקנים וחוקים כלליים</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <section class="rsec"><h4>תקן יומי</h4><ul>
      <li><b>א׳–ה׳: 7 חוקרים</b><span>4 בוקר (2 א, 1 א-בימ"ש, 1 א-מש"ל קבוע), 2 מתואמת (12:00, 14:00 או 15:00), 1 ב כונן</span></li>
      <li><b>שישי: 3 חוקרים</b><span>א, א-בימ"ש, ב כונן</span></li>
      <li><b>שבת: 3 חוקרים</b><span>א, ב כונן, ב-בימ"ש מוצ"ש</span></li>
      <li><b>קיזוז תקן בחוסר</b><span>קודם 3 בבוקר במקום 4 (יורד א אחד), אחר כך מתואמת אחת במקום 2</span></li></ul></section>
    <section class="rsec"><h4>סבב סופ"ש · 1 ל-3</h4><ul>${TRIPLETS.map((t,i)=>`<li><b>שלישייה ${i+1}: ${esc(t.map(name).join(', ')||'ריקה')}</b><span>סופ"ש קרוב: ${nextFor(i)}${t.length<3?' · פחות מ-3, יושלם ממחליפים':''}</span></li>`).join('')}</ul></section>
    <section class="rsec"><h4>חוקים</h4><ul>
      <li><span>אחרי ב כונן: אסור בוקר למחרת. רק מתואמת או פגרה.</span></li>
      <li><span>בסופ"ש: מי שב כונן או ב-בימ"ש בשבת עובד א או א-בימ"ש בשישי, ומי שב כונן בשישי עובד א בשבת.</span></li>
      <li><span>המחליף הקבוע ב-א-בימ"ש נכנס בימים שהקבוע בפגרה.</span></li>
      <li><span>פגרות של מי שבסבב יוצאות באמצע אותו שבוע. מי שלא בסבב, שישי ושבת נספרים כפגרות.</span></li>
      <li><span>חוקר מעל התקן בימי החול מוצע להסטה לתגבור בוקר או צהריים.</span></li>
      <li><span>קצינים ומטה מופיעים בסידור אבל לא נספרים בתקן.</span></li></ul></section>
    <button type="button" class="btn btn-ghost" data-act="team">${svg('users')}צוות וכללים אישיים</button>`;
}
function teamSheet(){
  const claims=pendingClaims();
  const byPerson={}; Object.keys(S.links).forEach(u=>{byPerson[S.links[u]]=u;});
  const pend=claims.map(u=>{const c=S.claims[u];
    if(c.person){const clash=byPerson[c.person];
      return `<li class="trow pending"><span class="tt"><span class="tn">מבקש להתחבר בתור ${esc(name(c.person))}</span><span class="ts">${esc(c.dev||'מכשיר')} · ${ago(c.at||Date.now())}${clash?' · יחליף את המכשיר המחובר כעת':''}</span></span>
      <span class="ta"><button type="button" class="btn btn-primary btn-sm" data-act="approve" data-u="${esc(u)}">אישור</button><button type="button" class="btn btn-ghost btn-sm" data-act="reject" data-u="${esc(u)}">דחייה</button></span></li>`;}
    return `<li class="trow pending"><span class="tt"><span class="tn">${esc(c.newName)} · לא ברשימה</span><span class="ts">${esc(c.dev||'מכשיר')} · ${ago(c.at||Date.now())}${c.note?` · ${esc(c.note)}`:''}</span></span>
      <span class="ta"><button type="button" class="btn btn-primary btn-sm" data-act="add-from-claim" data-u="${esc(u)}">הוספה לצוות</button><button type="button" class="btn btn-ghost btn-sm" data-act="reject" data-u="${esc(u)}">דחייה</button></span></li>`;
  }).join('');
  const own=isAdmin();
  const resets=resetReqs().map(u=>`<li class="trow pending"><span class="tt"><span class="tn">${esc(name(S.links[u]))} שכח את המספר האישי</span><span class="ts">ביקש איפוס ${ago(S.authOf[u].resetReq)} · וודא מולו שזה הוא לפני האיפוס</span></span>
      <span class="ta"><button type="button" class="btn btn-primary btn-sm" data-act="reset-pn" data-u="${esc(u)}">איפוס</button><button type="button" class="btn btn-ghost btn-sm" data-act="reset-ignore" data-u="${esc(u)}">התעלמות</button></span></li>`).join('');
  const loginTag=u=>{const d=S.authOf[u];if(!d||!d.hash)return '<span class="tlink off">טרם הגדיר מספר אישי</span>';return `<span class="tlink on">${(d.bio||[]).length?'מספר אישי + זיהוי ביומטרי':'מספר אישי'}</span>`;};
  const row=r=>{const u=byPerson[r.id], m=permOf(r.id), mt=[m.tasks?'שליחת משימות':'',m.sched?'סידור עבודה':''].filter(Boolean).join(' · ');
    return `<li class="trow"><span class="tt"><span class="tn">${esc(r.name)} ${own?`<span class="tlink ${u?'on':'off'}">${u?'מחובר':'לא מחובר'}</span>`:''}${mt?` <span class="tlink on">מנהל: ${esc(mt)}</span>`:''}</span><span class="ts">${esc(personRules(r).join(' · '))}${r.notes?` · ${esc(r.notes)}`:''}</span>${own&&u?`<span class="ts">${esc(devText(u))} ${loginTag(u)}</span>`:''}</span>
      ${own?`<span class="ta"><button type="button" class="btn btn-ghost btn-sm" data-act="edit-person" data-p="${r.id}">עריכה</button>${u?`<button type="button" class="btn btn-ghost btn-sm" data-act="unlink" data-u="${esc(u)}">ניתוק</button>`:''}${u&&S.authOf[u]&&S.authOf[u].hash?`<button type="button" class="btn btn-ghost btn-sm" data-act="reset-pn" data-u="${esc(u)}">איפוס כניסה</button>`:''}</span>`:''}</li>`;};
  if(!own) return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">הצוות וכללי השיבוץ</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <p class="hint">רק המנהל הראשי מוסיף אנשים, מאשר גישה ומשנה כללים והרשאות.</p>
    ${GROUPS.map(([gk,gl])=>{const ps=PEOPLE.filter(r=>grpOf(r)===gk);return ps.length?`<div class="tgroup"><h4>${gl}</h4><ul class="tlist">${ps.map(row).join('')}</ul></div>`:'';}).join('')}`;
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">צוות וכללים אישיים</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    ${claims.length?`<section class="rsec"><h4>בקשות הצטרפות</h4><ul class="tlist">${pend}</ul></section>`:''}
    ${resets?`<section class="rsec"><h4>בקשות איפוס מספר אישי</h4><ul class="tlist">${resets}</ul></section>`:''}
    <section class="rsec"><h4>איך מצרפים</h4><ol class="howto">
      <li>שלח לו את הקישור לאפליקציה. הוא מתקין אותה במסך הבית ופותח מהאייקון.</li>
      <li>הוא בוחר את השם שלו ומזין מספר אישי. אם השם לא ברשימה, הוא ממלא פרטים.</li>
      <li>הבקשה מופיעה כאן. מאשרים, ולשם חדש קובעים אם הוא בסידור ואילו כללים חלים עליו.</li>
      <li>מאותו רגע הוא נכנס עם המספר האישי, או עם Face ID / טביעת אצבע אם הפעיל. שכח את המספר? הבקשה מגיעה לכאן ומאפסים.</li></ol></section>
    ${GROUPS.map(([gk,gl])=>{const ps=PEOPLE.filter(r=>grpOf(r)===gk);return ps.length?`<div class="tgroup"><h4>${gl}</h4><ul class="tlist">${ps.map(row).join('')}</ul></div>`:'';}).join('')}
    <button type="button" class="addbtn" data-act="edit-person" data-p="">${svg('plus')}הוספת אדם לצוות</button>
    <section class="rsec"><h4>בדיקות</h4>
      <button type="button" class="btn btn-ghost" data-act="sys-check">${svg('check')}בדיקת מערכת והרשאות</button>
      ${CFG.push?`<button type="button" class="btn btn-ghost" data-act="push-test">${svg('bell')}שליחת התראת ניסיון אליי</button>`:''}
      <p class="hint">בדיקת המערכת יוצרת משתמש בדיקה זמני ומוודאת מול השרת שכל הרשאה נאכפת. אחרי הבדיקה הכל נמחק.</p></section>`;
}
function personSheet(id,pendingUid){
  const base=id&&RP[id]?RP[id]:normPerson({name:pendingUid&&S.claims[pendingUid]?S.claims[pendingUid].newName:'',kind:'rot',off:2,weekend:false,reinf:true,tasks:true,notes:pendingUid&&S.claims[pendingUid]?S.claims[pendingUid].note||'':''});
  const r=Object.assign({fixed:'A',status:'LEAVE',off:2,shifts:ALL_SHIFTS.slice(),weekend:false,reinf:true,triplet:null,studyDay:null,court:null},base);
  const sh=new Set(r.shifts);
  const kinds=[['rot','חלק מהסידור האוטומטי','המנוע משבץ אותו לפי התקן והכללים שלמטה'],['manual','שיבוץ ידני','מופיע בסידור, המנהל משבץ אותו בעצמו (למשל סטודנט)'],['staff','קבוע (קצינים ומטה)','משמרת קבועה בימי חול, לא נספר בתקן'],['absent','מוחרג משיבוץ','חל"ד או קק"צ']];
  const tripOpt=i=>`<option value="${i}"${r.triplet===i?' selected':''}>שלישייה ${i+1}: ${esc(TRIPLETS[i].filter(p=>p!==id).map(name).join(', ')||'ריקה')}</option>`;
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">${id?'עריכה: '+esc(r.name):'הוספה לצוות'}</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    ${pendingUid?'<p class="hint">אחרי השמירה, החשבון שביקש להצטרף יחובר לשם הזה ויקבל גישה.</p>':''}
    <form id="person-form" novalidate data-id="${esc(id||'')}" data-uid="${esc(pendingUid||'')}">
      <div class="field"><label for="pe-name">שם</label><input id="pe-name" class="input" maxlength="40" value="${esc(r.name)}"></div>
      <fieldset><legend class="legend-t">שיבוץ בסידור</legend><div class="kinds">${kinds.map(([k,l,h])=>`<label class="check"><input type="radio" name="pe-kind" id="pe-kind-${k}" value="${k}"${r.kind===k?' checked':''}><span>${l}<small>${h}</small></span></label>`).join('')}</div></fieldset>
      <div class="pe-sec" id="pe-rot"${r.kind==='rot'?'':' hidden'}>
        <div class="field"><label for="pe-off">פגרות בשבוע</label><select id="pe-off" class="input">${[1,2,3,4].map(n=>`<option value="${n}"${r.off===n?' selected':''}>${n}${n===2?' (סידור רגיל)':n===3?' (סידור צפוני)':''}</option>`).join('')}</select></div>
        <fieldset><legend class="legend-t">משמרות מותרות</legend><div class="checks">${ALL_SHIFTS.map(s=>`<label class="check"><input type="checkbox" id="pe-sh-${s}" data-sh="${s}"${sh.has(s)?' checked':''}>${esc(SHIFT_NAMES[s])}</label>`).join('')}</div></fieldset>
        <label class="check"><input type="checkbox" id="pe-weekend"${r.weekend?' checked':''}>משתתף בסבב סופ"ש</label>
        <div class="field" id="pe-tri-f"${r.weekend?'':' hidden'}><label for="pe-triplet">שלישיית סופ"ש</label><select id="pe-triplet" class="input"><option value="">בלי שלישייה קבועה (מחליף)</option>${[0,1,2].map(tripOpt).join('')}</select></div>
        <label class="check"><input type="checkbox" id="pe-reinf"${r.reinf?' checked':''}>כשיר לתגבורים</label>
        <div class="field"><label for="pe-study">יום לימודים קבוע</label><select id="pe-study" class="input"><option value="">אין</option>${[0,1,2,3,4].map(d=>`<option value="${d}"${r.studyDay===d?' selected':''}>יום ${DAYS[d]}</option>`).join('')}</select></div>
        <div class="field"><label for="pe-court">תפקיד ב-א-בימ"ש</label><select id="pe-court" class="input"><option value="">רגיל</option><option value="primary"${r.court==='primary'?' selected':''}>קבוע ב-א-בימ"ש</option><option value="backup"${r.court==='backup'?' selected':''}>מחליף קבוע</option></select></div>
      </div>
      <div class="pe-sec" id="pe-staff"${r.kind==='staff'?'':' hidden'}>
        <div class="field"><label for="pe-fixed">משמרת קבועה בימים א׳–ה׳</label><select id="pe-fixed" class="input">${['A','MS','MGR'].map(c=>`<option value="${c}"${r.fixed===c?' selected':''}>${esc(SH[c].n)}</option>`).join('')}</select></div>
      </div>
      <div class="pe-sec" id="pe-absent"${r.kind==='absent'?'':' hidden'}>
        <div class="field"><label for="pe-status">סטטוס</label><select id="pe-status" class="input">${['LEAVE','COURSE'].map(c=>`<option value="${c}"${r.status===c?' selected':''}>${esc(SH[c].n)} · ${esc(SH[c].ds)}</option>`).join('')}</select></div>
      </div>
      <label class="check"><input type="checkbox" id="pe-tasks"${r.tasks?' checked':''}>מקבל משימות ומגיש דיווח משמרת</label>
      <fieldset><legend class="legend-t">הרשאות ניהול</legend><div class="kinds">
        <label class="check"><input type="checkbox" id="pe-perm-tasks"${permOf(id).tasks?' checked':''}><span>שליחת משימות ועדכונים לחוקרים<small>רואה את כל המשימות, מקבל התראות על ביצוע וחריגות</small></span></label>
        <label class="check"><input type="checkbox" id="pe-perm-sched"${permOf(id).sched?' checked':''}><span>עריכה ופרסום של סידור העבודה<small>יוצר, משנה ומפרסם סידור, כולל קיזוז ותגבורים</small></span></label>
      </div><p class="hint">הוספת אנשים, אישור גישה, כללים אישיים, סיכום יומי וביצועים נשארים רק אצלך. ביטול הרשאה לא מוחק את מה שהמנהל כבר עשה.</p></fieldset>
      <div class="field"><label for="pe-notes">כללים מנחים לסידור שלו</label><textarea id="pe-notes" class="input" rows="3" maxlength="400" placeholder="למשל: לא לשבץ ב כונן ביום חמישי. מעדיף מתואמת 14:00.">${esc(r.notes)}</textarea>
        <p class="hint">הכללים שמעל נאכפים אוטומטית. ההערות כאן מופיעות לידו בדף הצוות ובכל משבצת שלו, כדי שתתחשב בהן בשיבוץ.</p></div>
      <p class="err" id="pe-err" hidden>כתוב שם.</p>
      <button type="submit" class="btn btn-primary">${svg('check')}${pendingUid?'שמירה ואישור גישה':'שמירה'}</button>
      ${id?`<button type="button" class="btn btn-danger" data-act="remove-person" data-p="${esc(id)}">הסרה מהצוות</button>`:''}
    </form>`;
}
function meSheet(){
  const p=ME.owner?ME.preview:personOf(), nm=ME.owner?(ME.name||'מנהל ראשי'):name(p);
  const role=ME.owner?'מנהל ראשי':(()=>{const m=permOf(p);return m.tasks||m.sched?'מנהל':RP[p]&&RP[p].kind==='staff'?'קצינים ומטה':'חוקר';})();
  const bl=bioName();
  let bio='';
  if(bioOnDevice()) bio=`<div class="mrow"><span>${svg(bioIcon())}<span><b>כניסה עם ${bl} פעילה במכשיר הזה</b><small>בפתיחה הבאה נכנסים בלי להקליד</small></span></span><button type="button" class="btn btn-ghost btn-sm" data-act="bio-off">ביטול</button></div>`;
  else if(AUTH.bioState==='ok') bio=`<button type="button" class="btn btn-ghost" data-act="bio-enable"${AUTH.bioBusy?' disabled':''}>${svg(bioIcon())}הפעלת כניסה עם ${bl}</button><p class="hint">בטלפון בלי ${bl}, הכניסה תהיה עם קוד הנעילה של המכשיר.</p>`;
  else if(AUTH.bioState==='no') bio=`<p class="hint">במכשיר או בדפדפן הזה אין זיהוי ביומטרי שהאפליקציה יכולה להשתמש בו. הכניסה נשארת במספר אישי.</p>`;
  else bio=`<p class="hint">בודק אם אפשר להיכנס עם ${bl}…</p>`;
  return `<div class="grab"></div>
    <div class="phead"><div><h3 class="ptitle" id="sheet-title">${esc(nm)}</h3><p class="sub">${esc(role)}</p></div><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <section class="rsec"><h4>כניסה לאפליקציה</h4>
      <div class="mrow"><span>${svg('lock')}<span><b>מספר אישי</b><small>${S.auth&&S.auth.setAt?'הוגדר '+esc(fmtDate(S.auth.setAt)):'מוגדר'}</small></span></span><button type="button" class="btn btn-ghost btn-sm" data-act="pn-change">החלפה</button></div>
      ${bio}
      <p class="hint">האפליקציה ננעלת לבד אחרי 10 דקות בלי שימוש.</p>
    </section>
    ${pushSection()}
    <button type="button" class="btn btn-primary" data-act="lock">${svg('lock')}נעילה עכשיו</button>
    ${ME.owner?'<button type="button" class="btn btn-ghost" data-act="admin-logout">התנתקות מהמכשיר</button>':''}`;
}
function forgotSheet(){
  const body=ME.owner
    ?`<p>אתה המנהל הראשי. התנתק מהמכשיר והיכנס שוב עם המייל והסיסמה של המנהל: אחרי כניסה כזו אפשר להגדיר מספר אישי חדש.</p>
      <button type="button" class="btn btn-primary" data-act="admin-relogin">התנתקות וכניסה מחדש</button>`
    :`<p>המנהל יאפס את הכניסה שלך, ואז תגדיר כאן מספר אישי חדש. כדאי להודיע לו גם בטלפון או בהודעה, כדי שיזהה שזה באמת אתה.</p>
      <button type="button" class="btn btn-primary" data-act="reset-req">${svg('send')}שליחת בקשת איפוס למנהל</button>`;
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">שכחתי את המספר האישי</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    <div class="gate">${body}</div>`;
}
function fillProfiles(){}
function renderSheet(){
  const el=$('#sheet');
  if(!U.sheet){el.hidden=true;el.innerHTML='';return;}
  let inner='';
  const T=U.sheet.type;
  if(T==='task'){const t=S.tasks.find(x=>x.key===U.sheet.id);if(!t){U.sheet=null;return renderSheet();}inner=taskSheet(t);}
  else if(T==='create') inner=createSheet();
  else if(T==='copy') inner=copySheet(U.sheet.text,U.sheet.title);
  else if(T==='cell') inner=cellSheet(U.sheet.wk,U.sheet.p,U.sheet.d);
  else if(T==='rules') inner=rulesSheet();
  else if(T==='team') inner=teamSheet();
  else if(T==='person') inner=personSheet(U.sheet.id,U.sheet.uid);
  else if(T==='me') inner=meSheet();
  else if(T==='forgot') inner=forgotSheet();
  else if(T==='check') inner=checkSheet();
  else if(T==='install') inner=installSheet();
  el.innerHTML=`<div class="panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">${inner}</div>`;
  el.hidden=false;
  if(T==='team') fillProfiles();
  if(T==='copy'){const ta=$('#copy-area');if(ta){ta.focus();ta.select();}}
  else if(!U.sheet.quiet){const x=el.querySelector('.x');if(x)x.focus({preventScroll:true});}
}
function closeSheet(){U.sheet=null;renderSheet();}

/* ---------- render ---------- */
function renderHeader(){
  const who=$('#who'), bar=$('#bar');
  if(ME.phase!=='ready'||gateHtml()){who.innerHTML='';bar.hidden=true;return;}
  const lockBtn=authOn()&&hasPN()?`<button type="button" class="lockbtn" data-act="lock" aria-label="נעילת האפליקציה">${svg('lock')}</button>`:'';
  if(ME.owner){
    const p=ME.preview;
    who.innerHTML=`${lockBtn}<button type="button" class="whobtn" data-act="me" aria-label="התפריט האישי"><span class="who-txt"><strong>${esc(p?name(p):(ME.name||'מנהל'))}</strong><span>${p?'תצוגה מקדימה':'מנהל ראשי'}</span></span><span class="avatar" aria-hidden="true">${esc((p?name(p):(ME.name||'מ'))[0])}</span></button>`;
    const pend=pendingClaims().length+resetReqs().length;
    bar.innerHTML=`<label for="view-as">תצוגה</label><select id="view-as"><option value="">מנהל</option>${PEOPLE.map(r=>`<option value="${r.id}"${r.id===p?' selected':''}>כ: ${esc(r.name)}</option>`).join('')}</select>
      <button type="button" class="teambtn" data-act="team">${svg('users')}צוות${pend?` <span class="badge2">${pend}</span>`:''}</button>`;
    bar.hidden=false;
  }else{
    const p=personOf(), m=permOf(p);
    const role=m.tasks||m.sched?'מנהל · '+[m.tasks?'משימות':'',m.sched?'סידור':''].filter(Boolean).join(' ו'):RP[p]&&RP[p].kind==='staff'?'קצינים ומטה':'חוקר';
    who.innerHTML=p&&RP[p]?`${lockBtn}<button type="button" class="whobtn" data-act="me" aria-label="התפריט האישי"><span class="who-txt"><strong>${esc(name(p))}</strong><span>${role}</span></span><span class="avatar" aria-hidden="true">${esc(name(p)[0])}</span></button>`:'';
    bar.hidden=true;
  }
}
function renderTabs(){
  const tb=$('#tabbar');
  if(gateHtml()){tb.hidden=true;return;}
  tb.hidden=false;
  const tabs=tabsFor(roleOf()), ls=lastSeen();
  const unread=notifItems().filter(n=>n.at>ls).length;
  if(!tabs.some(t=>t[0]===U.tab)) U.tab='feed';
  tb.innerHTML=tabs.map(([k,l,i])=>`<button type="button" class="tab" data-act="tab" data-tab="${k}"${k===U.tab?' aria-current="page"':''}>${svg(i)}<span>${l}</span>${k==='notifs'&&unread?`<span class="badge">${unread>99?'99+':unread}</span>`:''}</button>`).join('');
}
let pendingView=false;
function inputBusy(){const a=document.activeElement;return !!(a&&a.closest&&a.closest('#view')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));}
function renderView(){
  pendingView=false;
  const g=gateHtml();
  if(g){$('#view').innerHTML=g;return;}
  if(!tabsFor(roleOf()).some(t=>t[0]===U.tab)) U.tab='feed';
  const fn={feed:viewFeed,sched:viewSchedule,archive:viewArchive,summary:viewSummary,stats:viewStats,notifs:viewNotifs,report:viewReport}[U.tab];
  let top='';
  if(ME.preview) top=`<div class="banner warn">${svg('eye')}<span>תצוגה כ: <b>${esc(name(ME.preview))}</b>. פעולות לא נשמרות.</span></div>`;
  $('#view').innerHTML=top+fn();
  if(U.tab==='sched') fitCells();
  if(U.tab==='archive') renderArchiveResults();
  if(U.tab==='notifs') markSeen();
}
function render(){renderHeader();renderTabs();if(inputBusy())pendingView=true;else renderView();saveUI();}
let queued=false;
function changed(){if(queued)return;queued=true;setTimeout(()=>{queued=false;derive();checkPush();render();if(U.sheet&&U.sheet.type==='task'){U.sheet.quiet=true;renderSheet();}else if(U.sheet&&U.sheet.type==='team'){U.sheet.quiet=true;renderSheet();}},40);}
document.addEventListener('focusout',()=>{setTimeout(()=>{if(pendingView&&!inputBusy())renderView();},0);});
function fitCells(){
  document.querySelectorAll('#view .cell, #view .mw .c').forEach(el=>{
    el.classList.remove('xs');
    if(el.scrollWidth>el.clientWidth+1) el.classList.add('xs');
  });
}
try{if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(U.tab==='sched')fitCells();});}catch(e){}

/* ---------- events ---------- */
function goWeek(wk){U.schedWeek=wk;U.schedDay=wk===curWeek()?todayIdx():0;}
function arm(a,label,run){
  if(a.dataset.armed){delete a.dataset.armed;run();return;}
  const orig=a.innerHTML; a.dataset.armed='1'; a.textContent=label;
  setTimeout(()=>{if(a.isConnected&&a.dataset.armed){delete a.dataset.armed;a.innerHTML=orig;}},3500);
}
function weekEdit(wk,fn){
  if(!canSchedV()) return;
  if(readOnly()){toast(blockedMsg());return;}
  const W=S.sched[wk]?clone(S.sched[wk]):{locks:{},gen:0};
  W.locks=W.locks||{};
  S.sched[wk]=W;
  fn(W);
  if(W.published&&W.grid) W.dirty=true;
  saveWeek(wk);
  render();
}
function setCell(wk,p,d,code){
  weekEdit(wk,W=>{
    W.locks[p]=W.locks[p]||{};
    const ex=W.locks[p][d];
    if(W.grid&&!W.grid[p]) W.grid[p]=[null,null,null,null,null,null,null];
    const prev=ex?ex.prev:(W.grid?W.grid[p][d]:null);
    W.locks[p][d]={c:code,prev:prev==null?null:prev};
    if(W.grid) W.grid[p][d]=code;
  });
}
function readPersonForm(f){
  const kind=(f.querySelector('input[name="pe-kind"]:checked')||{}).value||'rot';
  const shifts=[...f.querySelectorAll('[data-sh]')].filter(x=>x.checked).map(x=>x.dataset.sh);
  const tri=$('#pe-triplet').value, st=$('#pe-study').value;
  return {name:$('#pe-name').value.trim().slice(0,40),kind,
    off:+$('#pe-off').value, shifts:shifts.length?shifts:['A'],
    weekend:$('#pe-weekend').checked, triplet:tri===''?null:+tri,
    reinf:$('#pe-reinf').checked, studyDay:st===''?null:+st,
    court:$('#pe-court').value||null, fixed:$('#pe-fixed').value, status:$('#pe-status').value,
    tasks:$('#pe-tasks').checked, notes:$('#pe-notes').value.trim().slice(0,400)};
}

document.addEventListener('click',e=>{
  if(e.target.id==='sheet'){closeSheet();return;}
  const a=e.target.closest('[data-act]');
  if(a&&!a.disabled){
    const act=a.dataset.act;
    switch(act){
      case 'tab': U.tab=a.dataset.tab; U.reportEdit=false; if(U.tab==='sched'&&!U.schedWeek) goWeek(curWeek()); renderTabs(); renderView(); saveUI(); window.scrollTo(0,0); return;
      case 'filter': U.feedFilter=a.dataset.f; renderView(); return;
      case 'take': changeTask(a.dataset.id,'take'); return;
      case 'done': changeTask(a.dataset.id,'done'); return;
      case 'close': closeSheet(); return;
      case 'new': if(readOnly()){toast(blockedMsg());return;} U.sheet={type:'create'}; renderSheet(); setTimeout(()=>{const f=$('#f-desc');if(f)f.focus();},60); return;
      case 'step':{const k=a.dataset.k;const inp=document.getElementById('r-'+k);const v=Math.max(0,Math.min(999,(parseInt(inp.value,10)||0)+Number(a.dataset.d)));inp.value=v;if(U.draft)U.draft[k]=v;return;}
      case 'report-edit': U.reportEdit=true; U.draft=null; renderView(); return;
      case 'copy-summary': copyText(U.lastMsg||'','ההודעה הועתקה. אפשר להדביק אותה ב-WhatsApp.','סיכום יומי'); return;
      case 'copy-csv':{const l=archiveFiltered();copyText(csv(l),`הועתקו ${l.length} שורות. אפשר להדביק אותן ב-Excel או ב-Google Sheets.`,'טבלת משימות (CSV)');return;}
      case 'range': U.statsRange=+a.dataset.r; renderView(); return;
      case 'clear-filters': Object.assign(U.archive,{from:'',to:'',inv:'',prio:'',status:''}); ['a-from','a-to','a-inv','a-prio','a-status'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); renderArchiveResults(); return;
      /* joining */
      case 'claim':{
        const p=a.dataset.p;
        if(authOn()&&!hasPN()){Object.assign(AUTH,{pending:{person:p},mode:'set1',pad:'',first:'',err:''});U.reclaim=false;render();window.scrollTo(0,0);return;}
        sendClaim({person:p});
        return;}
      /* app install, admin sign-in, phone notifications, checks */
      case 'install': if(deferredInstall){deferredInstall.prompt();deferredInstall.userChoice.finally(()=>{deferredInstall=null;render();});} else {U.sheet={type:'install'};renderSheet();} return;
      case 'skip-install': U.skipInstall=true; lsSet('inv-skip-install','1'); render(); return;
      case 'show-install': U.sheet={type:'install'}; renderSheet(); return;
      case 'retry': location.reload(); return;
      case 'admin-login': U.adminLogin=true; render(); setTimeout(()=>{const n=$('#ad-email');if(n)n.focus();},50); return;
      case 'admin-back': U.adminLogin=false; render(); return;
      case 'admin-logout': arm(a,'להתנתק?',()=>{lsSet(LK('active'),null);if(FB)FB.signOut().catch(()=>{});}); return;
      case 'admin-relogin': if(FB){lsSet(LK('active'),null);lsSet('inv-admin-relogin','1');FB.signOut().catch(()=>{});} return;
      case 'push-on': enablePush(); return;
      case 'push-off': disablePush(); return;
      case 'push-later': U.pushLater=true; render(); return;
      case 'push-test': sendPush([ME.uid],'בדיקת התראה','אם ההודעה הזו הגיעה לטלפון, ההתראות עובדות.',{self:true,tag:'test'}).then(()=>toast('נשלחה התראת ניסיון. היא אמורה להגיע תוך דקה לכל טלפון שבו הפעלת התראות.')); return;
      case 'sys-check': runSystemCheck(); return;
      case 'skip-import': U.skipImport=true; render(); return;
      case 'apk': return;
      case 'load-older': loadOlder((S.loadedFrom||Date.now())-30*D); return;
      /* sign-in */
      case 'pn-key': pnKey(a.dataset.k); return;
      case 'pn-del': pnDel(); return;
      case 'pn-ok': pnSubmit(); return;
      case 'pn-cancel': Object.assign(AUTH,{mode:null,pending:null,change:false,pad:'',first:'',err:''}); render(); return;
      case 'pn-forgot': pnForgot(); return;
      case 'reset-req': sendResetReq(); return;
      case 'bio-unlock': bioUnlock(false); return;
      case 'bio-enable': bioEnable(); return;
      case 'bio-skip': AUTH.bioOffer=false; render(); return;
      case 'bio-off': bioDisable(); return;
      case 'lock': lockNow(); return;
      case 'me': if(gateHtml()) return; U.sheet={type:'me'}; bioAvailable().then(()=>{if(U.sheet&&U.sheet.type==='me')renderSheet();}); renderSheet(); return;
      case 'pn-change': U.sheet=null; renderSheet(); Object.assign(AUTH,{change:true,mode:'set1',pad:'',first:'',err:''}); render(); window.scrollTo(0,0); return;
      case 'reset-pn':{
        const u=a.dataset.u; if(!isAdmin()) return;
        arm(a,'לאפס?',()=>{
          delete S.authOf[u]; renderSheet();
          DB.doc(`data/users/${u}/auth`).delete().then(()=>toast(`הכניסה של ${name(S.links[u]||S.everLinked[u])} אופסה. בפתיחה הבאה הוא יגדיר מספר אישי חדש.`)).catch(err=>toast(errMsg(err)));
        });
        return;}
      case 'reset-ignore':{
        const u=a.dataset.u, d=S.authOf[u]; if(!isAdmin()||!d) return;
        const body=Object.assign({},d); delete body.resetReq; S.authOf[u]=body; renderSheet(); renderHeader();
        DB.doc(`data/users/${u}/auth`).set(body).catch(err=>toast(errMsg(err)));
        return;}
      case 'reclaim': U.reclaim=true; U.newMe=false; render(); return;
      case 'newme': U.newMe=true; render(); setTimeout(()=>{const n=$('#nm-name');if(n)n.focus();},50); return;
      case 'newme-back': U.newMe=false; render(); return;
      case 'team': if(a.id==='push') a.hidden=true; U.sheet={type:'team'}; renderSheet(); return;
      case 'rules': U.sheet={type:'rules'}; renderSheet(); return;
      case 'edit-person': U.sheet={type:'person',id:a.dataset.p||null,uid:null}; renderSheet(); return;
      case 'add-from-claim': U.sheet={type:'person',id:null,uid:a.dataset.u}; renderSheet(); return;
      case 'approve':{
        const u=a.dataset.u, c=S.claims[u]; if(!c||!c.person) return;
        const map=Object.assign({},S.links); Object.keys(map).forEach(k=>{if(map[k]===c.person)delete map[k];}); map[u]=c.person;
        const ever=Object.assign({},S.everLinked,{[u]:c.person});
        const meta=Object.assign({},S.linkMeta,{[u]:{dev:c.dev||'',at:Date.now()}});
        delete S.claims[u]; renderSheet();
        saveLinks(map,ever,meta).then(()=>DB.doc('claims/'+u).set(Object.assign({},c,{approved:true,approvedAt:Date.now()}))).then(()=>toast(`${name(c.person)} חובר לאפליקציה.`)).catch(err=>toast(errMsg(err)));
        return;}
      case 'reject':{const u=a.dataset.u; delete S.claims[u]; renderSheet(); DB.doc('claims/'+u).delete().catch(err=>toast(errMsg(err))); return;}
      case 'unlink':{
        const u=a.dataset.u; arm(a,'לנתק?',()=>{
          const map=Object.assign({},S.links); const p=map[u]; delete map[u]; renderSheet();
          saveLinks(map,S.everLinked).then(()=>toast(`${name(p)} נותק.`)).catch(err=>toast(errMsg(err)));
        });
        return;}
      case 'remove-person':{
        const id=a.dataset.p; arm(a,'לאשר הסרה? ההיסטוריה שלו נשמרת',()=>{
          const list=rosterList().map(p=>p.id===id?Object.assign({},p,{removed:true}):p);
          const map=Object.assign({},S.links); Object.keys(map).forEach(u=>{if(map[u]===id)delete map[u];});
          const m=permOf(id);
          ((m.tasks||m.sched)?savePerms(id,{}):Promise.resolve())
            .then(()=>Promise.all([saveRoster(list),saveLinks(map,S.everLinked)])).then(()=>toast(`${name(id)} הוסר מהצוות.`)).catch(err=>toast(errMsg(err)));
          U.sheet={type:'team'}; renderSheet(); render();
        });
        return;}
      /* schedule */
      case 'goto-sched': U.tab='sched'; goWeek(curWeek()); renderTabs(); renderView(); saveUI(); window.scrollTo(0,0); return;
      case 'open-week': if(a.id==='push') a.hidden=true; U.tab='sched'; goWeek(a.dataset.week); renderTabs(); renderView(); saveUI(); window.scrollTo(0,0); return;
      case 'week': goWeek(addDays(U.schedWeek||curWeek(),7*Number(a.dataset.dir))); renderView(); return;
      case 'smode': U.schedMode=a.dataset.m; renderView(); saveUI(); return;
      case 'sday': U.schedDay=+a.dataset.d; renderView(); return;
      case 'cell': if(!canSchedV()) return; U.sheet={type:'cell',wk:U.schedWeek,p:a.dataset.p,d:+a.dataset.d}; renderSheet(); return;
      case 'set-cell':{const sh=U.sheet;setCell(sh.wk,sh.p,sh.d,a.dataset.c);closeSheet();toast(`${name(sh.p)}, ${DAYS[sh.d]}: ${SH[a.dataset.c].n}`);return;}
      case 'unlock':{const sh=U.sheet;weekEdit(sh.wk,W=>{const L=W.locks[sh.p]&&W.locks[sh.p][sh.d];if(!L)return;delete W.locks[sh.p][sh.d];if(W.grid&&W.grid[sh.p])W.grid[sh.p][sh.d]=L.prev;});closeSheet();toast('השינוי הידני בוטל.');return;}
      case 'reinf':{const p=a.dataset.p,d=+a.dataset.d,c=a.dataset.c;setCell(U.schedWeek,p,d,c);toast(`${name(p)} הוסט ל${SH[c].n} ביום ${DAYS[d]}.`);return;}
      case 'reduce':{const d=+a.dataset.d,l=+a.dataset.l,wk=U.schedWeek;weekEdit(wk,W=>{W.reduce=W.reduce||{};if(l)W.reduce[d]=l;else delete W.reduce[d];repairDay(W,wk,d);});toast(l?`התקן ביום ${DAYS[d]} קוזז.`:`הקיזוז ביום ${DAYS[d]} בוטל.`);return;}
      case 'gen':{const wk=U.schedWeek;weekEdit(wk,W=>{W.grid=generateGrid(wk,W.gen||0);W.gen=(W.gen||0)+1;W.genAt=Date.now();});toast('הסידור נוצר. בדוק אותו ופרסם לחוקרים.');return;}
      case 'regen':{const wk=U.schedWeek;arm(a,'לאשר? שינויים ידניים יישארו',()=>{weekEdit(wk,W=>{W.grid=generateGrid(wk,W.gen||0);W.gen=(W.gen||0)+1;W.genAt=Date.now();});toast('נוצרה גרסה חדשה. השינויים הידניים נשארו במקומם.');});return;}
      case 'publish':{
        const wk=U.schedWeek; if(!canSchedV()||!S.sched[wk]||!S.sched[wk].grid) return;
        if(readOnly()){toast(blockedMsg());return;}
        const W=clone(S.sched[wk]), upd=!!W.published;
        W.pubGrid=clone(W.grid); W.published=true; W.pubAt=Date.now(); W.pubCount=(W.pubCount||0)+1; W.dirty=false;
        S.sched[wk]=W; saveWeek(wk); render();
        notifySched(wk,upd);
        toast(upd?'העדכון פורסם. החוקרים יקבלו התראה.':'הסידור פורסם. החוקרים יקבלו התראה.');
        return;}
      case 'copy-sched':{const W=S.sched[U.schedWeek];if(W&&W.grid)copyText(schedText(U.schedWeek,W.grid),'הסידור הועתק. אפשר להדביק אותו ב-WhatsApp.','סידור עבודה');return;}
    }
  }
  const o=e.target.closest('[data-open]');
  if(o){
    if(o.id==='push') o.hidden=true;
    const t=S.tasks.find(x=>x.key===o.dataset.open); if(!t) return;
    U.sheet={type:'task',id:t.key}; renderSheet();
  }
});

document.addEventListener('change',e=>{
  const id=e.target.id;
  if(id==='view-as'){ME.preview=e.target.value||null;U.feedFilter='all';U.draft=null;U.sheet=null;renderSheet();render();window.scrollTo(0,0);return;}
  if(id==='s-date'){U.summaryKey=e.target.value||null;if(U.summaryKey)loadOlderFor(U.summaryKey);renderView();return;}
  if(id==='r-dept'&&U.draft){U.draft.dept=e.target.value;return;}
  if(id==='f-assignee'){const v=e.target.value;$('#f-hint').textContent=v?`המשימה תופיע רק אצל ${name(v)}.`:'המשימה תופיע אצל כל החוקרים.';return;}
  if(e.target.name==='pe-kind'){['rot','staff','absent'].forEach(k=>{const s=$('#pe-'+k);if(s)s.hidden=e.target.value!==k;});return;}
  if(id==='pe-weekend'){$('#pe-tri-f').hidden=!e.target.checked;return;}
  const map={'a-from':'from','a-to':'to','a-inv':'inv','a-prio':'prio','a-status':'status'};
  if(map[id]){U.archive[map[id]]=e.target.value;if(id==='a-from'&&e.target.value)loadOlderFor(e.target.value);renderArchiveResults();}
});
document.addEventListener('input',e=>{
  if(e.target.id==='a-q'){U.archive.q=e.target.value;renderArchiveResults();}
  if(e.target.id==='f-desc'&&e.target.value.trim()){const er=$('#f-err');if(er)er.hidden=true;}
  if(e.target.dataset&&e.target.dataset.k&&U.draft){U.draft[e.target.dataset.k]=Math.max(0,Math.min(999,parseInt(e.target.value,10)||0));}
});
document.addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.target;
  if(f.id==='create-form'){
    const desc=$('#f-desc').value.trim();
    if(!desc){$('#f-err').hidden=false;$('#f-desc').focus();return;}
    const prio=(document.querySelector('input[name="prio"]:checked')||{}).value||'med';
    const assignee=$('#f-assignee').value;
    const btn=$('#f-submit'); btn.disabled=true;
    try{
      const t=await createTask(desc,prio,assignee);
      closeSheet(); U.feedFilter='all'; render();
      toast(assignee?`משימה #${t.id} נשלחה ל${name(assignee)}.`:`משימה #${t.id} נשלחה לכל החוקרים.`);
    }catch(err){btn.disabled=false;toast(errMsg(err));}
    return;
  }
  if(f.id==='report-form'){
    if(readOnly()){toast(blockedMsg());return;}
    const me=viewer(), now=Date.now(), key=wdKey(now), dr=U.draft||{};
    const body={type:'report',person:me,key,at:now,dept:dr.dept||'general'};
    FIELDS.forEach(([k])=>{body[k]=Math.max(0,Math.min(999,Number(dr[k])||0));});
    const ex=(S.reports[ME.uid]||[]).find(r=>r.key===key&&r.person===me); if(ex) body.edited=true;
    try{
      await serial('r-'+key,()=>withRetry(()=>DB.doc(`data/users/${ME.uid}/r-${key}`).set(body)));
      U.reportEdit=false; U.draft=null; render(); window.scrollTo(0,0);
      toast('הדיווח הוגש ויצורף לסיכום היומי.');
    }catch(err){toast(errMsg(err));}
    return;
  }
  if(f.id==='admin-form'){adminLogin();return;}
  if(f.id==='import-form'){runImport();return;}
  if(f.id==='newme-form'){
    const nm=$('#nm-name').value.trim().slice(0,40), note=$('#nm-note').value.trim().slice(0,300);
    if(!nm){$('#nm-err').hidden=false;$('#nm-name').focus();return;}
    const body={newName:nm,note};
    if(authOn()&&!hasPN()){U.newMe=false;U.reclaim=false;Object.assign(AUTH,{pending:body,mode:'set1',pad:'',first:'',err:''});render();window.scrollTo(0,0);return;}
    sendClaim(body);
    return;
  }
  if(f.id==='person-form'){
    if(!isAdmin()) return;
    const v=readPersonForm(f);
    if(!v.name){$('#pe-err').hidden=false;$('#pe-name').focus();return;}
    const id=f.dataset.id||('p'+Date.now().toString(36)), uid=f.dataset.uid;
    const list=rosterList().slice(); const i=list.findIndex(p=>p.id===id);
    const person=normPerson(Object.assign({},i>=0?list[i]:{},v,{id}));
    if(i>=0) list[i]=person; else list.push(person);
    const nextPerm={tasks:$('#pe-perm-tasks').checked,sched:$('#pe-perm-sched').checked}, curPerm=permOf(id);
    try{
      const jobs=[saveRoster(list)];
      if(!!curPerm.tasks!==nextPerm.tasks||!!curPerm.sched!==nextPerm.sched) jobs.push(savePerms(id,nextPerm));
      if(uid){
        const map=Object.assign({},S.links); map[uid]=id;
        const ever=Object.assign({},S.everLinked,{[uid]:id});
        const c=S.claims[uid]||{}, meta=Object.assign({},S.linkMeta,{[uid]:{dev:c.dev||'',at:Date.now()}});
        delete S.claims[uid];
        jobs.push(saveLinks(map,ever,meta).then(()=>DB.doc('claims/'+uid).set(Object.assign({},c,{approved:true,approvedAt:Date.now()}))));
      }
      U.sheet={type:'team'}; renderSheet(); render();
      await Promise.all(jobs);
      toast(uid?`${person.name} נוסף לצוות וקיבל גישה.`:`${person.name} נשמר.`);
    }catch(err){toast(errMsg(err));}
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&U.sheet){closeSheet();return;}
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('card')){e.preventDefault();e.target.click();}
});


/* ---------- Firebase ---------- */
/* Firebase JS SDK 12.19.0, bundled into fb.js so the app starts without reaching any CDN */
async function loadFirebase(cfg){
  if(!window.FBSDK) throw new Error('firebase bundle missing');
  const {A,Au,F}=window.FBSDK;
  const app=A.initializeApp(cfg);
  let auth; try{auth=Au.initializeAuth(app,{persistence:[Au.indexedDBLocalPersistence,Au.browserLocalPersistence]});}catch(e){auth=Au.getAuth(app);}
  let fs;
  try{fs=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()}),ignoreUndefinedProperties:true});}
  catch(e){fs=F.initializeFirestore(app,{ignoreUndefinedProperties:true});}
  return {
    db:fireAdapter(F,fs),
    onAuth:cb=>Au.onAuthStateChanged(auth,cb),
    signInAnon:()=>Au.signInAnonymously(auth),
    signInEmail:(e,p)=>Au.signInWithEmailAndPassword(auth,e,p),
    signOut:()=>Au.signOut(auth),
    /* a throwaway anonymous user in a separate app instance, used only by the admin's system check */
    probe:async()=>{
      const papp=A.initializeApp(cfg,'probe-'+Date.now());
      const pauth=Au.initializeAuth(papp,{persistence:Au.inMemoryPersistence});
      const cred=await Au.signInAnonymously(pauth);
      const pfs=F.initializeFirestore(papp,{ignoreUndefinedProperties:true});
      return {uid:cred.user.uid,db:fireAdapter(F,pfs),del:async()=>{try{await cred.user.delete();}catch(e){}try{await F.terminate(pfs);}catch(e){}try{await A.deleteApp(papp);}catch(e){}}};
    }
  };
}
/* the same small interface the app uses everywhere: doc(path), collection(path) with where/orderBy/limit, tx(fn) */
function fireAdapter(F,fs){
  const wrapDoc=s=>({id:s.id,exists:s.exists(),data:()=>s.data(),metadata:s.metadata});
  const wrapQ=s=>({docs:s.docs.map(wrapDoc),size:s.size,empty:s.empty});
  const fld=f=>f==='__id__'?F.documentId():f;
  function q(path,cons){
    const build=()=>F.query(F.collection(fs,path),...cons);
    return {
      where:(f,op,v)=>q(path,cons.concat([F.where(fld(f),op,v)])),
      orderBy:(f,dir)=>q(path,cons.concat([F.orderBy(fld(f),dir||'asc')])),
      limit:n=>q(path,cons.concat([F.limit(n)])),
      get:async()=>wrapQ(await F.getDocs(build())),
      onSnapshot:(next,err)=>F.onSnapshot(build(),s=>next(wrapQ(s)),e=>{if(err)err(e);}),
      doc:id=>docRef(path+'/'+(id||F.doc(F.collection(fs,path)).id))
    };
  }
  function docRef(path){
    const r=F.doc(fs,path);
    return {id:r.id,path,
      get:async()=>wrapDoc(await F.getDoc(r)),
      set:(d,o)=>o?F.setDoc(r,d,o):F.setDoc(r,d),
      update:d=>F.updateDoc(r,d),
      delete:()=>F.deleteDoc(r),
      onSnapshot:(next,err)=>F.onSnapshot(r,s=>next(wrapDoc(s)),e=>{if(err)err(e);})};
  }
  return {
    doc:docRef,
    collection:p=>q(p,[]),
    tx:fn=>F.runTransaction(fs,async tr=>fn({
      get:async p=>{const s=await tr.get(F.doc(fs,p));return s.exists()?s.data():null;},
      set:(p,d)=>{tr.set(F.doc(fs,p),d);},
      update:(p,d)=>{tr.update(F.doc(fs,p),d);},
      delete:p=>{tr.delete(F.doc(fs,p));}
    })),
    fieldDelete:()=>F.deleteField()
  };
}

/* ---------- service worker + phone notifications ---------- */
function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  if(NATIVE&&!CFG.nativeSW) return;
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
  navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type==='open'&&d.url&&d.url!=='/'){try{history.replaceState(null,'',d.url);}catch(x){}}});
}
const pushSupported=()=>!!CFG.push&&!NATIVE&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&!!CFG.vapidPublic;
function pushState(){
  if(window.__LOCAL===true) return window.__LOCAL_PUSH||'none';
  if(!CFG.push||NATIVE) return 'none';
  if(!pushSupported()) return isIOSDev()&&!isStandalone()?'install':'none';
  if(Notification.permission==='denied') return 'denied';
  if(Notification.permission==='granted'&&lsGet(LK('push'))==='1') return 'on';
  return 'off';
}
async function shortHash(str){
  const h=sha256(new TextEncoder().encode(str));
  return 's'+Array.from(h.slice(0,10)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function savePushSub(sub){
  const j=sub.toJSON(), h=await shortHash(j.endpoint);
  await DB.doc('push/'+ME.uid).set({admin:!!ME.owner,subs:{[h]:{endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,at:Date.now(),dev:devLabel()}},updatedAt:Date.now()},{merge:true});
  lsSet(LK('push'),'1'); lsSet(LK('push-h'),h);
}
async function getSub(){
  const reg=await navigator.serviceWorker.ready;
  return (await reg.pushManager.getSubscription())||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:unb64u(CFG.vapidPublic)});
}
async function enablePush(){
  if(!pushSupported()){U.sheet={type:'install'};renderSheet();return;}
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){toast(perm==='denied'?'ההתראות חסומות. אפשר לאשר אותן בהגדרות הטלפון, בהגדרות האפליקציה.':'ההתראות לא הופעלו.');render();return;}
    await savePushSub(await getSub());
    render(); if(U.sheet&&U.sheet.type==='me') renderSheet();
    toast('ההתראות הופעלו בטלפון הזה.');
  }catch(e){toast('לא הצלחתי להפעיל התראות בטלפון הזה.');}
}
/* keep this phone's subscription fresh: browsers rotate them now and then */
async function refreshPush(){
  if(!pushSupported()||Notification.permission!=='granted'||!DB||!ME.uid) return;
  try{await savePushSub(await getSub());}catch(e){}
}
async function disablePush(){
  try{
    const reg=await navigator.serviceWorker.ready, sub=await reg.pushManager.getSubscription();
    const h=lsGet(LK('push-h'));
    if(h) await DB.doc('push/'+ME.uid).set({subs:{[h]:DB.fieldDelete()}},{merge:true});
    if(sub) await sub.unsubscribe();
  }catch(e){}
  lsSet(LK('push'),null); renderSheet(); render(); toast('ההתראות כובו בטלפון הזה.');
}
function pushBanner(){
  if(U.pushLater||!CFG.push) return '';
  const st=pushState();
  if(st==='off') return `<div class="banner info pushb">${svg('bell')}<span>קבל התראות לטלפון על משימות חדשות ועל פרסום הסידור.</span><span class="pb-act"><button type="button" class="btn btn-primary btn-sm" data-act="push-on">הפעלה</button><button type="button" class="x sm" data-act="push-later" aria-label="לא עכשיו">${svg('x')}</button></span></div>`;
  if(st==='install') return `<div class="banner info pushb">${svg('bell')}<span>באייפון התראות מגיעות רק מהאפליקציה המותקנת במסך הבית.</span><span class="pb-act"><button type="button" class="btn btn-ghost btn-sm" data-act="show-install">איך מתקינים</button><button type="button" class="x sm" data-act="push-later" aria-label="לא עכשיו">${svg('x')}</button></span></div>`;
  return '';
}
function pushSection(){
  if(!CFG.push) return '';
  const st=pushState();
  const row=(t,s,btn)=>`<div class="mrow"><span>${svg('bell')}<span><b>${t}</b><small>${s}</small></span></span>${btn||''}</div>`;
  let body;
  if(st==='on') body=row('התראות לטלפון פעילות','משימות חדשות, ביצוע, חריגות ופרסום סידור','<button type="button" class="btn btn-ghost btn-sm" data-act="push-off">כיבוי</button>');
  else if(st==='off') body=row('התראות לטלפון כבויות','גם כשהאפליקציה סגורה','<button type="button" class="btn btn-primary btn-sm" data-act="push-on">הפעלה</button>');
  else if(st==='denied') body=row('התראות חסומות','אפשר לאשר אותן בהגדרות הטלפון, בהגדרות האפליקציה');
  else if(st==='install') body=row('התראות דורשות התקנה','באייפון התראות מגיעות רק מהאפליקציה המותקנת','<button type="button" class="btn btn-ghost btn-sm" data-act="show-install">איך</button>');
  else body=row('התראות לא נתמכות','הדפדפן הזה לא תומך בהתראות');
  return `<section class="rsec"><h4>התראות</h4>${body}</section>`;
}

/* ---------- admin: live check of the server rules ----------
   Creates a throwaway anonymous user, walks it from "unknown phone" to "investigator" to "manager" and checks that every
   allowed action works and every forbidden one is refused by the server. Everything it creates is removed afterwards. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runSystemCheck(){
  if(!ME.owner) return;
  if(!FB){U.sheet={type:'check',rows:[{label:'בדיקת מערכת זמינה רק באפליקציה המחוברת לשרת',ok:false}],running:false};renderSheet();return;}
  const st={type:'check',rows:[],running:true}; U.sheet=st; renderSheet();
  const add=(label,ok,detail)=>{st.rows.push({label,ok,detail});if(U.sheet===st)renderSheet();};
  const expect=async(label,want,fn)=>{
    try{await fn();add(label,want==='allow',want==='allow'?'':'הפעולה הותרה למרות שהייתה אמורה להיחסם');}
    catch(e){const denied=isDenied(e);add(label,want==='deny'&&denied,want==='deny'&&denied?'':((e&&e.code)||String((e&&e.message)||e)));}
  };
  const PID='__probe', ts=Date.now(), tkey='zprobe'+ts, wk='zprobe'+ts;
  let P=null, pnum=0;
  try{
    P=await FB.probe(); const pu=P.uid;
    add('משתמש בדיקה זמני נוצר',true);
    await expect('טלפון לא מאושר רואה את רשימת השמות','allow',()=>P.db.doc('pub/names').get());
    await expect('טלפון לא מאושר לא רואה את הצוות','deny',()=>P.db.doc('team/roster').get());
    await expect('טלפון לא מאושר לא רואה משימות','deny',()=>P.db.collection('tasks').limit(1).get());
    await expect('טלפון לא מאושר שולח בקשת הצטרפות','allow',()=>P.db.doc('claims/'+pu).set({person:PID,at:ts,test:true}));
    await expect('טלפון לא מאושר לא יכול לאשר את עצמו','deny',()=>P.db.doc('claims/'+pu).set({person:PID,at:ts,approved:true}));
    await expect('טלפון לא מאושר לא כותב משימות','deny',()=>P.db.doc('tasks/'+tkey).set({num:1,desc:'x'}));
    await expect('טלפון לא מאושר לא מצרף את עצמו לצוות','deny',()=>P.db.doc('team/links').set({map:{[pu]:PID}}));
    await DB.doc('team/links').update({['map.'+pu]:PID});
    await sleep(700);
    await expect('טלפון מאושר רואה את הצוות','allow',()=>P.db.doc('team/roster').get());
    await expect('טלפון מאושר רואה משימות','allow',()=>P.db.collection('tasks').limit(1).get());
    await expect('חוקר לא יוצר משימות','deny',()=>P.db.doc('tasks/'+tkey+'x').set({num:1,desc:'בדיקה',prio:'low',assignee:null,createdAt:Date.now(),createdBy:PID,status:'open',takenBy:null,takenAt:null,doneAt:null,test:true}));
    await DB.doc('tasks/'+tkey).set({num:0,desc:'בדיקת מערכת',prio:'low',assignee:PID,createdAt:Date.now(),createdBy:'admin',status:'open',takenBy:null,takenAt:null,doneAt:null,test:true});
    await expect('חוקר לא לוקח משימה בשם מישהו אחר','deny',()=>P.db.doc('tasks/'+tkey).update({status:'progress',takenBy:'u1',takenAt:Date.now()}));
    await expect('חוקר לוקח משימה','allow',()=>P.db.tx(async t=>{await t.get('tasks/'+tkey);t.update('tasks/'+tkey,{status:'progress',takenBy:PID,takenAt:Date.now()});}));
    await expect('אי אפשר לקחת משימה שכבר נלקחה','deny',()=>P.db.doc('tasks/'+tkey).update({status:'progress',takenBy:PID,takenAt:Date.now()+1}));
    await expect('חוקר מסמן בוצע','allow',()=>P.db.doc('tasks/'+tkey).update({status:'done',doneAt:Date.now()}));
    await expect('אי אפשר לשנות משימה שבוצעה','deny',()=>P.db.doc('tasks/'+tkey).update({desc:'שונה'}));
    await expect('חוקר לא משנה את הסידור','deny',()=>P.db.doc('sched/'+wk).set({test:true}));
    await expect('חוקר לא משנה הרשאות','deny',()=>P.db.doc('team/perms').set({managers:{[PID]:{tasks:true,sched:true}}}));
    await expect('חוקר לא קורא נתונים פרטיים של אחרים','deny',()=>P.db.doc(`data/users/${ME.uid}/auth`).get());
    await expect('חוקר שומר דיווח משלו','allow',()=>P.db.doc(`data/users/${pu}/r-test`).set({type:'test',at:ts}));
    await expect('חוקר שולח התראה לצוות','allow',()=>P.db.doc('outbox/'+tkey).set({to:[pu],title:'בדיקה',body:'',by:pu,at:Date.now(),test:true}));
    await DB.doc('team/perms').set({managers:{[PID]:{tasks:true,sched:true}}},{merge:true});
    await sleep(700);
    await expect('מנהל סידור שומר סידור','allow',()=>P.db.doc('sched/'+wk).set({test:true,savedAt:Date.now(),savedBy:PID}));
    await expect('מנהל משימות יוצר משימה','allow',()=>P.db.tx(async t=>{const c=await t.get('meta/counter');pnum=((c&&c.n)||1000)+1;t.set('meta/counter',{n:pnum});t.set('tasks/'+tkey+'m',{num:pnum,desc:'בדיקה',prio:'low',assignee:PID,createdAt:Date.now(),createdBy:PID,status:'open',takenBy:null,takenAt:null,doneAt:null,test:true});}));
    await expect('מנהל משימות לא מדלג במספור','deny',()=>P.db.tx(async t=>{const c=await t.get('meta/counter');const n=((c&&c.n)||1000)+5;t.set('meta/counter',{n});t.set('tasks/'+tkey+'n',{num:n,desc:'בדיקה',prio:'low',assignee:PID,createdAt:Date.now(),createdBy:PID,status:'open',takenBy:null,takenAt:null,doneAt:null,test:true});}));
  }catch(e){add('הבדיקה נעצרה באמצע',false,(e&&e.code)||String((e&&e.message)||e));}
  /* clean up everything the check created */
  const jobs=[`tasks/${tkey}`,`tasks/${tkey}m`,`tasks/${tkey}n`,`tasks/${tkey}x`,`sched/${wk}`,`outbox/${tkey}`].map(p=>DB.doc(p).delete().catch(()=>{}));
  if(P){
    jobs.push(DB.doc('claims/'+P.uid).delete().catch(()=>{}), DB.doc(`data/users/${P.uid}/r-test`).delete().catch(()=>{}),
      DB.doc('team/links').update({['map.'+P.uid]:DB.fieldDelete()}).catch(()=>{}));
  }
  jobs.push(DB.doc('team/perms').update({['managers.'+PID]:DB.fieldDelete()}).catch(()=>{}));
  if(pnum) jobs.push(DB.tx(async t=>{const c=await t.get('meta/counter');if(c&&c.n===pnum)t.set('meta/counter',{n:pnum-1});}).catch(()=>{}));
  await Promise.all(jobs);
  if(P) await P.del();
  st.running=false; st.done=true;
  if(U.sheet===st) renderSheet();
}
function checkSheet(){
  const st=U.sheet, bad=st.rows.filter(r=>!r.ok).length;
  const rows=st.rows.map(r=>`<li class="ck ${r.ok?'ok':'bad'}"><span class="ck-i">${svg(r.ok?'check':'x')}</span><span><b>${esc(r.label)}</b>${r.detail?`<small>${esc(r.detail)}</small>`:''}</span></li>`).join('');
  const sum=st.running?'<p class="sub">בודק מול השרת…</p>':bad?`<p class="err">${bad} בדיקות נכשלו. שלח צילום מסך של הרשימה.</p>`:`<p class="okline">${svg('check')}כל הבדיקות עברו. ההרשאות נאכפות בשרת.</p>`;
  return `<div class="grab"></div>
    <div class="phead"><h3 class="ptitle" id="sheet-title">בדיקת מערכת</h3><button type="button" class="x" data-act="close" aria-label="סגירה">${svg('x')}</button></div>
    ${sum}<ul class="cklist">${rows}</ul>`;
}

/* ---------- first run: bring the data over from the previous version ----------
   The roster, personal rules, this week's schedule and the open task travel inside seed.js, encrypted (AES-GCM, key from
   the transfer code through PBKDF2). The public code holds only the encrypted blob; the code itself was given to the admin. */
function importHtml(){
  return `<div class="gate"><h2>העברת הנתונים מהגרסה הקודמת</h2>
    <p>הצוות, הכללים האישיים, הסידור של השבוע והמשימות הפתוחות מחכים כאן מוצפנים. הקלד את קוד ההעברה שקיבלת.</p>
    <form id="import-form" novalidate>
      <div class="field"><label for="im-code">קוד העברה</label><input id="im-code" class="input" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX"></div>
      <p class="err" id="im-err" hidden></p>
      <button type="submit" class="btn btn-primary" id="im-submit">העברת הנתונים</button>
    </form>
    <button type="button" class="linkbtn" data-act="skip-import">להתחיל עם צוות ריק</button></div>`;
}
async function runImport(){
  const B=window.SEED_BOX, inp=$('#im-code'), er=$('#im-err'), bt=$('#im-submit');
  const code=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!code){er.textContent='הקלד את הקוד.';er.hidden=false;return;}
  bt.disabled=true; er.hidden=true; bt.textContent='פותח…';
  let docs=null;
  try{
    const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:unb64(B.salt),iterations:B.iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    docs=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(B.iv)},key,unb64(B.ct))));
  }catch(e){bt.disabled=false;bt.textContent='העברת הנתונים';er.textContent='הקוד לא נכון. בדוק אותו ונסה שוב.';er.hidden=false;return;}
  bt.textContent='מעביר…';
  try{
    const order=Object.keys(docs).sort((a,b)=>(a.startsWith('team/')?0:1)-(b.startsWith('team/')?0:1));
    for(const p of order) await withRetry(()=>DB.doc(p).set(docs[p]));
    toast('הנתונים הועברו. הצוות, הסידור והמשימות כאן.');
  }catch(e){bt.disabled=false;bt.textContent='העברת הנתונים';er.textContent=errMsg(e);er.hidden=false;}
}
/* ---------- live subscriptions ----------
   Every phone listens to its own documents and to the public names list. Whether it is a team member is decided by the
   server: if it may read team/links it is in, otherwise it sees the registration screen. Approval re-runs this. */
let baseSubs=[], memberSubs=[], reportSubs={}, authSubs={}, resubTimer=null;
const isDenied=e=>!!e&&(e.code==='permission-denied'||e.code==='invalid_argument');
function onSubErr(err){
  if(isDenied(err)&&S.member){clearTimeout(resubTimer);resubTimer=setTimeout(subscribeAll,1500);}
}
const off=list=>{list.forEach(f=>{try{f();}catch(e){}});list.length=0;};
function unsubMember(){
  off(memberSubs);
  [reportSubs,authSubs].forEach(o=>Object.keys(o).forEach(u=>{try{o[u]();}catch(e){}delete o[u];}));
}
function subscribeAll(){
  off(baseSubs); unsubMember();
  S.member=null; S.ready.links=false; S.ready.roster=false; S.ready.tasks=false; S.ready.sched=false;
  const b=x=>baseSubs.push(x);
  b(DB.doc(`data/users/${ME.uid}/state`).onSnapshot(d=>{S.lastSeen=d.exists?d.data().lastSeen:null;changed();},onSubErr));
  b(DB.doc(`data/users/${ME.uid}/auth`).onSnapshot(d=>{
    const v=d.exists?d.data():null;
    if(!(v&&v.hash)&&hasPN()) AUTH.unlocked=false;  /* the admin reset this login: set a new number */
    S.auth=v; S.ready.auth=true; changed(); setTimeout(autoBio,300);
  },onSubErr));
  b(DB.doc('pub/names').onSnapshot(d=>{S.pubNames=d.exists?d.data():{people:[],taken:[],missing:true};changed();},()=>{S.pubNames={people:[],taken:[],missing:true};changed();}));
  if(!ME.owner) b(DB.doc('claims/'+ME.uid).onSnapshot(d=>{
    const v=d.exists?d.data():null, was=S.claims[ME.uid];
    S.claims=v?{[ME.uid]:v}:{};
    if(v&&v.approved&&!S.member&&!(was&&was.approved)){clearTimeout(resubTimer);resubTimer=setTimeout(subscribeAll,400);}
    changed();
  },()=>{}));
  b(DB.doc('team/links').onSnapshot(d=>{
    const v=d.exists?d.data():{};
    S.links=Object.assign({},v.map||{}); S.everLinked=Object.assign({},v.ever||{},v.map||{}); S.linkMeta=Object.assign({},v.meta||{});
    const isIn=ME.owner||!!S.links[ME.uid];
    if(!isIn){S.member=false;S.ready.links=true;unsubMember();changed();return;}
    const was=S.member; S.member=true; S.ready.links=true;
    if(!was) subscribeMember();
    syncReportSubs(); changed();
  },err=>{
    if(!isDenied(err)) return;
    S.member=false; S.ready.links=true; S.links={}; unsubMember(); changed();
  }));
}
function subscribeMember(){
  unsubMember();
  const m=x=>memberSubs.push(x);
  m(DB.doc('team/roster').onSnapshot(d=>{const v=d.exists?d.data():null;S.rosterDoc=!!v;setRoster(v&&v.people);S.ready.roster=true;changed();},onSubErr));
  m(DB.doc('team/perms').onSnapshot(d=>{const v=d.exists?d.data():{};S.perms={managers:Object.assign({},v.managers||{})};S.ready.perms=true;changed();},onSubErr));
  const since=Date.now()-TASK_WINDOW; if(!S.loadedFrom||S.loadedFrom>since) S.loadedFrom=since;
  const toMap=s=>{const o={};s.docs.forEach(d=>{o[d.id]=d.data();});return o;};
  m(DB.collection('tasks').where('createdAt','>=',since).onSnapshot(s=>{S.taskDocs=toMap(s);S.ready.tasks=true;changed();},onSubErr));
  m(DB.collection('tasks').where('status','in',['open','progress']).onSnapshot(s=>{S.taskOpen=toMap(s);changed();},onSubErr));
  m(DB.collection('sched').where('__id__','>=',addDays(curWeek(),-7*12)).onSnapshot(s=>{S.schedDocs=toMap(s);S.ready.sched=true;changed();},onSubErr));
  if(ME.owner) m(DB.collection('claims').onSnapshot(s=>{const o={};s.docs.forEach(d=>{o[d.id]=d.data();});S.claims=o;changed();},onSubErr));
  syncReportSubs();
}
function syncReportSubs(){
  if(!DB||!S.member) return;
  const uids=ME.owner?Object.keys(Object.assign({},S.everLinked,S.links)):[ME.uid];
  const from='r-'+dkey(Date.now()-TASK_WINDOW);
  uids.forEach(u=>{
    if(!reportSubs[u]) try{reportSubs[u]=DB.collection('data/users/'+u).where('__id__','>=',from).where('__id__','<','r-~').onSnapshot(s=>{
      const fresh=s.docs.map(d=>d.data()).filter(x=>x&&x.type==='report');
      const keep=(S.reports[u]||[]).filter(x=>'r-'+x.key<from);
      S.reports[u]=keep.concat(fresh); changed();
    },onSubErr);}catch(e){}
    if(ME.owner&&S.links[u]&&!authSubs[u]) try{authSubs[u]=DB.doc(`data/users/${u}/auth`).onSnapshot(d=>{S.authOf[u]=d.exists?d.data():null;changed();},()=>{});}catch(e){}
  });
}
const _changed=changed;
changed=function(){_changed();if(ME.owner&&S.member)setTimeout(publishNames,0);};

/* ---------- boot ---------- */
let bootDone=false;
async function boot(){
  if(bootDone) return; bootDone=true;
  render();
  if(window.__LOCAL===true){
    DB=LocalDB();
    const u=window.__LOCAL_USER||{id:'local-owner',owner:true,name:'בודק'};
    ME.uid=u.id; ME.owner=!!u.owner; ME.name=u.name||'';
    restoreSession(); ME.phase='ready'; subscribeAll(); render(); return;
  }
  if(!CFG.firebase||!CFG.firebase.apiKey||!CFG.firebase.projectId){ME.phase='config';render();return;}
  registerSW();
  try{FB=await loadFirebase(CFG.firebase);}
  catch(e){ME.phase='offline';render();setTimeout(()=>location.reload(),15000);return;}
  DB=FB.db;
  let signingIn=false;
  FB.onAuth(async user=>{
    if(!user){
      if(signingIn) return; signingIn=true;
      try{await FB.signInAnon();}catch(e){ME.phase='offline';render();setTimeout(()=>location.reload(),15000);}
      signingIn=false; return;
    }
    if(ME.uid&&ME.uid!==user.uid){location.reload();return;}
    if(ME.uid===user.uid) return;
    ME.uid=user.uid;
    ME.owner=!!(user.email&&CFG.adminEmail&&user.email.toLowerCase()===String(CFG.adminEmail).toLowerCase());
    ME.name=ME.owner?(CFG.adminName||''):'';
    restoreSession();
    const fresh=+lsGet('inv-admin-fresh')||0;
    if(ME.owner&&Date.now()-fresh<180000){
      lsSet('inv-admin-fresh',null); AUTH.unlocked=true; lsSet(LK('active'),Date.now());
      if(lsGet('inv-admin-relogin')==='1'){lsSet('inv-admin-relogin',null);Object.assign(AUTH,{change:true,mode:'set1',pad:'',first:''});}
    }else if(!ME.owner&&lsGet('inv-admin-relogin')==='1') U.adminLogin=true;
    ME.phase='ready'; subscribeAll(); render();
    setTimeout(refreshPush,2000);
    try{if(navigator.clearAppBadge)navigator.clearAppBadge();}catch(e){}
  });
}
async function adminLogin(){
  const em=$('#ad-email').value.trim(), pw=$('#ad-pass').value, er=$('#ad-err'), bt=$('#ad-submit');
  if(!em||!pw){er.textContent='כתוב מייל וסיסמה.';er.hidden=false;return;}
  bt.disabled=true; er.hidden=true;
  try{
    lsSet('inv-admin-fresh',Date.now());
    await FB.signInEmail(em,pw);
  }catch(e){
    lsSet('inv-admin-fresh',null); bt.disabled=false;
    const c=e&&e.code||'';
    er.textContent=/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)?'המייל או הסיסמה שגויים.':/too-many-requests/.test(c)?'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.':/network/.test(c)?'אין חיבור לשרת.':'הכניסה נכשלה.';
    er.hidden=false;
  }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){try{if(navigator.clearAppBadge)navigator.clearAppBadge();}catch(e){}}});
setInterval(()=>{
  checkPush();
  if(ME.phase==='ready'&&U.tab==='feed'&&!U.sheet&&!inputBusy()){renderTabs();renderView();}
},20000);

/* ---------- inside the installed Android app ---------- */
if(NATIVE){
  try{
    window.Capacitor.nativeCallback('App','addListener',{eventName:'backButton'},()=>{
      if(U.sheet){closeSheet();return;}
      if(U.adminLogin){U.adminLogin=false;render();return;}
      if(U.newMe){U.newMe=false;render();return;}
      if(AUTH.mode&&(AUTH.pending||AUTH.change)){Object.assign(AUTH,{mode:null,pending:null,change:false,pad:'',first:'',err:''});render();return;}
      if(!gateHtml()&&U.tab!=='feed'){U.tab='feed';U.reportEdit=false;renderTabs();renderView();saveUI();window.scrollTo(0,0);return;}
      nat('App','minimizeApp').catch(()=>nat('App','exitApp').catch(()=>{}));
    });
  }catch(e){}
  document.addEventListener('pause',()=>{touchActive();});
  document.addEventListener('resume',()=>{idleCheck();if(isLocked()){AUTH.autoTried=false;setTimeout(autoBio,300);}});
}

boot();
})();
