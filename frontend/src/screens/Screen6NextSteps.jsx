import React, { useState } from 'react';
import { ArrowRight, AudioLines, CircleHelp, CircleStop, ExternalLink, FileSearch, Handshake, Scale, ShieldCheck } from 'lucide-react';
import { speak, isSpeechSupported } from '../utils/speech';

export default function Screen6NextSteps({ t, lang = 'en', onDecision }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const cards = [
    { number: '01', Icon: Scale, title: t.step6A, body: t.step6ADetail },
    { number: '02', Icon: FileSearch, title: t.step6B, body: t.step6BDetail, link: 'https://sachet.rbi.org.in', linkText: t.step6RBI },
    { number: '03', Icon: Handshake, title: t.step6C, body: t.step6CDetail },
  ];
  const readAloud = `${t.s6Title}. ${cards.map(card => `${card.title} ${card.body}`).join('. ')}`;

  return (
    <div className="fade-in next-steps-screen">
      <div className="screen-intro">
        <span className="screen-eyebrow"><ShieldCheck size={15} /> {t.nextStepsEyebrow || 'YOUR OPTIONS, CLEARLY'}</span>
        <h1 className="card-title">{t.s6Title}</h1>
        <p>{t.nextStepsIntro || 'Take a moment. You can compare, ask for the full terms, or choose to pause.'}</p>
      </div>
      <section className="next-steps-workspace" aria-label={t.s6Title}>
      <div className="next-steps-list">
        {cards.map(({ number, Icon, title, body, link, linkText }) => (
          <article className="next-action-card" key={number}>
            <span className="action-number">{number}</span>
            <span className="action-icon"><Icon size={19} /></span>
            <div className="action-copy"><h2>{title}</h2><p>{body}</p>{link ? <a className="action-button" href={link} target="_blank" rel="noopener noreferrer">{linkText}<ExternalLink size={14} /></a> : <button className={`action-button${selectedOption === number ? ' is-selected' : ''}`} type="button" aria-pressed={selectedOption === number} onClick={() => setSelectedOption(selectedOption === number ? null : number)}>{selectedOption === number ? (t.step6Selected || 'Added to my next steps') : (t.step6Choose || 'Choose this step')}</button>}</div>
          </article>
        ))}
      </div>
      {selectedOption && <p className="option-confirmation" role="status">{t.step6SelectionSaved || 'Good. Keep this option in mind as you decide.'}</p>}

      <section className="decision-panel">
        <div><span className="decision-kicker">{t.avoidTitle}</span><h2>{t.decisionPrompt || 'What feels right for you?'}</h2><p>{t.avoidNote}</p></div>
        <div className="decision-buttons">
          <button className="decision-button avoid-choice" onClick={() => onDecision(true)} data-sfx="advance" type="button"><span className="decision-check"><CircleStop size={17} aria-hidden="true" /></span><span>{t.avoidBtn}</span><ArrowRight size={16} /></button>
          <button className="decision-button continue-choice" onClick={() => onDecision(false)} data-sfx="advance" type="button"><span className="decision-neutral"><CircleHelp size={17} aria-hidden="true" /></span><span>{t.continueBtn}</span><ArrowRight size={16} /></button>
        </div>
      </section>
      <div className="official-resource-strip"><ShieldCheck size={18} /><p>{t.officialHelpText || 'If you are being threatened, you can contact India’s cybercrime helpline at 1930 or visit the official portal.'}</p><a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">{t.cyberPortal || 'Cybercrime portal'}<ExternalLink size={13} /></a></div>
      <div className="next-steps-footer">
        {isSpeechSupported() && <button className="btn btn-ghost voice-button" onClick={() => speak(readAloud, lang)} data-sfx="none" type="button"><AudioLines size={17} /> {t.speakExplanation}</button>}
        <p>{t.noActionNote || 'Your choice is only saved in this summary. Nothing is sent or applied automatically.'}</p>
      </div>
      </section>
    </div>
  );
}
