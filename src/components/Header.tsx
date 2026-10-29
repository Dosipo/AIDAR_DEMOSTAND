import React from 'react';
import { useIds } from '../context/IdsContext';
import { 
  MapPin, 
  RotateCcw,
  Clock,
  Menu,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Role } from '../types/ids';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const {
    activeScreen,
    activeRole,
    setActiveRole,
    activeShift,
    setActiveShift,
    selectedSectionFilter,
    setSelectedSectionFilter,
    sections,
    resetAllData
  } = useIds();

  const screenNames: Record<string, { title: string; subtitle: string }> = {
    map: { title: 'Трасса и флот', subtitle: 'Оперативный мониторинг парка вдоль пикетажа ПК000+00 – ПК180+00' },
    downtime: { title: 'Инциденты простоя', subtitle: 'Анализ телематики, 3 понятия простоя и верификация причин' },
    reallocation: { title: 'Матрица перераспределения', subtitle: 'Оценка по 5 факторам ИДС и наряд Move Planner' },
    equipment: { title: 'Реестр техники и телематика', subtitle: 'Единая карточка машины, 3 отметки времени и аудит дублей' },
    reports: { title: 'Полевой учет и факт смены', subtitle: 'Side-by-side сверка первоисточников и цифровой черновик' },
    plan_fact: { title: 'План-факт и шлюз 1С:ERP', subtitle: 'Сменный анализ выработки и защита от дублирования проводок' },
  };

  const currentScreenInfo = screenNames[activeScreen] || { title: 'Диспетчеризация', subtitle: '' };

  return (
    <header className="border-b border-slate-800 bg-[#070b14]/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        {/* Left: Sidebar toggle + Clean Breadcrumb */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Свернуть/Развернуть боковое меню"
          >
            <Menu className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className="text-slate-300 font-semibold">Трасса М-12</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-amber-400 font-semibold">{currentScreenInfo.title}</span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              {currentScreenInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Operational Controls (Shift, Section, Role, Reset) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Shift toggle */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 hidden md:inline flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3" /> Смена:
            </span>
            <div className="inline-flex rounded bg-slate-950 p-0.5 border border-slate-800 font-mono text-[11px]">
              <button
                onClick={() => setActiveShift('day')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeShift === 'day' 
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                День 08:00–20:00
              </button>
              <button
                onClick={() => setActiveShift('night')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeShift === 'night' 
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ночь 20:00–08:00
              </button>
            </div>
          </div>

          {/* Section filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 hidden md:inline flex items-center gap-1 text-[11px]">
              <MapPin className="w-3 h-3" /> Участок:
            </span>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="all">Вся трасса (ПК0–ПК180)</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (ПК{s.startStation}–ПК{s.endStation})
                </option>
              ))}
            </select>
          </div>

          {/* Role selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 hidden lg:inline flex items-center gap-1 text-[11px]">
              <UserCheck className="w-3 h-3" /> Роль:
            </span>
            <div className="inline-flex rounded bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
              {(['dispatcher', 'foreman', 'mechanic', 'accountant'] as Role[]).map((r) => {
                const labels: Record<Role, string> = {
                  dispatcher: 'Диспетчер',
                  foreman: 'Прораб',
                  mechanic: 'Механик',
                  accountant: 'Учётчик',
                  director: 'Руководитель'
                };
                return (
                  <button
                    key={r}
                    onClick={() => setActiveRole(r)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      activeRole === r 
                        ? 'bg-slate-800 text-white font-medium shadow-xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={resetAllData}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-0.5"
            title="Сбросить демо-данные"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
