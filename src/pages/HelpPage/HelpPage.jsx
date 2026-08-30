import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaUserCircle, 
  FaUserFriends, 
  FaCommentDots, 
  FaBriefcase, 
  FaShieldAlt, 
  FaCreditCard, 
  FaChevronDown, 
  FaChevronUp, 
  FaPaperPlane, 
  FaCheckCircle, 
  FaArrowLeft, 
  FaLifeRing 
} from 'react-icons/fa';
import './HelpPage.css';

const FAQS = [
  {
    q: 'How do I change my profile picture and cover banner?',
    a: 'Navigate to your Profile page and click the camera icon at the bottom-right of your avatar or the "Edit cover" button at the top-right of your cover photo to upload images instantly.',
  },
  {
    q: 'Who can see my profile and network activity?',
    a: 'By default, your profile is public to all Arcturus members. You can customize your visibility, anonymous viewing, and email privacy settings anytime under Settings & Privacy > Visibility & Privacy.',
  },
  {
    q: 'How does real-time messaging work?',
    a: 'Arcturus Messenger connects directly via WebSockets and REST APIs, delivering instant chat notifications, unread counters, and seamless synchronization across both mobile and desktop browsers.',
  },
  {
    q: 'How can I post a job or manage my active job listings?',
    a: 'Open the profile dropdown at the top right and click "Job Posting Account" (or navigate to /jobs/manage). You can publish openings, review applicants, and manage recruitment from your dedicated dashboard.',
  },
  {
    q: 'How do profile viewer counts and post impressions work?',
    a: 'Whenever authenticated members visit your profile or view your posts in the main feed, real-time analytics update your viewer counts and notification stream automatically.',
  },
];

const CATEGORIES = [
  { id: 'account', title: 'Account & Profile', desc: 'Avatar, credentials, name & bio updates', icon: <FaUserCircle size={22} /> },
  { id: 'network', title: 'Connections & Network', desc: 'Invites, followers, and networking', icon: <FaUserFriends size={22} /> },
  { id: 'messages', title: 'Messaging & InMail', desc: 'Real-time chats and conversation history', icon: <FaCommentDots size={22} /> },
  { id: 'jobs', title: 'Jobs & Careers', desc: 'Job search, applications, recruiter tools', icon: <FaBriefcase size={22} /> },
  { id: 'safety', title: 'Privacy & Safety', desc: 'Reporting content, blocking, 2FA security', icon: <FaShieldAlt size={22} /> },
  { id: 'billing', title: 'Billing & Premium', desc: 'Invoices, subscriptions, receipt downloads', icon: <FaCreditCard size={22} /> },
];

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', topic: 'General Support', message: '' });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const toggleFaq = (idx) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.message.trim()) return;
    setTicketSubmitted(true);
    setTicketForm({ name: '', email: '', topic: 'General Support', message: '' });
    setTimeout(() => setTicketSubmitted(false), 4000);
  };

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="helpPageWrapper">
      {/* Hero Header */}
      <div className="helpHero">
        <div className="helpHeroContent">
          <div className="helpIconBadge">
            <FaLifeRing size={28} />
          </div>
          <h1>How can we help you today?</h1>
          <p>Search for answers, explore guides, or contact the Arcturus support team.</p>

          <div className="helpSearchBox">
            <FaSearch className="searchIcon" />
            <input
              type="text"
              placeholder="Search help topics, FAQs, tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="helpMainContainer">
        <div className="helpTopNav">
          <Link to="/" className="helpBackBtn">
            <FaArrowLeft size={13} /> <span>Back to Feed</span>
          </Link>
        </div>

        {/* Categories Grid */}
        <section className="helpSection">
          <h2 className="sectionTitle">Browse Help by Topic</h2>
          <div className="categoriesGrid">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="categoryCard">
                <div className="categoryIcon">{cat.icon}</div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="helpSection">
          <h2 className="sectionTitle">Frequently Asked Questions</h2>
          <div className="faqList">
            {filteredFaqs.length === 0 ? (
              <p className="noResults">No matching help articles found for "{searchQuery}".</p>
            ) : (
              filteredFaqs.map((faq, idx) => (
                <div key={idx} className={`faqItem ${openFaqIndex === idx ? 'open' : ''}`}>
                  <button type="button" className="faqQuestion" onClick={() => toggleFaq(idx)}>
                    <span>{faq.q}</span>
                    {openFaqIndex === idx ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="faqAnswer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Contact Support Ticket Form */}
        <section className="helpSection">
          <div className="supportTicketCard">
            <div className="ticketHeader">
              <h2>Still need help? Send us a message</h2>
              <p>Our dedicated support engineers respond within 24 hours.</p>
            </div>

            {ticketSubmitted ? (
              <div className="ticketSuccessBox">
                <FaCheckCircle size={32} />
                <h3>Ticket submitted successfully!</h3>
                <p>Thank you for reaching out. We have logged your request and sent a confirmation to your email.</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="ticketForm">
                <div className="formGrid">
                  <div className="formGroup">
                    <label>Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Manas Das"
                      required
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. manas@example.com"
                      required
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Issue Category</label>
                    <select
                      value={ticketForm.topic}
                      onChange={(e) => setTicketForm({ ...ticketForm, topic: e.target.value })}
                    >
                      <option value="General Support">General Support</option>
                      <option value="Account & Profile">Account & Profile</option>
                      <option value="Messaging & Networking">Messaging & Networking</option>
                      <option value="Job Postings">Job Postings & Careers</option>
                      <option value="Security & Bug Report">Security & Bug Report</option>
                    </select>
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Describe your issue or feedback</label>
                    <textarea
                      rows={4}
                      placeholder="Please provide details about what happened..."
                      required
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="submitTicketBtn">
                  <FaPaperPlane size={13} /> <span>Submit Support Request</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
