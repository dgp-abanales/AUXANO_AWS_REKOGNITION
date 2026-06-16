import { useState } from 'react';
import EnrollForm from './components/EnrollForm';
import VerifyForm from './components/VerifyForm';
import UsersList from './components/UsersList';

const TABS = [
  { id: 'enroll', label: 'Enroll' },
  { id: 'verify', label: 'Verify' },
  { id: 'users', label: 'Enrolled Users' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('enroll');

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.png" alt="DGPA Logo" className="header-logo" />
        <div className="header-text">
          <div className="header-divider" />
          <h1>Facial Recognition System</h1>
          <p>DEPENDABILITY | GUIDANCE | PASSIONATE</p>
        </div>
      </header>

      <main className="main">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'enroll' && <EnrollForm />}
        {activeTab === 'verify' && <VerifyForm />}
        {activeTab === 'users' && <UsersList />}
      </main>

      <footer className="footer">
        <span className="footer-copy">Auxano Facial Recognition &copy; {new Date().getFullYear()}</span>
        <span className="footer-tagline">&ldquo;Stories Behind Numbers&rdquo;</span>
      </footer>
    </div>
  );
}
