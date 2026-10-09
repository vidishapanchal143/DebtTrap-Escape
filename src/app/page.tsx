 "use client";

import { useMemo, useRef, useState } from "react";
import {
  ShieldCheck, Sparkles, Search, Sun, ChevronDown, FileText, TriangleAlert,
  Scale, LockKeyhole, ArrowRight, UploadCloud, Calculator, BarChart3, GraduationCap,
  LifeBuoy, Mic, Send, CheckCircle2, Menu, X, Bot, ScanText, BadgeCheck, CircleHelp
} from "lucide-react";

type Message = { role: "agent" | "user"; text: string };

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number.isFinite(value) ? value : 0);

export default function Home() {
  const [amount, setAmount] = useState("50000");
  const [rate, setRate] = useState("18");
  const [months, setMonths] = useState("12");
  const [fee, setFee] = useState("1500");
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "Hi! I can help you understand loan terms, estimate repayments, and organize questions to verify. This starter uses demo chat replies; document AI and official-source checks are not connected yet." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [active, setActive] = useState("Home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const calc = useMemo(() => {
    const principal = Math.max(0, Number(amount) || 0);
    const annualRate = Math.max(0, Number(rate) || 0);
    const term = Math.max(1, Number(months) || 1);
    const upfrontFee = Math.max(0, Number(fee) || 0);
    const r = annualRate / 1200;
    const emi = r === 0 ? principal / term : principal * r * Math.pow(1 + r, term) / (Math.pow(1 + r, term) - 1);
    const total = emi * term;
    return { principal, annualRate, term, upfrontFee, net: Math.max(0, principal - upfrontFee), emi, total, interest: Math.max(0, total - principal), outflow: total + upfrontFee };
  }, [amount, rate, months, fee]);

  function sendMessage() {
    const q = chatInput.trim();
    if (!q) return;
    const reply = /emi|installment|monthly|repay/i.test(q)
      ? `Using your current inputs, the estimated monthly instalment is ${money(calc.emi)} for ${calc.term} months. This is an estimate; confirm lender fees, dates, and the actual schedule.`
      : /fee|charge|received|deduct/i.test(q)
      ? `If the ${money(calc.upfrontFee)} fee is deducted from the principal, estimated cash received is ${money(calc.net)}. Confirm whether the fee is upfront, financed, or charged separately.`
      : "I can help review loan terms, but this demo has no connected document AI or live lender database yet. Try asking about EMI, repayment, fees, or the amount received.";
    setMessages(prev => [...prev, { role: "user", text: q }, { role: "agent", text: reply }]);
    setChatInput("");
  }

  const nav = ["Home", "Analyze", "Compare", "Learn", "Support"];
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setActive("Home")}>
          <span className="brand-mark"><ShieldCheck size={27} /></span>
          <span><strong>DebtTrap <b>Escape</b></strong><small>Know. Check. Compare. Stay Safe.</small></span>
        </a>
        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          {nav.map(item => <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => { setActive(item); setMobileMenu(false); document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" }); }}>{item}</button>)}
        </nav>
        <div className="top-actions"><button className="icon-btn" aria-label="Search" onClick={() => { setActive("Analyze"); document.getElementById("analyze")?.scrollIntoView({behavior:"smooth"}); }}><Search size={18}/></button><span className="lang-pill">EN <ChevronDown size={14}/></span><button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X/> : <Menu/>}</button></div>
      </header>

      <section className="hero wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot"/> YOUR PERSONAL LOAN SAFETY ASSISTANT</div>
          <h1>Break free from<br/><span>loan traps</span> with clarity.</h1>
          <p className="hero-sub">Understand the real cost of a loan, inspect confusing terms, and organize evidence before you make a decision.</p>
          <div className="hero-chips">
            <span><ScanText size={17}/> Document review</span><span><TriangleAlert size={17}/> Cost warning signs</span><span><ShieldCheck size={17}/> Evidence-first</span>
          </div>
          <div className="hero-buttons"><button className="primary-btn" onClick={() => {setActive("Analyze"); document.getElementById("analyze")?.scrollIntoView({behavior:"smooth"});}}>Analyze my loan <ArrowRight size={18}/></button><button className="secondary-btn" onClick={() => document.getElementById("how")?.scrollIntoView({behavior:"smooth"})}><span className="play">▶</span> See how it works</button></div>
          <div className="trust-note"><LockKeyhole size={14}/> Privacy-first design <i/> No automatic scam verdicts <i/> Estimates clearly labelled</div>
        </div>
        <div className="hero-visual" aria-label="3D-inspired AI loan safety visual">
          <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
          <div className="holo holo-doc"><FileText size={28}/><span>LOAN FILE</span><div className="fake-lines"/><div className="fake-lines short"/><div className="fake-lines"/></div>
          <div className="agent-orb"><div className="orb-core"><Bot size={94} strokeWidth={1.15}/><Sparkles className="orb-spark" size={25}/></div><div className="orb-ring"/></div>
          <div className="floating-card score-card"><small>DEMO STATUS</small><div className="score-ring"><span>—</span></div><strong>Awaiting analysis</strong><em>No score generated</em></div>
          <div className="floating-card charge-card"><TriangleAlert size={19}/><div><strong>Cost clarity</strong><small>Review fees & repayments</small></div></div>
          <div className="visual-caption"><span className="live-dot"/> Your AI loan companion <span className="caption-tag">PREVIEW</span></div>
        </div>
      </section>

      <section className="feature-strip wrap" id="how">
        <article className="feature-card"><div className="feature-icon blue"><Calculator/></div><div><h3>Know your real cost</h3><p>Estimate monthly payments and total outflow.</p></div><ArrowRight size={17}/></article>
        <article className="feature-card"><div className="feature-icon purple"><ScanText/></div><div><h3>Review loan terms</h3><p>Prepare documents for structured analysis.</p></div><ArrowRight size={17}/></article>
        <article className="feature-card"><div className="feature-icon teal"><BadgeCheck/></div><div><h3>Evidence, not guesses</h3><p>Separate confirmed facts from unknowns.</p></div><ArrowRight size={17}/></article>
        <article className="feature-card"><div className="feature-icon coral"><LifeBuoy/></div><div><h3>Find next steps</h3><p>Organize questions and records for help.</p></div><ArrowRight size={17}/></article>
      </section>

      <section className="workspace wrap" id="analyze">
        <div className="section-heading"><div><div className="eyebrow">LOAN WORKSPACE</div><h2>Make the numbers make sense.</h2></div><span className="secure-label"><LockKeyhole size={14}/> Local demo · no file upload</span></div>
        <div className="workspace-grid">
          <div className="panel upload-panel">
            <div className="panel-heading"><span className="mini-icon"><UploadCloud size={20}/></span><div><h3>Prepare your loan document</h3><p>PDF, image, or screenshot · local selection only</p></div></div>
            <button className="dropzone" onClick={() => fileRef.current?.click()}><span className="upload-3d"><UploadCloud size={37}/></span><strong>{fileName || "Choose a loan document"}</strong><span>{fileName ? "Selected locally — not uploaded" : "Click to select a file from your device"}</span><small>Document AI connection is the next build step</small></button>
            <input ref={fileRef} type="file" accept=".pdf,image/*" hidden onChange={e => setFileName(e.target.files?.[0]?.name || "")}/>
            <div className="privacy-callout"><LockKeyhole size={16}/><span><strong>Privacy note</strong> This starter only selects a file in your browser. It does not send it to a server.</span></div>
          </div>

          <div className="panel calc-panel">
            <div className="panel-heading"><span className="mini-icon cyan"><Calculator size={20}/></span><div><h3>Loan cost calculator</h3><p>Change inputs to update estimates</p></div></div>
            <div className="form-grid">
              <label>Loan principal (₹)<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
              <label>Annual interest (%)<input type="number" min="0" max="300" step="0.1" value={rate} onChange={e=>setRate(e.target.value)}/></label>
              <label>Tenure (months)<input type="number" min="1" max="600" value={months} onChange={e=>setMonths(e.target.value)}/></label>
              <label>Upfront fee (₹)<input type="number" min="0" value={fee} onChange={e=>setFee(e.target.value)}/></label>
            </div>
            <div className="result-main"><div><span>Estimated monthly EMI</span><strong>{money(calc.emi)}</strong></div><div className="result-chip"><BarChart3 size={16}/><span>ESTIMATE</span></div></div>
            <div className="result-rows"><div><span>Estimated net amount if fee is deducted</span><strong>{money(calc.net)}</strong></div><div><span>Total of estimated instalments</span><strong>{money(calc.total)}</strong></div><div><span>Interest above principal</span><strong>{money(calc.interest)}</strong></div><div><span>Instalments + upfront fee</span><strong>{money(calc.outflow)}</strong></div></div>
            <p className="fine-print"><CircleHelp size={14}/> EMI estimate assumes monthly reducing-balance interest and equal instalments. It excludes any fees not entered here and is not a lender quote.</p>
          </div>

          <div className="panel report-panel">
            <div className="panel-heading"><span className="mini-icon orange"><TriangleAlert size={20}/></span><div><h3>Review checklist</h3><p>Items to verify before trusting an offer</p></div></div>
            {["Compare sanctioned amount with net amount received","Check every fee and the repayment schedule","Confirm lender and app relationship using official sources","Keep original agreement, receipts and messages"].map((item,i)=><div className="check-row" key={item}><span className="check-number">0{i+1}</span><span>{item}</span><span className="unknown-pill">Not checked</span></div>)}
            <div className="report-warning"><TriangleAlert size={17}/><span><strong>No risk verdict yet.</strong> This checklist has not verified a lender or your document.</span></div>
          </div>

          <div className="panel chat-panel" id="support">
            <div className="chat-head"><div className="agent-avatar"><Bot size={22}/></div><div><h3>Loan Safety Agent</h3><p><span className="live-dot"/> Demo assistant · rules-based replies</p></div><span className="demo-pill">DEMO</span></div>
            <div className="chat-messages">{messages.map((m,i)=><div key={i} className={`chat-bubble ${m.role}`}>{m.role==="agent"&&<span className="bubble-avatar"><Sparkles size={14}/></span>}{m.text}</div>)}</div>
            <div className="quick-prompts">{["Explain my EMI","What about fees?","What should I verify?"].map(q=><button key={q} onClick={()=>{setChatInput(q);}}>{q}</button>)}</div>
            <form className="chat-input" onSubmit={e=>{e.preventDefault();sendMessage();}}><input aria-label="Message the demo assistant" placeholder="Ask about your loan estimate…" value={chatInput} onChange={e=>setChatInput(e.target.value)}/><button aria-label="Send message" type="submit"><Send size={17}/></button></form>
            <p className="chat-disclaimer">Demo responses only. Gemini and live lender verification are not connected yet.</p>
          </div>
        </div>
      </section>

      <section className="bottom-banner wrap" id="compare"><div className="banner-glow"/><div className="banner-icon"><ShieldCheck size={30}/></div><div><div className="eyebrow">BUILT AROUND CLARITY</div><h2>Understand first. Decide with confidence.</h2><p>DebtTrap Escape helps organize loan information; it does not replace qualified financial or legal advice.</p></div><button className="secondary-btn" onClick={()=>document.getElementById("analyze")?.scrollIntoView({behavior:"smooth"})}>Open workspace <ArrowRight size={16}/></button></section>
      <footer className="footer wrap"><a className="brand small-brand" href="#"><span className="brand-mark"><ShieldCheck size={21}/></span><span><strong>DebtTrap <b>Escape</b></strong><small>Know. Check. Compare. Stay Safe.</small></span></a><span>Prototype · Built for transparent loan decisions</span><span>Not financial or legal advice</span></footer>
    </main>
  );
}