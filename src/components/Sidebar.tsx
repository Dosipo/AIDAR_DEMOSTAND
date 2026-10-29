import React, { useState } from 'react';
import { useIds } from '../context/IdsContext';
import { 
  MapPin, 
  AlertOctagon, 
  RefreshCw, 
  Radio, 
  Layers, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const {
    activeScreen,
    setActiveScreen,
    downtimeEvents,
    triggerBreakdownDemo
  } = useIds();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const unverifiedEventsCount = downtimeEvents.filter(e => e.status === 'needs_verification').length;

  const navItems = [
    {
      id: 'map' as const,
      code: 'MAP',
      title: 'Трасса и флот',
      subtitle: 'Пикетаж ПК0–ПК180',
      icon: MapPin,
      badge: null,
    },
    {
      id: 'downtime' as const,
      code: 'INC',
      title: 'Инциденты простоя',
      subtitle: 'Телематика и причины',
      icon: AlertOctagon,
      badge: unverifiedEventsCount > 0 ? `${unverifiedEventsCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'reallocation' as const,
      code: 'MOV',
      title: 'Перераспределение',
      subtitle: '5 факторов, Move Planner',
      icon: RefreshCw,
      badge: null,
    },
    {
      id: 'equipment' as const,
      code: 'EQP',
      title: 'Реестр техники',
      subtitle: '3 отметки времени, ID',
      icon: Radio,
      badge: null,
    },
    {
      id: 'reports' as const,
      code: 'LOG',
      title: 'Полевой учет',
      subtitle: 'Сводки и цифровой факт',
      icon: Layers,
      badge: null,
    },
    {
      id: 'plan_fact' as const,
      code: 'ERP',
      title: 'План-факт и 1С',
      subtitle: 'Сверка и интеграция',
      icon: ShieldCheck,
      badge: null,
    },
  ];

  return (
    <aside
      className={`bg-[#060a12] border-r border-slate-800 flex flex-col transition-all duration-200 relative z-30 shrink-0 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Top Sidebar Header */}
      <div className="h-13 px-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs tracking-wider shrink-0 font-mono">
            ИДС
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-100 tracking-tight leading-tight">
                ДИСПЕТЧЕР ТРАССЫ
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ПК000+00 – ПК180+00
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded transition-colors shrink-0"
          title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-amber-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Nav items list */}
      <div className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 pt-1 pb-1.5 text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">
            Контуры управления
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center rounded transition-all text-left ${
                  isCollapsed ? 'justify-center py-2.5 px-2' : 'px-2.5 py-2 gap-2.5'
                } ${
                  isActive
                    ? 'bg-amber-500/15 text-white border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  {item.badge && isCollapsed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-medium truncate ${
                        isActive ? 'text-white font-semibold' : 'text-slate-300'
                      }`}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {item.subtitle}
                    </span>
                  </div>
                )}
              </button>

              {/* Hover Tooltip when Collapsed */}
              {isCollapsed && hoveredItem === item.id && (
                <div className="absolute left-[72px] top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400">[{item.code}]</span>
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.subtitle}
                  </div>
                  {item.badge && (
                    <div className="text-[10px] text-rose-300 font-mono mt-1 font-semibold">
                      Требует действия: {item.badge}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Dispatch Alert Shortcut */}
      <div className="p-2 border-t border-slate-800/80 bg-[#05080f]">
        {!isCollapsed ? (
          <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/40 text-xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                Срочный инцидент
              </span>
              <span className="font-mono text-rose-400">44 мин</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight mb-2">
              ЭК-01 на ПК110: отказ гидросистемы
            </p>
            <button
              onClick={triggerBreakdownDemo}
              className="w-full py-1 bg-rose-600/90 hover:bg-rose-600 text-white font-medium rounded text-[11px] transition-colors"
            >
              Открыть инспектор
            </button>
          </div>
        ) : (
          <button
            onClick={triggerBreakdownDemo}
            className="w-full p-2 rounded bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 text-rose-400 flex items-center justify-center transition-colors"
            title="Срочный инцидент: ЭК-01 на ПК110"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
          </button>
        )}
      </div>
    </aside>
  );
};
