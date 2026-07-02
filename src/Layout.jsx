import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Stethoscope, ClipboardList, BookOpen } from 'lucide-react';
import FloatingNewsButton from '@/components/news/FloatingNewsButton';

const TOPIC_PAGES = ['TopicDetail', 'Category'];
const LAST_TOPIC_KEY = 'salud_bulnes_last_topic_url';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [lastTopicUrl, setLastTopicUrl] = useState(
    () => localStorage.getItem(LAST_TOPIC_KEY) || createPageUrl('Home')
  );

  useEffect(() => {
    if (TOPIC_PAGES.includes(currentPageName)) {
      const url = location.pathname + location.search;
      localStorage.setItem(LAST_TOPIC_KEY, url);
      setLastTopicUrl(url);
    }
  }, [location, currentPageName]);

  const isOnTopicPage = TOPIC_PAGES.includes(currentPageName);

  const navItems = [
    { name: 'Inicio', page: 'Home', icon: Home, to: createPageUrl('Home') },
    { name: 'Temas', page: null, icon: BookOpen, to: lastTopicUrl, active: isOnTopicPage },
    { name: 'Herramientas', page: 'AllCalculators', icon: Stethoscope, to: createPageUrl('AllCalculators') },
    { name: 'Plantillas', page: 'Templates', icon: ClipboardList, to: createPageUrl('Templates') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-5 left-1/2 z-[60] hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/45 bg-white/60 p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 md:flex print:hidden"
      >
        {navItems.map((item) => {
          const isActive = item.active ?? currentPageName === item.page;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.to}
              aria-label={item.name}
              title={item.name}
              className={`flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-white/90 text-blue-700 shadow-sm shadow-slate-900/10'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden xl:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav md:hidden print:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 z-50 px-2 backdrop-blur-xl">
        <div className="flex justify-around gap-1">
          {navItems.map((item) => {
            const isActive = item.active ?? currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={item.to}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-[11px] font-medium leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content with bottom padding for mobile nav */}
      <main className="mobile-bottom-content md:pb-24">
        {children}
      </main>
      <FloatingNewsButton currentPageName={currentPageName} />
    </div>
  );
}
