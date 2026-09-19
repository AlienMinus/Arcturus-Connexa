import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaAd, FaArrowLeft, FaCheckCircle, FaInfoCircle, FaMobileAlt, FaUniversalAccess, FaArrowRight } from 'react-icons/fa';
import './InfoPage.css';

const pageContent = {
  about: {
    icon: <FaInfoCircle />,
    eyebrow: 'Arcturus Connexa',
    title: 'Build your professional world in one place.',
    intro: 'Arcturus Connexa brings professional identity, meaningful connections, learning, hiring, and campus placement into one focused network.',
    sections: [
      ['Professional identity', 'Create a profile that reflects your experience, projects, education, interests, and ambitions.'],
      ['Useful connections', 'Find people, organizations, jobs, and learning opportunities that move your next chapter forward.'],
      ['Trusted opportunities', 'Use verified organizations, institutional badges, and placement tools to make better decisions.'],
    ],
  },
  accessibility: {
    icon: <FaUniversalAccess />,
    eyebrow: 'Inclusive by design',
    title: 'A more accessible professional network.',
    intro: 'We are building Arcturus so people can connect, learn, and find opportunities with fewer barriers.',
    sections: [
      ['Keyboard-friendly navigation', 'Core navigation, forms, dialogs, and actions are designed to work with keyboard input.'],
      ['Clear visual structure', 'Consistent spacing, focus states, labels, and contrast help people scan and understand each page.'],
      ['Feedback welcome', 'Tell us where an interaction is difficult so we can improve the experience for everyone.'],
    ],
  },
  'ad-choices': {
    icon: <FaAd />,
    eyebrow: 'Privacy controls',
    title: 'Choose how sponsored content works for you.',
    intro: 'Arcturus uses relevant sponsored content to support the network. You remain in control of the preferences that shape it.',
    sections: [
      ['Relevant advertising', 'We use activity and profile context to make sponsored content more useful, subject to your settings.'],
      ['Your settings', 'Review visibility, notification, and privacy controls from Settings & Privacy.'],
      ['No hidden decisions', 'Sponsored content is labeled so you can distinguish it from member posts and organic recommendations.'],
    ],
  },
  app: {
    icon: <FaMobileAlt />,
    eyebrow: 'Arcturus on the go',
    title: 'Your professional network, wherever work takes you.',
    intro: 'The Arcturus mobile experience is designed for quick updates, messages, opportunities, and placement alerts from your phone.',
    sections: [
      ['Stay connected', 'Keep up with messages, notifications, and your professional network between meetings and classes.'],
      ['Move quickly', 'Save jobs, review applications, and respond to opportunities without returning to your desk.'],
      ['Coming to your device', 'Mobile delivery is being prepared with the same identity and privacy controls as the web experience.'],
    ],
  },
  more: {
    icon: <FaCheckCircle />,
    eyebrow: 'Explore Arcturus',
    title: 'Tools for the next step.',
    intro: 'Go beyond the feed with focused spaces for learning, hiring, campus placement, advertising, and professional growth.',
    sections: [
      ['CampusLink', 'Prepare for placement, compare eligibility, and understand your readiness.'],
      ['Learning Hub', 'Build practical skills with courses and structured learning paths.'],
      ['Jobs and hiring', 'Find roles, track applications, or manage opportunities for your organization.'],
    ],
  },
};

const relatedLinks = [
  ['about', 'About'],
  ['accessibility', 'Accessibility'],
  ['ad-choices', 'Ad Choices'],
  ['app', 'Mobile app'],
  ['more', 'More tools'],
];

const InfoPage = ({ page: pageProp }) => {
  const { page: routePage } = useParams();
  const page = pageProp || routePage || 'about';
  const content = pageContent[page] || pageContent.about;

  return (
    <main className="infoPageWrapper">
      <section className="infoPageHero">
        <Link to="/" className="infoBackLink"><FaArrowLeft size={12} /> Back to Arcturus</Link>
        <div className="infoPageIcon">{content.icon}</div>
        <span className="infoEyebrow">{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </section>

      <section className="infoSectionGrid">
        {content.sections.map(([title, description]) => (
          <article className="infoSectionCard" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <nav className="infoRelatedNav" aria-label="Arcturus information pages">
        <span>Explore this section</span>
        <div>
          {relatedLinks.map(([key, label]) => (
            <Link key={key} to={`/${key}`} className={page === key ? 'active' : ''}>
              {label} <FaArrowRight size={10} />
            </Link>
          ))}
        </div>
      </nav>

      <section className="infoPageFooter">
        <strong>Need more help?</strong>
        <Link to="/help">Visit Help Center</Link>
        <Link to="/settings/privacy">Review privacy settings</Link>
      </section>
    </main>
  );
};

export default InfoPage;
