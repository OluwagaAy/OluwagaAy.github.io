/* CV Tailor: student accounts (Supabase). Loaded after the main script. */
(function(){
"use strict";
const CFG = window.CVT_CONFIG || {};
const ON = !!(CFG.supabaseUrl && CFG.supabaseKey && !/PASTE_/.test(CFG.supabaseKey) && window.supabase);
const $ = id => document.getElementById(id);
const esc = s => String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const COHORTS = ["Cybersecurity November Cohort (2026)","Cybersecurity May 4th Cohort","Cybersecurity 16th March 2026 Cohort","Cybersecurity February Batch 2026","Cybersecurity November International Online","Cybersecurity October 6th Cohort","CYBERSECURITY JULY 7TH 2025 COHORT","CYBERSECURITY APRIL 28th 2025 COHORT","CYBERSECURITY MARCH 10TH 2025 COHORT","January CompTIA S+ Class","Cybersecurity (GRC) Online","Cybersecurity Online Cohort","Advanced Cybersecurity Class","MAPELEAD Cybersecurity Pioneer Set","Cloud/DevOps Engineering","Cloud/DevOps Engineering 2026","Tech Mentorship (WhatsApp community)","Other MAPELEAD class","I'm not a MAPELEAD student yet"];
const TRACKS = ["SOC / Cyber analyst","GRC / Compliance","IT Support / Helpdesk","Cloud / DevOps","Pentesting / Ethical hacking","Networking","Other"];

/* ---------- UI shell ---------- */
const css = document.createElement("style");
css.textContent = `
.acct{position:absolute;top:14px;right:max(16px,env(safe-area-inset-right,0px));display:flex;gap:8px;align-items:center}
.acct .btn{padding:8px 14px;font-size:14px;background:#fff;color:var(--brand)}
.acct .who{color:#fff;font-weight:600;font-size:14px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
header.top{position:relative}
@media (max-width:640px){header.top .wrap{padding-top:66px}}
.mback{position:fixed;inset:0;background:rgba(10,22,48,.55);display:grid;place-items:center;z-index:50;padding:16px}
.mbox{background:#fff;color:#14213d;border-radius:16px;max-width:440px;width:100%;max-height:92vh;overflow:auto;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.mbox h3{margin:0 0 4px;font-size:21px}
.mbox .x{float:right;border:0;background:none;font-size:22px;cursor:pointer;color:#5b6478}
.gbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;border:1px solid #d5dbe8;background:#fff;border-radius:10px;padding:11px;font:inherit;font-weight:600;cursor:pointer}
.sep{display:flex;align-items:center;gap:10px;color:#8a93a8;font-size:13px;margin:14px 0}.sep:before,.sep:after{content:"";flex:1;border-top:1px solid #e3e6ef}
.tabs2{display:flex;gap:6px;margin:12px 0}.tabs2 button{flex:1;border:1px solid #d5dbe8;background:#f6f7fb;border-radius:8px;padding:8px;font:inherit;font-weight:600;cursor:pointer}.tabs2 button.on{background:var(--brand);color:#fff;border-color:var(--brand)}
.msg{font-size:14px;margin-top:10px}.msg.err{color:#d93025}.msg.ok{color:#0f9d58}
.consent{display:flex;gap:8px;align-items:flex-start;font-weight:500;font-size:14px;margin-top:12px}
.consent input{margin-top:3px}
.pv{font-size:14px;line-height:1.5}.pv h4{margin:12px 0 4px}
.savecv{display:flex;gap:10px;align-items:center;margin-top:12px;font-weight:600;font-size:15px;background:#f6f9ff;border:1px solid #dbe5ff;border-radius:10px;padding:10px 12px}
.savecv .note{font-weight:400}
.gate{background:#fff8e6;border:1px solid #ffe2a3;border-radius:10px;padding:12px;margin-top:12px;font-size:15px}
.danger{background:#d93025!important}
`;
document.head.appendChild(css);

const bar = document.createElement("div"); bar.className="acct"; bar.id="acct";
document.querySelector("header.top").appendChild(bar);

function modal(html){ closeModal(); const m=document.createElement("div"); m.className="mback"; m.id="cvtModal"; m.innerHTML=`<div class="mbox" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m); m.addEventListener("click",e=>{ if(e.target===m||e.target.closest(".x")) closeModal(); }); return m; }
function closeModal(){ const m=$("cvtModal"); if(m) m.remove(); }

const PRIVACY = `<div class="pv"><h3>Privacy notice</h3><p class="note">CV Tailor is run by MAPELEAD (Coach AY). Plain words, no tricks.</p>
<h4>What we collect</h4><p>Your name, email, WhatsApp number, MAPELEAD class (if any) and career track, and which jobs you tailor your CV for. Your CV itself is stored <b>only if you switch on "Save my CV to my account"</b>. Otherwise it stays in your browser.</p>
<h4>Why</h4><p>To run your account (and confirm free access for MAPELEAD students), to keep your CV on all your devices if you choose, and to send you jobs that match your track.</p>
<h4>Who can see it</h4><p>Only you and the MAPELEAD team. Other students can never see your data. We never sell it.</p>
<h4>Your rights</h4><p>You can edit your details or delete your account and all your data at any time from <b>My account</b>. Questions: message Coach AY on WhatsApp.</p>
<p class="note">This follows the Nigeria Data Protection Act 2023.</p></div>`;
document.querySelector("footer").insertAdjacentHTML("beforeend",`<br><a href="#" id="pvLink">Privacy notice</a>`);
$("pvLink").onclick=e=>{ e.preventDefault(); modal(`<button class="x" aria-label="Close">×</button>`+PRIVACY); };

if(!ON){ return; } // accounts not configured yet: the tool works exactly as before

const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.CVT_SB = sb;
let USER=null, PROFILE=null, PENDING=null;

/* ---------- account bar ---------- */
function renderBar(){
  if(!USER){ bar.innerHTML=`<button class="btn" id="signInBtn">Sign in / Create account</button>`; $("signInBtn").onclick=()=>openAuth(); return; }
  const nm = (PROFILE&&PROFILE.full_name) || USER.email;
  bar.innerHTML=`<span class="who">Hi, ${esc(nm.split(" ")[0])}</span><button class="btn" id="acctBtn">My account</button>`;
  $("acctBtn").onclick=openAccount;
}

/* ---------- sign in / sign up ---------- */
function openAuth(reason){
  const m=modal(`<button class="x" aria-label="Close">×</button><h3>Your free CV Tailor account</h3>
  <p class="note">${reason||(window.CVT_MODE==="mapelead"?"Free for MAPELEAD students. Create your account early to keep free access.":"Free during the launch. Create your account to start tailoring your CV.")}</p>
  ${CFG.googleSignIn?`<button class="gbtn" id="gIn"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button><div class="sep">or with email</div>`:""}
  <div class="tabs2"><button class="on" data-m="up">Create account</button><button data-m="in">Sign in</button></div>
  <label for="aEmail">Email</label><input type="email" id="aEmail" autocomplete="email">
  <label for="aPass">Password (at least 8 characters)</label><input type="password" id="aPass" autocomplete="new-password">
  <div class="btns"><button class="btn" id="aGo" style="width:100%">Create my free account</button></div>
  <p class="note" style="margin-top:8px"><a href="#" id="aForgot">Forgot password?</a></p>
  <div class="msg" id="aMsg"></div>`);
  let mode="up";
  m.querySelectorAll(".tabs2 button").forEach(b=>b.onclick=()=>{ mode=b.dataset.m; m.querySelectorAll(".tabs2 button").forEach(x=>x.classList.toggle("on",x===b)); $("aGo").textContent= mode==="up"?"Create my free account":"Sign in"; $("aPass").autocomplete= mode==="up"?"new-password":"current-password"; });
  if($("gIn")) $("gIn").onclick=async()=>{ const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}}); if(error) say(error.message,true); };
  $("aGo").onclick=async()=>{
    const email=$("aEmail").value.trim(), password=$("aPass").value;
    if(!/^\S+@\S+\.\S+$/.test(email)) return say("Enter a valid email address.",true);
    if(password.length<8) return say("Use a password of at least 8 characters.",true);
    $("aGo").disabled=true; say("Please wait…");
    const r = mode==="up" ? await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}}) : await sb.auth.signInWithPassword({email,password});
    $("aGo").disabled=false;
    if(r.error) return say(friendly(r.error.message),true);
    if(mode==="up" && !r.data.session) return say("Almost done: check your email and tap the confirmation link, then come back and sign in.",false);
    closeModal();
  };
  $("aForgot").onclick=async e=>{ e.preventDefault(); const email=$("aEmail").value.trim(); if(!email) return say("Type your email above first.",true);
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname}); say(error?friendly(error.message):"If that email has an account, a reset link is on its way.",!!error); };
  function say(t,err){ const el=$("aMsg"); el.textContent=t; el.className="msg "+(err?"err":"ok"); }
}
function friendly(m){
  if(/invalid login/i.test(m)) return "Wrong email or password.";
  if(/already registered|already been registered/i.test(m)) return "This email already has an account. Tap 'Sign in' instead.";
  if(/email not confirmed/i.test(m)) return "Please confirm your email first (check your inbox), then sign in.";
  if(/rate limit/i.test(m)) return "Too many attempts. Please wait a few minutes and try again.";
  return m;
}

/* ---------- profile (first sign-in) ---------- */
function openProfile(first){
  const p=PROFILE||{};
  const m=modal(`${first?"":`<button class="x" aria-label="Close">×</button>`}<h3>${first?"Welcome! One last step":"My details"}</h3>
  <p class="note">${first?(window.CVT_MODE==="mapelead"?"Tell us who you are so we can confirm your free MAPELEAD access and send you jobs for your track.":"Tell us a little about you so we can send you jobs for your track."):"Update your details."}</p>
  <label for="pName">Full name</label><input type="text" id="pName" value="${esc(p.full_name||"")}" autocomplete="name">
  <label for="pPhone">WhatsApp number</label><input type="text" id="pPhone" value="${esc(p.phone||"")}" placeholder="+234…" autocomplete="tel">
  <label for="pCohort">${window.CVT_MODE==="mapelead"?"Your MAPELEAD class":"Are you a MAPELEAD student?"}</label><select id="pCohort"><option value="">Choose…</option>${(window.CVT_MODE==="mapelead"?COHORTS:[COHORTS[COHORTS.length-1],...COHORTS.slice(0,-1)]).map(c=>`<option ${(p.cohort===c||(!p.cohort&&window.CVT_MODE!=="mapelead"&&/not a MAPELEAD/i.test(c)))?"selected":""}>${esc(c)}</option>`).join("")}</select>
  <label for="pTrack">Which jobs are you going for?</label><select id="pTrack"><option value="">Choose…</option>${TRACKS.map(c=>`<option ${p.track===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
  ${first?`<label class="consent"><input type="checkbox" id="pOk"> <span>I agree to the <a href="#" id="pPv">privacy notice</a>: MAPELEAD can store these details to run my account and send me job updates.</span></label>`:""}
  <div class="btns"><button class="btn" id="pSave" style="width:100%">${first?"Finish and continue":"Save"}</button></div><div class="msg" id="pMsg"></div>`);
  if($("pPv")) $("pPv").onclick=e=>{ e.preventDefault(); alertBox(PRIVACY, ()=>openProfile(first)); };
  $("pSave").onclick=async()=>{
    const full_name=$("pName").value.trim(), phone=$("pPhone").value.trim(), cohort=$("pCohort").value, track=$("pTrack").value;
    const msg=t=>{ $("pMsg").textContent=t; $("pMsg").className="msg err"; };
    if(full_name.length<3) return msg("Please enter your full name.");
    if(!/^\+?[\d\s()-]{7,}$/.test(phone)) return msg("Please enter a valid WhatsApp number.");
    if(!cohort) return msg(window.CVT_MODE==="mapelead"?"Please choose your MAPELEAD class.":"Please choose an option.");
    if(first && !$("pOk").checked) return msg("Please tick the box to agree to the privacy notice.");
    const row={id:USER.id,full_name,phone,cohort,track,email:USER.email,is_mapelead_student:!/not a MAPELEAD/i.test(cohort),updated_at:new Date().toISOString()};
    if(first) row.consent_at=new Date().toISOString();
    const {data,error}=await sb.from("profiles").upsert(row).select().single();
    if(error) return msg("Couldn't save: "+error.message);
    PROFILE=data; closeModal(); renderBar(); runPending(); refreshCount();
  };
}
function alertBox(html,after){ const m=modal(html+`<div class="btns"><button class="btn" id="okB" style="width:100%">OK</button></div>`); $("okB").onclick=()=>{ closeModal(); if(after) after(); }; }

/* ---------- my account ---------- */
function openAccount(){
  const p=PROFILE||{};
  const m=modal(`<button class="x" aria-label="Close">×</button><h3>My account</h3>
  <p><b>${esc(p.full_name||"")}</b><br><span class="note">${esc(USER.email)} · ${esc(p.phone||"")}</span><br><span class="note">${esc(p.cohort||"")}${p.track?" · "+esc(p.track):""}</span></p>
  <div class="btns"><button class="btn ghost" id="mEdit">Edit my details</button><button class="btn ghost" id="mOut">Sign out</button></div>
  <hr style="border:0;border-top:1px solid #e3e6ef;margin:16px 0">
  <p class="note">Delete my account removes your details, your saved CV and your history from MAPELEAD for good.</p>
  <div class="btns"><button class="btn danger" id="mDel">Delete my account</button></div><div class="msg" id="mMsg"></div>`);
  $("mEdit").onclick=()=>openProfile(false);
  $("mOut").onclick=async()=>{ await sb.auth.signOut(); closeModal(); };
  $("mDel").onclick=()=>{
    $("mMsg").innerHTML=`<b>Are you sure?</b> This can't be undone. <div class="btns"><button class="btn danger" id="mDel2">Yes, delete everything</button><button class="btn ghost" id="mKeep">Keep my account</button></div>`; $("mMsg").className="msg";
    $("mKeep").onclick=()=>{ $("mMsg").innerHTML=""; };
    $("mDel2").onclick=async()=>{ const {error}=await sb.rpc("delete_my_account"); if(error){ $("mMsg").textContent="Couldn't delete: "+error.message; $("mMsg").className="msg err"; return; } await sb.auth.signOut(); try{localStorage.removeItem("cvt_fields")}catch(e){} closeModal(); alertBox("<h3>Account deleted</h3><p>Your details and saved CV have been removed.</p>"); };
  };
}

/* ---------- save my CV to my account ---------- */
$("fields").insertAdjacentHTML("beforeend",`<label class="savecv"><input type="checkbox" id="saveCloud"> <span>Save my CV to my account <span class="note">(so it's there on any phone or laptop)</span></span></label>`);
try{ $("saveCloud").checked = localStorage.getItem("cvt_cloud")==="1"; }catch(e){}
$("saveCloud").onchange=async()=>{
  const on=$("saveCloud").checked; try{ localStorage.setItem("cvt_cloud",on?"1":"0"); }catch(e){}
  if(!USER){ if(on){ $("saveCloud").checked=false; openAuth("Create your free account to save your CV."); } return; }
  if(on) await pushCV(); else await sb.from("saved_cvs").delete().eq("user_id",USER.id);
};
async function pushCV(){ if(!USER||!$("saveCloud").checked) return; const f=readFields(); if(!f.name) return; await sb.from("saved_cvs").upsert({user_id:USER.id,data:f,updated_at:new Date().toISOString()}); }
$("saveBtn").addEventListener("click",()=>{ pushCV(); });
async function pullCV(){
  const {data}=await sb.from("saved_cvs").select("data").eq("user_id",USER.id).maybeSingle();
  if(!data) return;
  $("saveCloud").checked=true; try{ localStorage.setItem("cvt_cloud","1"); }catch(e){}
  const local=readFields();
  if(!local.name){ const s=data.data; $("f_name").value=s.name||""; $("f_contact").value=s.contact||""; $("f_summary").value=s.summary||""; $("f_skills").value=(s.skills||[]).join(", "); $("f_certs").value=(s.certs||[]).join("\n"); $("f_exp").value=s.exp||""; $("f_proj").value=(s.proj||[]).join("\n"); $("f_edu").value=(s.edu||[]).join("\n"); $("fields").classList.remove("hidden"); $("parseMsg").innerHTML='<span class="ok">✔ Your saved CV is loaded from your account.</span>'; try{localStorage.setItem("cvt_fields",JSON.stringify(s))}catch(e){} }
}

/* ---------- gate: an account is needed to tailor ---------- */
$("tailorBtn").addEventListener("click",e=>{
  if(USER && PROFILE) return;
  e.stopImmediatePropagation(); e.preventDefault();
  PENDING=()=>$("tailorBtn").click();
  if(USER && !PROFILE) openProfile(true); else openAuth(window.CVT_MODE==="mapelead"?"Create your free account to tailor your CV. Free for MAPELEAD students. Sign up early to keep free access.":"Create your free account to tailor your CV. It takes 30 seconds and it's free during the launch.");
},true);
function runPending(){ if(PENDING && USER && PROFILE){ const f=PENDING; PENDING=null; setTimeout(f,50); } }
$("s2").insertAdjacentHTML("beforeend",`<div class="gate" id="gateNote"></div>`);
function gateTxt(){ const g=$("gateNote"); if(g) g.textContent = window.CVT_MODE==="mapelead" ? "🔐 You'll need a free account for this step. It's free for MAPELEAD students. Sign up early to keep free access." : "🔐 You'll need a free account for this step. It's free during the launch: watch the countdown at the top."; }
gateTxt(); document.addEventListener("cvt-mode",gateTxt);

/* ---------- live "people have joined" counter (totals only) ---------- */
const SHOW_FROM = 5;   // only show the counter once at least this many people have joined
let shownTotal = 0;
async function refreshCount(){
  try{
    const {data,error}=await sb.rpc("signup_count"); if(error||!data) return;
    const total=+data.total||0, mp=+data.mapelead||0, el=$("joined"); if(!el) return;
    if(total<SHOW_FROM){ el.hidden=true; return; }
    el.hidden=false;
    const from=shownTotal||Math.max(0,total-25), start=performance.now();
    const draw=n=>{ el.innerHTML=`<span class="live"></span><span><b>${n.toLocaleString()}</b> people have joined CV Tailor${mp?` · <b>${mp.toLocaleString()}</b> MAPELEAD students`:""}</span>`; };
    const step=t=>{ const k=Math.min(1,(t-start)/900); draw(Math.round(from+(total-from)*k)); if(k<1) requestAnimationFrame(step); };
    requestAnimationFrame(step); shownTotal=total;
  }catch(e){}
}
refreshCount(); setInterval(refreshCount, 60000);

/* ---------- usage log ---------- */
$("buildBtn").addEventListener("click",()=>{ setTimeout(()=>{ try{ if(!USER||typeof MATCH==="undefined"||!MATCH) return; const pct=parseInt($("scoreNum").textContent)||null; sb.from("tailor_events").insert({job_title:MATCH.job.title,company:MATCH.job.company||null,match_pct:pct,template:(typeof TPL!=="undefined"?TPL:null)}).then(()=>{}); }catch(e){} },100); });

/* ---------- session ---------- */
async function onUser(u){
  USER=u||null; PROFILE=null;
  if(USER){
    const {data}=await sb.from("profiles").select("*").eq("id",USER.id).maybeSingle(); PROFILE=data||null;
    $("gateNote").style.display="none";
    if(!PROFILE) openProfile(true); else runPending();
    pullCV();
  } else { $("gateNote").style.display=""; }
  renderBar();
}
sb.auth.onAuthStateChange((ev,session)=>{ if(ev==="INITIAL_SESSION"||ev==="SIGNED_IN"||ev==="SIGNED_OUT"||ev==="USER_UPDATED") onUser(session&&session.user); if(ev==="PASSWORD_RECOVERY") setNewPassword(); });
function setNewPassword(){
  const m=modal(`<h3>Set a new password</h3><label for="np">New password (at least 8 characters)</label><input type="password" id="np" autocomplete="new-password"><div class="btns"><button class="btn" id="npGo" style="width:100%">Save password</button></div><div class="msg" id="npMsg"></div>`);
  $("npGo").onclick=async()=>{ const p=$("np").value; if(p.length<8){ $("npMsg").textContent="At least 8 characters."; $("npMsg").className="msg err"; return; } const {error}=await sb.auth.updateUser({password:p}); $("npMsg").textContent=error?error.message:"Password updated."; $("npMsg").className="msg "+(error?"err":"ok"); if(!error) setTimeout(closeModal,1200); };
}
renderBar();
})();
