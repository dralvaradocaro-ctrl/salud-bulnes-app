import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Stethoscope, ClipboardList, BookOpen } from 'lucide-react';

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

  // Don't show nav on home page
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile bottom navigation */}
      <nav className="md:hidden print:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-2 safe-area-pb">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = item.active ?? currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content with bottom padding for mobile nav */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}