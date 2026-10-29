import React, { useState } from 'react';
import { IdsProvider, useIds } from './context/IdsContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Screen1OperationalMap } from './components/screens/Screen1OperationalMap';
import { Screen2DowntimeEventModal } from './components/screens/Screen2DowntimeEventModal';
import { Screen3ReallocationCandidates } from './components/screens/Screen3ReallocationCandidates';
import { Screen5EquipmentDataQuality } from './components/screens/Screen5EquipmentDataQuality';
import { Screen6_7DailyReportsReview } from './components/screens/Screen6_7DailyReportsReview';
import { Screen8PlanFactAndAccounting } from './components/screens/Screen8PlanFactAndAccounting';

const AppContent: React.FC = () => {
  const { activeScreen } = useIds();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex font-sans">
      {/* 1. Left Collapsible Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      {/* 2. Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header 
          isSidebarCollapsed={isSidebarCollapsed} 
          setIsSidebarCollapsed={setIsSidebarCollapsed} 
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
          {activeScreen === 'map' && <Screen1OperationalMap />}
          {activeScreen === 'downtime' && <Screen2DowntimeEventModal />}
          {activeScreen === 'reallocation' && <Screen3ReallocationCandidates />}
          {activeScreen === 'equipment' && <Screen5EquipmentDataQuality />}
          {activeScreen === 'reports' && <Screen6_7DailyReportsReview />}
          {activeScreen === 'plan_fact' && <Screen8PlanFactAndAccounting />}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">ИДС Трасса</span>
              <span>·</span>
              <span>Линейное дорожное строительство ПК0–ПК180</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
              <span>4 участка</span>
              <span>·</span>
              <span>20 машин</span>
              <span>·</span>
              <span>Решение за человеком</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <IdsProvider>
      <AppContent />
    </IdsProvider>
  );
}
