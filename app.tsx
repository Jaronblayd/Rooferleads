import { useState, useRef } from "react";

const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming"
];

// ── Change this to your Vercel deployment URL after deploy ──
// e.g. "https://rooferleads.vercel.app"
// During local dev with `vercel dev` use ""  (empty = same origin)
const API_BASE = "https://rooferleads.vercel.app";

async function fetchRoofers(city, state) {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, state }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Server error");
  return data.results;
}

function exportCSV(data, city, state) {
  const headers = ["Business Name","Address","Phone","Website","Rating","Reviews","Specialty"];
  const rows = data.map(r => [r.name, r.address, r.phone, r.website ?? "", r.rating ?? "", r.reviews, r.specialty]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roofers-${city}-${state}.csv`.toLowerCase().replace(/\s+/g,"-");
  a.click();
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  :root{
    --sky:#0EA5E9;--sky-deep:#0284C7;--sky-pale:#E0F2FE;
    --slate:#1E293B;--slate-mid:#475569;--slate-light:#94A3B8;
    --chalk:#F8FAFC;--white:#FFFFFF;--border:#E2E8F0;
    --radius:16px;
    --shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
    --font-display:'Fraunces',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .fade-up  {animation:fadeUp .5s ease both}
  .fade-up-1{animation:fadeUp .5s .1s ease both}
  .fade-up-2{animation:fadeUp .5s .2s ease both}
  .fade-up-3{animation:fadeUp .5s .3s ease both}
  .card-enter{animation:fadeUp .4s ease both}
  .shimmer-card{
    background:linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%);
    background-size:200% 100%;animation:shimmer 1.5s infinite;
    border-radius:var(--radius);height:130px;
  }
  .result-card{
    background:var(--white);border-radius:var(--radius);padding:20px;
    box-shadow:var(--shadow-sm);border:1px solid var(--border);
    transition:box-shadow .2s,transform .2s;cursor:pointer;
  }
  .result-card:active{transform:scale(.98)}
  .btn-primary{
    background:var(--sky);color:white;border:none;border-radius:14px;
    font-family:var(--font-body);font-weight:600;font-size:17px;cursor:pointer;
    transition:background .15s,transform .1s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  .btn-primary:active{transform:scale(.97);background:var(--sky-deep)}
  .btn-primary:disabled{background:#CBD5E1;cursor:not-allowed}
  .btn-secondary{
    background:var(--white);color:var(--slate);border:1.5px solid var(--border);
    border-radius:12px;font-family:var(--font-body);font-weight:500;font-size:15px;
    cursor:pointer;transition:background .15s,transform .1s;
    display:flex;align-items:center;justify-content:center;gap:6px;
  }
  .btn-secondary:active{transform:scale(.97);background:var(--chalk)}
  .input-field{
    width:100%;border:1.5px solid var(--border);border-radius:14px;
    background:var(--white);color:var(--slate);font-family:var(--font-body);
    font-size:17px;padding:16px 18px;outline:none;
    transition:border-color .15s,box-shadow .15s;
    -webkit-appearance:none;appearance:none;
  }
  .input-field:focus{border-color:var(--sky);box-shadow:0 0 0 4px rgba(14,165,233,.12)}
  .input-field::placeholder{color:var(--slate-light)}
  .tag{
    display:inline-flex;align-items:center;background:var(--sky-pale);
    color:var(--sky-deep);font-size:12px;font-weight:600;
    padding:4px 10px;border-radius:20px;font-family:var(--font-body);white-space:nowrap;
  }
  .modal-overlay{
    position:fixed;inset:0;background:rgba(15,23,42,.6);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    display:flex;align-items:flex-end;justify-content:center;
    z-index:200;animation:fadeIn .2s ease;
  }
  .modal-sheet{
    background:var(--white);border-radius:28px 28px 0 0;
    padding:12px 24px 48px;width:100%;max-width:480px;
    animation:fadeUp .3s ease;max-height:92vh;overflow-y:auto;
  }
  .modal-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 28px}
  .contact-pill{
    display:flex;align-items:center;gap:12px;background:var(--chalk);
    border-radius:12px;padding:12px 14px;font-size:14px;color:var(--slate-mid);
    font-family:var(--font-body);text-decoration:none;border:none;cursor:pointer;
    width:100%;text-align:left;transition:background .15s;
  }
  .contact-pill:active{background:var(--sky-pale)}
  .plan-card{border:2px solid var(--border);border-radius:20px;padding:20px;cursor:pointer;transition:border-color .2s,background .2s}
  .plan-card.selected{border-color:var(--sky);background:#F0F9FF}
  .floating-bar{
    position:fixed;bottom:0;left:0;right:0;background:var(--white);
    border-top:1px solid var(--border);
    padding:12px 20px calc(12px + env(safe-area-inset-bottom));
    z-index:100;display:flex;gap:10px;box-shadow:0 -8px 24px rgba(0,0,0,.06);
  }
  .progress-bar{height:4px;background:var(--border);border-radius:2px;overflow:hidden}
  .progress-fill{height:100%;background:linear-gradient(90deg,var(--sky),#38BDF8);border-radius:2px;transition:width .5s cubic-bezier(.4,0,.2,1)}
  .error-box{background:#FFF1F2;border:1px solid #FECDD3;border-radius:14px;padding:16px 18px;font-family:var(--font-body);font-size:14px;color:#BE123C;margin-top:16px;line-height:1.5}
`;

function StarRow({ rating }) {
  if (!rating) return null;
  return (
    <div style={{display:"flex",gap:"2px"}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{fontSize:"13px",color:i<=Math.round(rating)?"#F59E0B":"#CBD5E1"}}>★</span>
      ))}
    </div>
  );
}

function IconBox({ bg, stroke, children }) {
  return (
    <div style={{width:"40px",height:"40px",background:bg,borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {children}
    </div>
  );
}

function ResultCard({ r, i, onTap }) {
  return (
    <div className="result-card card-enter" style={{animationDelay:`${i*.05}s`}} onClick={()=>onTap(r)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
        <div style={{flex:1,paddingRight:"12px"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"17px",fontWeight:600,color:"var(--slate)",marginBottom:"2px",lineHeight:1.3}}>{r.name}</div>
          <div style={{fontSize:"13px",color:"var(--slate-light)",fontFamily:"var(--font-body)"}}>{r.specialty}</div>
        </div>
        {r.rating && <span className="tag">{r.rating} ★</span>}
      </div>
      {r.rating && (
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"10px"}}>
          <StarRow rating={r.rating}/>
          <span style={{fontSize:"13px",color:"var(--slate-light)",fontFamily:"var(--font-body)"}}>{r.reviews.toLocaleString()} reviews</span>
        </div>
      )}
      <div style={{height:"1px",background:"var(--border)",marginBottom:"10px"}}/>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
        {r.phone && r.phone!=="—" && (
          <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--slate-light)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.12 2.2 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span style={{fontSize:"13px",color:"var(--slate-mid)",fontFamily:"var(--font-body)",fontWeight:500}}>{r.phone}</span>
          </div>
        )}
        {r.website && (
          <div style={{display:"flex",alignItems:"center",gap:"5px",overflow:"hidden"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--slate-light)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            <span style={{fontSize:"13px",color:"var(--sky)",fontFamily:"var(--font-body)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"180px"}}>{r.website.replace(/^https?:\/\//,"").replace(/\/$/,"")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailSheet({ r, onClose }) {
  if (!r) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{marginBottom:"20px"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"22px",fontWeight:600,color:"var(--slate)",marginBottom:"6px",lineHeight:1.2}}>{r.name}</div>
          {r.rating && (
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <StarRow rating={r.rating}/>
              <span style={{fontSize:"14px",color:"var(--slate-light)",fontFamily:"var(--font-body)"}}>{r.rating} · {r.reviews} reviews</span>
            </div>
          )}
          <span className="tag">{r.specialty}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"24px"}}>
          {r.phone && r.phone!=="—" && (
            <a href={`tel:${r.phone}`} className="contact-pill">
              <IconBox bg="#DCFCE7"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.12 2.2 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></IconBox>
              <div><div style={{fontWeight:600,color:"var(--slate)",fontSize:"15px"}}>{r.phone}</div><div style={{fontSize:"12px",color:"var(--slate-light)"}}>Tap to call</div></div>
            </a>
          )}
          {r.website && (
            <a href={r.website} target="_blank" rel="noreferrer" className="contact-pill">
              <IconBox bg="var(--sky-pale)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky-deep)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></IconBox>
              <div style={{overflow:"hidden"}}><div style={{fontWeight:600,color:"var(--slate)",fontSize:"15px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.website.replace(/^https?:\/\//,"").replace(/\/$/,"")}</div><div style={{fontSize:"12px",color:"var(--slate-light)"}}>Visit website</div></div>
            </a>
          )}
          {r.address && r.address!=="—" && (
            <div className="contact-pill" style={{cursor:"default"}}>
              <IconBox bg="#FEF3C7"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></IconBox>
              <div><div style={{fontWeight:600,color:"var(--slate)",fontSize:"15px"}}>{r.address}</div><div style={{fontSize:"12px",color:"var(--slate-light)"}}>Address</div></div>
            </div>
          )}
          {r.placeUrl && (
            <a href={r.placeUrl} target="_blank" rel="noreferrer" className="contact-pill">
              <IconBox bg="#F3F4F6"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></IconBox>
              <div><div style={{fontWeight:600,color:"var(--slate)",fontSize:"15px"}}>View on Google Maps</div><div style={{fontSize:"12px",color:"var(--slate-light)"}}>Open in browser</div></div>
            </a>
          )}
        </div>
        <button className="btn-primary" style={{width:"100%",padding:"18px"}} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function PaywallSheet({ onClose }) {
  const [selected, setSelected] = useState("monthly");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{width:"56px",height:"56px",background:"linear-gradient(135deg,var(--sky),#38BDF8)",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(14,165,233,.3)"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"24px",fontWeight:600,color:"var(--slate)",marginBottom:"8px"}}>Unlock Full Access</div>
          <div style={{fontFamily:"var(--font-body)",fontSize:"15px",color:"var(--slate-light)",lineHeight:1.5}}>Search any city, any state.<br/>Credits never expire.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
          {[
            {id:"monthly",label:"Monthly",price:"$35",unit:"/mo",sub:"Unlimited searches · Cancel anytime",badge:null},
            {id:"credits",label:"Credit Pack",price:"$35",unit:"",sub:"50 searches · Use whenever",badge:"NEVER EXPIRE"},
          ].map(p=>(
            <div key={p.id} className={`plan-card ${selected===p.id?"selected":""}`} onClick={()=>setSelected(p.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{fontFamily:"var(--font-body)",fontWeight:600,fontSize:"16px",color:"var(--slate)"}}>{p.label}</span>
                  {p.badge&&<span style={{background:"#FEF3C7",color:"#92400E",fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"20px",fontFamily:"var(--font-body)"}}>{p.badge}</span>}
                </div>
                <div style={{fontFamily:"var(--font-display)",fontSize:"24px",fontWeight:600,color:"var(--slate)"}}>{p.price}<span style={{fontSize:"14px",color:"var(--slate-light)",fontFamily:"var(--font-body)"}}>{p.unit}</span></div>
              </div>
              <div style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--slate-light)"}}>{p.sub}</div>
            </div>
          ))}
        </div>
        {["Phone, website & ratings included","Instant CSV export to your CRM","All 50 states covered"].map(f=>(
          <div key={f} style={{display:"flex",alignItems:"center",gap:"10px",fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--slate-mid)",marginBottom:"10px"}}>
            <div style={{width:"20px",height:"20px",background:"#DCFCE7",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            {f}
          </div>
        ))}
        <button className="btn-primary" style={{width:"100%",padding:"18px",fontSize:"17px",marginTop:"16px"}}>Get Started · $35</button>
        <div style={{textAlign:"center",marginTop:"12px",fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--slate-light)"}}>🔒 Secure checkout via Stripe</div>
      </div>
    </div>
  );
}

const STEPS = [
  {pct:12,label:"Connecting to Google Maps…"},
  {pct:28,label:"Sending search query…"},
  {pct:44,label:"Scanning roofing contractors…"},
  {pct:60,label:"Extracting contact info…"},
  {pct:75,label:"Verifying listings…"},
  {pct:88,label:"Building your list…"},
  {pct:95,label:"Almost there…"},
];

export default function RooferLeads() {
  const [city, setCity]           = useState("");
  const [state, setState]         = useState("Texas");
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState(null);
  const [progress, setProgress]   = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [credits, setCredits]     = useState(3);
  const [showPaywall, setShowPaywall]       = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [error, setError]         = useState(null);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  const startProgress = () => {
    let step = 0;
    setProgress(STEPS[0].pct); setProgLabel(STEPS[0].label);
    timerRef.current = setInterval(() => {
      step = Math.min(step+1, STEPS.length-1);
      setProgress(STEPS[step].pct);
      setProgLabel(STEPS[step].label);
    }, 7000);
  };

  const stopProgress = () => {
    clearInterval(timerRef.current);
    setProgress(100); setProgLabel("Complete!");
  };

  const handleSearch = async () => {
    if (!city.trim()) return;
    if (credits <= 0) { setShowPaywall(true); return; }
    inputRef.current?.blur();
    setLoading(true); setResults(null); setError(null);
    startProgress();
    try {
      const data = await fetchRoofers(city.trim(), state);
      stopProgress();
      await new Promise(r=>setTimeout(r,400));
      setResults(data);
      setCredits(c=>c-1);
    } catch(err) {
      stopProgress();
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results && !loading;

  return (
    <>
      <style>{styles}</style>
      <div style={{minHeight:"100vh",background:"var(--chalk)",paddingBottom:hasResults?"90px":"0"}}>

        {/* Nav */}
        <div style={{background:"rgba(248,250,252,.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"32px",height:"32px",background:"linear-gradient(135deg,var(--sky),#38BDF8)",borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(14,165,233,.35)"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
            </div>
            <span style={{fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:600,color:"var(--slate)",letterSpacing:"-0.01em"}}>RooferLeads</span>
          </div>
          <button className="btn-secondary" style={{padding:"8px 14px",fontSize:"14px"}} onClick={()=>setShowPaywall(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            {credits} left
          </button>
        </div>

        {/* Hero */}
        {!results && !loading && !error && (
          <div style={{padding:"48px 20px 0",maxWidth:"480px",margin:"0 auto"}}>
            <div className="fade-up" style={{marginBottom:"8px"}}>
              <span style={{fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,color:"var(--sky)",letterSpacing:"0.06em",textTransform:"uppercase"}}>Google Maps Intelligence</span>
            </div>
            <h1 className="fade-up-1" style={{fontFamily:"var(--font-display)",fontSize:"clamp(36px,10vw,48px)",fontWeight:300,color:"var(--slate)",lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:"16px"}}>
              Every roofer<br/>in any city,<br/><em style={{fontWeight:400,color:"var(--sky)"}}>instantly.</em>
            </h1>
            <p className="fade-up-2" style={{fontFamily:"var(--font-body)",fontSize:"16px",color:"var(--slate-light)",lineHeight:1.6,marginBottom:"36px"}}>
              Type a city and get every roofing contractor — phone, website, and ratings. Export to CSV in one tap.
            </p>
            <div className="fade-up-3" style={{display:"flex",background:"var(--white)",borderRadius:"16px",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",marginBottom:"40px"}}>
              {[["Live","Real Google Maps data"],["~45s","Avg scrape time"],["20+","Results per search"]].map(([n,l],i)=>(
                <div key={l} style={{flex:1,padding:"16px 12px",textAlign:"center",borderRight:i<2?"1px solid var(--border)":"none"}}>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"22px",fontWeight:600,color:"var(--slate)",marginBottom:"2px"}}>{n}</div>
                  <div style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--slate-light)"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{padding:hasResults||loading||error?"20px 20px 0":"0 20px 40px",maxWidth:"480px",margin:"0 auto"}}>
          {(hasResults||loading||error) && (
            <div style={{fontFamily:"var(--font-display)",fontSize:"20px",fontWeight:600,color:"var(--slate)",marginBottom:"16px"}}>
              {loading?"Searching…":error?"Search failed":`Roofers in ${city}, ${state}`}
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div>
              <label style={{fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,color:"var(--slate-mid)",display:"block",marginBottom:"8px"}}>City</label>
              <input ref={inputRef} className="input-field" value={city} onChange={e=>setCity(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="e.g. Dallas" autoComplete="off"/>
            </div>
            <div>
              <label style={{fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,color:"var(--slate-mid)",display:"block",marginBottom:"8px"}}>State</label>
              <div style={{position:"relative"}}>
                <select className="input-field" value={state} onChange={e=>setState(e.target.value)} style={{paddingRight:"44px"}}>
                  {STATES.map(s=><option key={s}>{s}</option>)}
                </select>
                <svg style={{position:"absolute",right:"18px",top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--slate-light)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            <button className="btn-primary" style={{padding:"18px",marginTop:"4px"}} onClick={handleSearch} disabled={loading||!city.trim()}>
              {loading
                ? <><svg style={{animation:"spin .8s linear infinite"}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>Searching…</>
                : <>Find Roofers<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></>
              }
            </button>
          </div>

          {loading && (
            <div style={{marginTop:"20px"}}>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
              <div style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--slate-light)",marginTop:"8px"}}>{progLabel}</div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginTop:"20px"}}>
                {[0,1,2].map(i=><div key={i} className="shimmer-card" style={{animationDelay:`${i*.15}s`}}/>)}
              </div>
            </div>
          )}

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
              <div style={{marginTop:"8px",color:"#9F1239",fontSize:"13px"}}>Make sure your Vercel function is deployed and <code>APIFY_TOKEN</code> is set in your environment variables.</div>
            </div>
          )}
        </div>

        {/* Results */}
        {hasResults && (
          <div style={{padding:"16px 20px",maxWidth:"480px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"10px"}}>
            <div style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--slate-light)",marginBottom:"4px"}}>
              {results.length} contractors found · Tap any card for details
            </div>
            {results.length===0 && (
              <div style={{textAlign:"center",padding:"48px 20px",fontFamily:"var(--font-body)",color:"var(--slate-light)"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>🔍</div>
                <div style={{fontSize:"16px",fontWeight:500,color:"var(--slate)",marginBottom:"8px"}}>No results found</div>
                <div style={{fontSize:"14px"}}>Try a different city or check the spelling.</div>
              </div>
            )}
            {results.map((r,i)=><ResultCard key={i} r={r} i={i} onTap={setSelectedResult}/>)}
          </div>
        )}

        {/* Floating bar */}
        {hasResults && results.length>0 && (
          <div className="floating-bar">
            <button className="btn-secondary" style={{flex:1,padding:"14px"}} onClick={()=>{setResults(null);setCity("")}}>← New</button>
            <button className="btn-primary" style={{flex:2,padding:"14px",fontSize:"15px"}} onClick={()=>exportCSV(results,city,state)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export {results.length} Leads
            </button>
          </div>
        )}
      </div>

      {selectedResult && <DetailSheet r={selectedResult} onClose={()=>setSelectedResult(null)}/>}
      {showPaywall && <PaywallSheet onClose={()=>setShowPaywall(false)}/>}
    </>
  );
}
