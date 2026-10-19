import React, { useState } from 'react';
import { ArrowRight, Check, Clipboard, Download, Heart, LockKeyhole, Share2, ShieldCheck, Trash2 } from 'lucide-react';
import { formatINR } from '../utils/loanMath';
import { deleteAllAnalyses, saveAnalysis } from '../utils/storage';

async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  const success = document.execCommand('copy');
  document.body.removeChild(el);
  if (!success) throw new Error('Copy failed');
}

export default function Screen8Summary({ t, result, savedItems, setSavedItems, onCheckAnother, lang, sampleExample = false }) {
  const [isSaved, setIsSaved] = useState(false);
  const [notice, setNotice] = useState('');
  if (!result) return null;
  const { received, repay, days, totalCost, costPercent, avoided = false } = result;
  const shareMessage = t.shareText.replace('{received}', formatINR(received)).replace('{repay}', formatINR(repay)).replace('{days}', days).replace('{extra}', formatINR(totalCost)).replace('{pct}', costPercent.toFixed(0));
  const extraWithoutSymbol = formatINR(totalCost).replace(/^₹\s?/, '');
  const outcome = avoided ? t.avoidedMsg.replace('{extra}', extraWithoutSymbol) : t.notAvoidedMsg.replace('{extra}', extraWithoutSymbol);

  const handleSave = () => {
    const saved = saveAnalysis({ received, repay, days, totalCost, costPercent, avoided, lang });
    setSavedItems(saved);
    setIsSaved(true);
    setNotice(t.savedConfirm);
  };
  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: t.s8Title, text: shareMessage });
      else { await copyText(shareMessage); setNotice(t.shareSuccess); }
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice(t.copyError || 'Could not share. Please try copying the summary.');
    }
  };
  const handleDelete = () => {
    if (window.confirm(t.deleteAllConfirm)) {
      deleteAllAnalyses();
      setSavedItems([]);
      setIsSaved(false);
      setNotice(t.deleteConfirm);
    }
  };

  return (
    <div className="fade-in summary-screen">
      <div className="screen-intro">
        <span className="screen-eyebrow"><ShieldCheck size={15} /> {t.summaryEyebrow || 'YOUR LOAN CHECK'}</span>
        <h1 className="card-title">{t.s8Title}</h1>
        <p>{t.summaryIntro || 'A simple record of what you checked and the choice you made.'}</p>
      </div>
      <section className="summary-workspace" aria-label={t.s8Title}>

      <section className={`summary-result-card${avoided ? ' has-avoided' : ' has-cost'}`}>
        <div className="summary-status-icon">{avoided ? <Check size={22} /> : <Heart size={21} />}</div>
        <div className="summary-result-copy"><span>{avoided ? (t.summaryDecisionAvoided || 'YOU CHOSE TO PAUSE') : (t.summaryDecisionContinue || 'YOUR CHECK IS COMPLETE')}</span><h2>{outcome}</h2></div>
        <div className="summary-cost-stamp"><small>{t.extraCost}</small><strong>{formatINR(totalCost)}</strong></div>
      </section>
      {sampleExample && <span className="sample-sticker review-sample">{t.sampleExample || 'Sample example'}</span>}

      <section className="summary-receipt" aria-label={t.summaryBreakdown || 'Loan summary'}>
        <div className="receipt-heading"><div><h2>{t.summaryBreakdown || 'The numbers you checked'}</h2><p>{t.summarySampleNote || 'Based on the details you entered'}</p></div><span className="receipt-lock"><LockKeyhole size={14} /> {t.localOnly || 'On this device'}</span></div>
        <div className="receipt-row"><span>{t.receive}</span><strong>{formatINR(received)}</strong></div>
        <div className="receipt-row"><span>{t.repay} · {t.inDays.replace('{days}', days)}</span><strong>{formatINR(repay)}</strong></div>
        <div className="receipt-row receipt-total"><span>{t.extraCost} · {costPercent.toFixed(0)}% {t.extraCostPct}</span><strong>{formatINR(totalCost)}</strong></div>
      </section>

      <div className="summary-actions">
        <button className={`btn ${isSaved ? 'btn-saved' : 'btn-primary'} btn-lg`} onClick={handleSave} data-sfx="complete" disabled={isSaved} type="button">{isSaved ? <Check size={17} /> : <Download size={17} />}{isSaved ? t.savedConfirm : t.saveLocally}</button>
        <button className="btn btn-share btn-lg" onClick={handleShare} type="button"><Share2 size={17} />{t.shareFamily}</button>
      </div>
      {notice && <p className="summary-notice" role="status"><Check size={15} />{notice}</p>}
      <p className="summary-privacy-note"><LockKeyhole size={14} /> {t.neverSent}</p>

      <div className="summary-bottom-actions"><button className="summary-reset" onClick={handleDelete} type="button"><Trash2 size={15} /> {t.deleteData}</button><button className="summary-another" onClick={onCheckAnother} data-sfx="advance" type="button">{t.checkAnother}<ArrowRight size={16} /></button></div>
      </section>
    </div>
  );
}
