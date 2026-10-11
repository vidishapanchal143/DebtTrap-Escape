"use client";

import CryptoLoanRiskAnalyzer from "@/components/CryptoLoanRiskAnalyzer";
import LoanSafetyTools from "@/components/LoanSafetyTools";
import LoanDocumentChecklist from "@/components/LoanDocumentChecklist";
import { useMemo, useRef, useState } from "react";
import {
  ShieldCheck, Sparkles, Search, ChevronDown, FileText, TriangleAlert,
  LockKeyhole, ArrowRight, UploadCloud, Calculator, BarChart3,
  LifeBuoy, Send, Menu, X, Bot, ScanText, BadgeCheck, CircleHelp,
  Copy, Fingerprint
} from "lucide-react";

type Message = { role: "agent" | "user"; text: string };
type HashingFile = "original" | "comparison" | null;

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number.isFinite(value) ? value : 0);

async function sha256File(file: File) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable. Open this page in a secure browser context and try again.");
  }
  const bytes = await file.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Home() {
  const [amount, setAmount] = useState("50000");
  const [rate, setRate] = useState("18");
  const [months, setMonths] = useState("12");
  const [fee, setFee] = useState("1500");
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "Hi! I’m DebtTrap Escape’s AI loan-awareness assistant. Ask me about EMIs, fees, repayment terms, or warning signs. I can explain information you share, but I do not verify lenders live or provide official financial or legal advice." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [active, setActive] = useState("Home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalHash, setOriginalHash] = useState("");
  const [comparisonFile, setComparisonFile] = useState<File | null>(null);
  const [comparisonHash, setComparisonHash] = useState("");
  const [hashing, setHashing] = useState<HashingFile>(null);
  const [vaultError, setVaultError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<HTMLInputElement>(null);
  const comparisonFileRef = useRef<HTMLInputElement>(null);

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

  async function sendMessage(message?: string) {
    const q = (message ?? chatInput).trim();
    if (!q || chatLoading) return;

    setMessages(prev => [...prev, { role: "user", text: q }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data: { reply?: string; error?: string; mode?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The assistant could not respond.");
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The assistant returned an empty response.");
      }

      setMessages(prev => [...prev, { role: "agent", text: data.reply!.trim() }]);
    } catch (error) {
      const messageText = error instanceof Error
        ? error.message
        : "Connection failed. Please try again.";
      setMessages(prev => [...prev, {
        role: "agent",
        text: `Sorry, I couldn't get an AI response. ${messageText} If this keeps happening, check that the development server is running and the Gemini server settings are configured.`,
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  const nav = ["Home", "Analyze", "Evidence", "Compare", "Learn", "Support"];

  async function selectOriginalFile(file: File | undefined) {
    if (!file) return;
    setOriginalFile(file);
    setOriginalHash("");
    setComparisonFile(null);
    setComparisonHash("");
    setVaultError("");
    setCopyMessage("");
    if (comparisonFileRef.current) comparisonFileRef.current.value = "";
    setHashing("original");
    try {
      setOriginalHash(await sha256File(file));
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : "Could not calculate the SHA-256 hash.");
    } finally {
      setHashing(null);
    }
  }

  async function selectComparisonFile(file: File | undefined) {
    if (!file) return;
    setComparisonFile(file);
    setComparisonHash("");
    setVaultError("");
    setHashing("comparison");
    try {
      setComparisonHash(await sha256File(file));
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : "Could not calculate the comparison hash.");
    } finally {
      setHashing(null);
    }
  }

  async function copyOriginalHash() {
    if (!originalHash) return;
    setCopyMessage("");
    setVaultError("");
    try {
      await navigator.clipboard.writeText(originalHash);
      setCopyMessage("SHA-256 hash copied to clipboard.");
    } catch {
      setVaultError("Could not access the clipboard. Check browser permissions and try again.");
    }
  }
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

      <section className="workspace wrap" id="crypto">
  <div className="section-heading">
    <div>
      <div className="eyebrow">WEB3 LOAN SAFETY</div>
      <h2>Understand your crypto loan risk.</h2>
    </div>
  </div>

  <CryptoLoanRiskAnalyzer />
</section>

<section className="workspace wrap" id="document-review">
  <div className="section-heading">
    <div>
      <div className="eyebrow">DOCUMENT SAFETY</div>
      <h2>Review your loan terms.</h2>
    </div>
  </div>
  <LoanDocumentChecklist />
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
            <div className="chat-head"><div className="agent-avatar"><Bot size={22}/></div><div><h3>Loan Safety Agent</h3><p><span className="live-dot"/> Gemini AI · loan-awareness support</p></div><span className="demo-pill">AI</span></div>
            <div className="chat-messages">{messages.map((m,i)=><div key={i} className={`chat-bubble ${m.role}`}>{m.role==="agent"&&<span className="bubble-avatar"><Sparkles size={14}/></span>}{m.text}</div>)}</div>
            <div className="quick-prompts">{["Explain my EMI","What about fees?","What should I verify?"].map(q=><button key={q} type="button" disabled={chatLoading} onClick={()=>void sendMessage(q)}>{q}</button>)}</div>
            <form className="chat-input" onSubmit={e=>{e.preventDefault();void sendMessage();}}><input aria-label="Message the AI loan assistant" placeholder="Ask about your loan…" value={chatInput} onChange={e=>setChatInput(e.target.value)} disabled={chatLoading} maxLength={2000}/><button aria-label="Send message" type="submit" disabled={chatLoading || !chatInput.trim()}><Send size={17}/></button></form>
            {chatLoading && <p className="chat-disclaimer" role="status">Gemini is thinking…</p>}
            <p className="chat-disclaimer">AI-generated educational guidance only. Live lender verification and document analysis are not connected. Do not share Aadhaar, PAN, OTPs, passwords, or other sensitive personal information.</p>
          </div>
        </div>
      </section>

      <section className="workspace wrap" id="loan-tools">
  <div className="section-heading">
    <div>
      <div className="eyebrow">LOAN SAFETY TOOLS</div>
      <h2>Compare offers. Spot warning signs.</h2>
    </div>
  </div>
  <LoanSafetyTools />
</section>

      <section className="workspace wrap" id="evidence">
        <div className="section-heading">
          <div><div className="eyebrow">LOCAL DOCUMENT VERIFICATION</div><h2>Crypto Evidence Vault</h2></div>
          <span className="secure-label"><LockKeyhole size={14}/> SHA-256 · processed in your browser</span>
        </div>
        <div className="panel vault-panel">
          <div className="panel-heading">
            <span className="mini-icon cyan"><Fingerprint size={20}/></span>
            <div><h3>Verify document integrity</h3><p>Calculate a SHA-256 fingerprint and compare it with another local file.</p></div>
          </div>
          <div className="vault-grid">
            <div className="vault-file-card">
              <div className="vault-card-title"><span>01</span><div><h3>Original document</h3><p>Select a file to calculate its hash.</p></div></div>
              <input ref={originalFileRef} className="visually-hidden" type="file" aria-label="Choose original document" onChange={event => void selectOriginalFile(event.target.files?.[0])}/>
              <button className="secondary-btn vault-select" type="button" onClick={() => { if (originalFileRef.current) originalFileRef.current.value = ""; originalFileRef.current?.click(); }} disabled={hashing === "original"}>
                <FileText size={17}/>{hashing === "original" ? "Hashing file…" : originalFile ? "Choose a different file" : "Choose original file"}
              </button>
              {originalFile ? (
                <div className="vault-file-details"><span>File</span><strong>{originalFile.name}</strong><span>Size</span><strong>{formatFileSize(originalFile.size)}</strong></div>
              ) : (
                <div className="vault-empty">No original document selected. Your file remains on this device.</div>
              )}
              <div className="hash-label">SHA-256</div>
              {originalHash ? (
                <>
                  <code className="hash-value">{originalHash}</code>
                  <button className="copy-hash" type="button" onClick={() => void copyOriginalHash()}><Copy size={15}/> Copy hash</button>
                </>
              ) : <div className="hash-placeholder">{hashing === "original" ? "Calculating SHA-256…" : "The 64-character hash will appear here."}</div>}
              {copyMessage && <p className="vault-success" role="status">{copyMessage}</p>}
            </div>

            <div className="vault-file-card">
              <div className="vault-card-title"><span>02</span><div><h3>Compare another file</h3><p>Choose a second file and compare its actual bytes.</p></div></div>
              <input ref={comparisonFileRef} className="visually-hidden" type="file" aria-label="Choose comparison document" disabled={!originalHash || hashing !== null} onChange={event => void selectComparisonFile(event.target.files?.[0])}/>
              <button className="secondary-btn vault-select" type="button" disabled={!originalHash || hashing !== null} onClick={() => { if (comparisonFileRef.current) comparisonFileRef.current.value = ""; comparisonFileRef.current?.click(); }}>
                <FileText size={17}/>{hashing === "comparison" ? "Hashing file…" : comparisonFile ? "Choose a different file" : "Choose comparison file"}
              </button>
              {comparisonFile ? (
                <>
                  <div className="vault-file-details"><span>File</span><strong>{comparisonFile.name}</strong><span>Size</span><strong>{formatFileSize(comparisonFile.size)}</strong></div>
                  <div className="hash-label">SHA-256</div>
                  {comparisonHash ? <code className="hash-value">{comparisonHash}</code> : <div className="hash-placeholder">Calculating SHA-256…</div>}
                  {comparisonHash && originalHash && (
                    <div className={comparisonHash === originalHash ? "comparison-result match" : "comparison-result mismatch"} role="status">
                      <strong>{comparisonHash === originalHash ? "MATCH" : "MISMATCH"}</strong>
                      <span>{comparisonHash === originalHash ? "The SHA-256 hash matches the original." : "The SHA-256 hashes differ."}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="vault-empty">{originalHash ? "No comparison file selected yet." : "Calculate the original file hash first."}</div>
              )}
            </div>
          </div>
          {vaultError && <p className="vault-error" role="alert">{vaultError}</p>}
          <div className="privacy-callout vault-privacy"><LockKeyhole size={16}/><span><strong>Private by design</strong> Files are read and hashed locally using the browser Web Crypto API. Document bytes are not uploaded, stored, or sent to a server.</span></div>
          <p className="fine-print vault-disclaimer"><CircleHelp size={14}/> Each hash is computed from the file&apos;s bytes; matching hashes indicate the contents match. This does not prove who created a document, when it was created, or whether it is authentic or trustworthy.</p>
        </div>
      </section>

      <section className="bottom-banner wrap" id="compare"><div className="banner-glow"/><div className="banner-icon"><ShieldCheck size={30}/></div><div><div className="eyebrow">BUILT AROUND CLARITY</div><h2>Understand first. Decide with confidence.</h2><p>DebtTrap Escape helps organize loan information; it does not replace qualified financial or legal advice.</p></div><button className="secondary-btn" onClick={()=>document.getElementById("analyze")?.scrollIntoView({behavior:"smooth"})}>Open workspace <ArrowRight size={16}/></button></section>
      <footer className="footer wrap"><a className="brand small-brand" href="#"><span className="brand-mark"><ShieldCheck size={21}/></span><span><strong>DebtTrap <b>Escape</b></strong><small>Know. Check. Compare. Stay Safe.</small></span></a><span>Prototype · Built for transparent loan decisions</span><span>Not financial or legal advice</span></footer>
    </main>
  );
}