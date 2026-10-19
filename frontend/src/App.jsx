import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { translations } from './translations';
import { getSaved } from './utils/storage';
import { calculateCost } from './utils/loanMath';
import { playSound } from './utils/audio';
import Screen1Welcome from './screens/Screen1Welcome';
import Screen2Enter from './screens/Screen2Enter';
import Screen3Review from './screens/Screen3Review';
import Screen4Result from './screens/Screen4Result';
import Screen5Signal from './screens/Screen5Signal';
import Screen6NextSteps from './screens/Screen6NextSteps';
import Screen7Harassment from './screens/Screen7Harassment';
import Screen8Summary from './screens/Screen8Summary';
import WelcomeAnimation from './components/WelcomeAnimation';

const SAMPLE_OFFER = { amountReceived: '5000', totalRepayment: '7400', tenureDays: '30', interest: '1800', fees: '600' };

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [lang, setLang] = useState('en');
  const [t, setT] = useState(translations.en);
  const [step, setStep] = useState(1);
  const [offer, setOffer] = useState({ amountReceived: '', totalRepayment: '', tenureDays: '', interest: '', fees: '' });
  const [imageFile, setImageFile] = useState(null);
  const [geminiStatus, setGeminiStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [savedItems, setSavedItems] = useState(getSaved());
  const [largerText, setLargerText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [soundPref, setSoundPref] = useState('on');

  const [sampleExample, setSampleExample] = useState(false);

  useEffect(() => {
    setT(translations[lang] || translations.en);
    document.documentElement.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.lg = largerText ? '1' : '0';
    document.documentElement.dataset.hc = highContrast ? '1' : '0';
  }, [largerText, highContrast]);
  const navigate = (nextStep) => {
    const resetScroll = () => {
      const content = document.querySelector('.main-content');
      if (content) content.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    resetScroll();
    setStep(nextStep);
    window.requestAnimationFrame(resetScroll);
  };
  const handleInterfaceClick = (event) => {
    const target = event.target.closest('button, a, summary, [role="button"]');
    if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
    const requestedCue = target.dataset.sfx;
    if (requestedCue === 'none') return;
    const cue = requestedCue || 'click';
    if (soundPref === 'off') return; // mute if user disabled sound
    playSound(cue);
  };
  const handleStart = () => navigate(2);
  const handleTryDemo = (sample = SAMPLE_OFFER) => {
    setOffer(sample);
    setSampleExample(true);
    setImageFile(null);
    setGeminiStatus(null);
    navigate(2);
  };

  const handleGeminiExtract = async (file) => {
    setSampleExample(false);
    setGeminiStatus('loading');
    try {
      const form = new FormData();
      form.append('image', file);
      const resp = await fetch('/api/gemini/extract', { method: 'POST', body: form });
      const data = await resp.json();
      if (data.success) {
        setOffer({
          amountReceived: data.extracted.amountReceived ?? '',
          totalRepayment: data.extracted.totalRepayment ?? '',
          tenureDays: data.extracted.tenureDays ?? '',
          interest: data.extracted.interest ?? '',
          fees: data.extracted.fees ?? '',
        });
        setGeminiStatus(null);
      } else setGeminiStatus('error:' + (data.message || 'Gemini could not read this image. Enter the values manually.'));
    } catch (error) {
      setGeminiStatus('error:' + (error.message || 'Could not connect. Enter the values manually.'));
    }
  };

  const handleNextFromReview = () => {
    setResult(calculateCost(offer));
    navigate(4);
  };
  const handleLoanDecision = (avoided) => {
    setResult(previous => ({ ...previous, avoided }));
    navigate(7);
  };
  const handleProceedToSummary = () => navigate(8);

  const goBack = () => navigate(Math.max(1, step - 1));
  const renderScreen = () => {
    switch (step) {
      case 1:
        return <Screen1Welcome t={t} lang={lang} setLang={setLang} largerText={largerText} setLargerText={setLargerText} highContrast={highContrast} setHighContrast={setHighContrast} soundPref={soundPref} setSoundPref={setSoundPref} onStart={handleStart} onTryDemo={handleTryDemo} savedItems={savedItems} setSavedItems={setSavedItems} introFinished={!showWelcome} />;
      case 2:
        return <Screen2Enter t={t} offer={offer} setOffer={setOffer} imageFile={imageFile} setImageFile={setImageFile} onNext={() => navigate(3)} onGeminiExtract={handleGeminiExtract} geminiStatus={geminiStatus} onSampleLoad={setSampleExample} sampleExample={sampleExample} />;
      case 3:
        return <Screen3Review t={t} offer={offer} setOffer={setOffer} onNext={handleNextFromReview} sampleExample={sampleExample} onOfferEdit={() => setSampleExample(false)} />;
      case 4:
        return <Screen4Result t={t} lang={lang} result={result} onNext={() => navigate(5)} sampleExample={sampleExample} />;
      case 5:
        return <Screen5Signal t={t} result={result} lang={lang} onNext={() => navigate(6)} onDecline={() => handleLoanDecision(true)} sampleExample={sampleExample} />;
      case 6:
        return <Screen6NextSteps t={t} lang={lang} onDecision={handleLoanDecision} />;
      case 7:
        return <Screen7Harassment t={t} lang={lang} onProceed={handleProceedToSummary} />;
      case 8:
        return <Screen8Summary t={t} result={result} savedItems={savedItems} setSavedItems={setSavedItems} onCheckAnother={() => { setOffer({ amountReceived: '', totalRepayment: '', tenureDays: '', interest: '', fees: '' }); setResult(null); setSampleExample(false); navigate(2); }} lang={lang} sampleExample={sampleExample} />;
      default:
        return null;
    }
  };

  return (
    <>
      {showWelcome && <WelcomeAnimation onFinish={() => setShowWelcome(false)} />}
      <div className={`app-shell ${showWelcome ? 'intro-active' : 'intro-complete'}`} onClickCapture={handleInterfaceClick}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-start">
            <div className="brand-lockup" aria-label="TrueCost">
              <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 120 120" focusable="false"><circle cx="52" cy="52" r="38" fill="#13296B" stroke="#6D93FF" strokeWidth="10" /><line x1="80" y1="80" x2="107" y2="107" stroke="#FFC72C" strokeWidth="12" strokeLinecap="round" /><path d="M34 40H54A5 5 0 0 1 54 50H34A5 5 0 0 1 34 40Z" fill="#BFD0FF" /><path d="M34 55H59V65H34A5 5 0 0 1 34 55Z" fill="#BFD0FF" /><path d="M61 55H70A5 5 0 0 1 70 65H61Z" fill="#FFC72C" /></svg></span>
              <span className="brand-copy"><strong><span>True</span><em>Cost</em></strong><small>{t.appTagline}</small></span>
            </div>
            {step > 1 && <button className="topbar-back" onClick={goBack} type="button" aria-label={t.back || 'Back'}><ArrowLeft size={18} /><span>{t.back || 'Back'}</span></button>}
          </div>
          {step > 1 && (
            <div className="flow-progress nav-progress" aria-label={t.screenOf.replace('{n}', step)}>
              <div className="flow-progress-heading"><span>{t.flowLabel || 'YOUR LOAN CHECK'}</span><strong>{step} / 8</strong></div>
              <div className="flow-progress-track" role="progressbar" aria-valuenow={step} aria-valuemin="1" aria-valuemax="8" aria-label={`${step} of 8`}>
                {Array.from({ length: 8 }, (_, index) => <span key={index} className={index + 1 <= step ? 'is-filled' : ''} />)}
              </div>
            </div>
          )}
          <div className="topbar-actions">
            <div className="global-preferences" aria-label={t.accessibilitySettingsLabel || 'Language and accessibility settings'}>
              <div className="global-languages" role="group" aria-label={t.chooseLanguage || 'Choose language'}>
                {[['hi', 'हिं'], ['gu', 'ગુ'], ['en', 'EN']].map(([code, label]) => <button key={code} className={`language-chip${lang === code ? ' is-active' : ''}`} onClick={() => setLang(code)} type="button" aria-pressed={lang === code} aria-label={code === 'en' ? 'English' : code === 'hi' ? 'Hindi' : 'Gujarati'}>{label}</button>)}
              </div>
              <button className={`accessibility-chip${largerText ? ' is-active' : ''}`} onClick={() => setLargerText(value => !value)} type="button" aria-pressed={largerText} aria-label={`${t.btnLargerText || 'Larger text'} (A+)`}>A+</button>
              <button className={`accessibility-chip contrast-chip${highContrast ? ' is-active' : ''}`} onClick={() => setHighContrast(value => !value)} type="button" aria-pressed={highContrast} aria-label={`${highContrast ? 'Turn off' : 'Turn on'} ${t.btnHighContrast || 'high contrast'}`}>{highContrast ? <Eye size={17} /> : <EyeOff size={17} />}<span className="contrast-label">HC</span></button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <main className={`main-content ${step === 1 ? 'main-welcome' : ''}`}>
          <div className="screen-stage" key={step}>{renderScreen()}</div>
          <footer className="app-footer"><span>{t.appFooterCaption || 'Made for clearer borrowing decisions'}</span><span><LockKeyhole size={15} /> {t.footerPrivacy || 'Your choices stay yours'}</span></footer>
        </main>
      </div>
      {step === 1 && <div className="mobile-sticky-cta"><button className="btn btn-primary btn-lg" onClick={handleStart} data-sfx="advance" type="button">{t.welcomeCta}<span aria-hidden="true">→</span></button></div>}
    </div>
    </>
  );
}
