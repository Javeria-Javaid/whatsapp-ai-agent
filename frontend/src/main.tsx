import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const App = () => (
  <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">Phase 1</p>
      <h1 className="mt-3 text-4xl font-semibold">WhatsApp AI Agent Dashboard</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
        The admin dashboard shell is ready. Authentication, analytics, conversations, and knowledge
        base management are implemented in later phases.
      </p>
    </section>
  </main>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
