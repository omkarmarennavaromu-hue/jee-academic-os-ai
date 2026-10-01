import React, { useEffect, useState } from 'react';
import { useStore } from './store.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Today from './pages/Today.jsx';
import Plan from './pages/Plan.jsx';
import { Subjects, ChaptersPage, ChapterDetail } from './pages/Chapters.jsx';
import Revision from './pages/Revision.jsx';
import Pyqs from './pages/Pyqs.jsx';
import Errors from './pages/Errors.jsx';
import Mocks from './pages/Mocks.jsx';
import Analytics from './pages/Analytics.jsx';
import Resources from './pages/Resources.jsx';
import Settings from './pages/Settings.jsx';
import Coach from './pages/Coach.jsx';
import Onboarding from './components/Onboarding.jsx';
import Timer from './components/Timer.jsx';
import Search from './components/Search.jsx';
import QuickAdd from './components/QuickAdd.jsx';
import { TOTAL_DAYS } from './plan.js';
import {
  LayoutDashboard, Sun, CalendarRange, Library, BookOpen, RotateCw, Sparkles,
  FileQuestion, AlertCircle, FileBarChart, BarChart3, Link2, Settings as SettingsIcon, Search as SearchIcon,
} from 'lucide-react';

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard, 'D'],
  ['today', 'Today', Sun, 'T'],
  ['plan', '111-Day Plan', CalendarRange, 'P'],
  ['subjects', 'Subjects', Library, 'S'],
  ['chapters', 'Chapters', BookOpen, null],
  ['revision', 'Revision', RotateCw, 'R'],
  ['pyqs', 'PYQs', FileQuestion, null],
  ['errors', 'Errors', AlertCircle, 'E'],
  ['mocks', 'Mocks', FileBarChart, 'M'],
  ['analytics', 'Analytics', BarChart3, null],
  ['coach', 'AI Coach', Sparkles, null],
  ['resources', 'Resources', Link2, null],
  ['settings', 'Settings', SettingsIcon, null],
];
const MOBILE_NAV = ['dashboard', 'today', 'plan', 'chapters', 'mocks', 'more'];

export default function App() {
  const { state, route, setRoute, currentDay, daysRemaining } = useStore();
  const [search, setSearch] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const h = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const map = { d: 'dashboard', t: 'today', p: 'plan', r: 'revision', m: 'mocks', e: 'errors', s: 'subjects' };
      const k = e.key.toLowerCase();
      if (map[k]) { setRoute({ page: map[k] }); }
      if (e.key === '/') { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setRoute]);

  useEffect(() => { window.scrollTo(0, 0); }, [route.page, route.id]);

  if (!state.settings.onboarded) return <Onboarding />;

  const page = () => {
    switch (route.page) {
      case 'dashboard': return <Dashboard />;
      case 'today': return <Today key={route.tab || ''} />;
      case 'plan': return <Plan key={route.day || ''} />;
      case 'subjects': return <Subjects />;
      case 'chapters': return <ChaptersPage />;
      case 'chapter': return <ChapterDetail id={route.id} />;
      case 'revision': return <Revision />;
      case 'pyqs': return <Pyqs />;
      case 'errors': return <Errors />;
      case 'mocks': return <Mocks />;
      case 'analytics': return <Analytics />;
      case 'coach': return <Coach />;
      case 'resources': return <Resources />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };
  const activePage = route.page === 'chapter' ? 'chapters' : route.page;
  const dayLabel = currentDay < 1 ? `Starts in ${1 - currentDay}d` : currentDay > TOTAL_DAYS ? 'Complete' : `Day ${currentDay}/${TOTAL_DAYS}`;

  return (
    <div className="app">
      {/* SIDEBAR (desktop) */}
      <aside className="sidebar">
        <div className="side-brand">
          <div className="b1">JEE MAIN 2027</div>
          <div className="b2">{state.settings.name?.toUpperCase()} · {dayLabel}</div>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {NAV.map(([id, label, Icon, key]) => (
            <button key={id} className={`nav-item ${activePage === id ? 'active' : ''}`} onClick={() => setRoute({ page: id })}>
              <Icon size={15} /> {label}
              {key && <span className="kbd">{key}</span>}
            </button>
          ))}
          <button className="nav-item" onClick={() => setSearch(true)}>
            <SearchIcon size={15} /> Search <span className="kbd">/</span>
          </button>
        </nav>
        <div style={{ padding: '0 12px 10px' }}><Timer /></div>
        <div className="side-foot">
          {currentDay >= 1 && currentDay <= TOTAL_DAYS ? `${daysRemaining} days to Day 111` : '111 days · 46 chapters'}
        </div>
      </aside>

      {/* MOBILE top bar */}
      <div className="mobile-top">
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '.08em' }}>JEE MAIN 2027</div>
          <div className="small faint">{dayLabel}</div>
        </div>
        <button className="btn ghost icon" onClick={() => setSearch(true)} aria-label="Search"><SearchIcon size={17} /></button>
      </div>

      <main className="main">
        <div className="content">{page()}</div>
      </main>

      {/* MOBILE bottom nav */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {MOBILE_NAV.map((id) => {
          if (id === 'more') {
            return <button key={id} className={moreOpen ? 'active' : ''} onClick={() => setMoreOpen(true)}>
              <BarChart3 size={17} /><span>More</span>
            </button>;
          }
          const [, label, Icon] = NAV.find((n) => n[0] === id);
          return (
            <button key={id} className={activePage === id ? 'active' : ''} onClick={() => setRoute({ page: id })}>
              <Icon size={17} /><span>{label === '111-Day Plan' ? 'Plan' : label}</span>
            </button>
          );
        })}
      </nav>
      {moreOpen && (
        <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="grid g2">
              {NAV.filter(([id]) => !MOBILE_NAV.includes(id)).map(([id, label, Icon]) => (
                <button key={id} className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => { setRoute({ page: id }); setMoreOpen(false); }}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}><Timer /></div>
          </div>
        </div>
      )}

      {search && <Search onClose={() => setSearch(false)} />}
      <QuickAdd />
    </div>
  );
}
