import React, { useState } from 'react';
import { useIds } from '../../context/IdsContext';
import { Machine, MachineStatus, MachineType, ReallocationCandidate } from '../../types/ids';
import { DOWNTIME_REASONS } from '../../data/mockData';
import { 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Radio, 
  ArrowRight, 
  Filter, 
  Activity, 
  Fuel, 
  X, 
  Check, 
  Wrench, 
  Truck, 
  ShieldAlert, 
  FileCheck2,
  AlertOctagon,
  HelpCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Screen1OperationalMap: React.FC = () => {
  const {
    machines,
    sections,
    selectedSectionFilter,
    setSelectedSectionFilter,
    downtimeEvents,
    confirmDowntimeReason,
    calculateCandidatesForEvent,
    confirmRelocation,
    setActiveScreen,
    setSelectedMachineId,
  } = useIds();

  const [typeFilter, setTypeFilter] = useState<MachineType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MachineStatus | 'all'>('all');

  // Selected machine for the right docked inspector
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(machines[0] || null);
  const [inspectorTab, setInspectorTab] = useState<'telemetry' | 'incident' | 'reallocation'>('incident');

  // Reallocation in-inspector state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [orderCreatedMsg, setOrderCreatedMsg] = useState<string | null>(null);

  // Downtime reason in-inspector state
  const [reasonId, setReasonId] = useState<string>('rs-tech-hydr');
  const [dispatcherNote, setDispatcherNote] = useState<string>('Слесарь Васильев К. вызван. Обрыв РВД основного насоса.');
  const [reasonConfirmedMsg, setReasonConfirmedMsg] = useState<string | null>(null);

  const activeEvent = downtimeEvents.find(e => e.id === 'DW-2041') || downtimeEvents[0];
  const candidates: ReallocationCandidate[] = activeEvent ? calculateCandidatesForEvent(activeEvent.id) : [];

  // Filtered machines
  const filteredMachines = machines.filter(m => {
    if (selectedSectionFilter !== 'all' && m.sectionId !== selectedSectionFilter) {
      return false;
    }
    if (typeFilter !== 'all' && m.type !== typeFilter) {
      return false;
    }
    if (statusFilter !== 'all' && m.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusStyle = (status: MachineStatus) => {
    switch (status) {
      case 'operating':
        return {
          badge: 'bg-emerald-950/60 border-emerald-800 text-emerald-300',
          dot: 'bg-emerald-500',
          border: 'border-emerald-600',
          text: 'В работе',
        };
      case 'idle':
        return {
          badge: 'bg-amber-950/60 border-amber-800 text-amber-300',
          dot: 'bg-amber-500',
          border: 'border-amber-500',
          text: 'Холостой ход',
        };
      case 'breakdown':
        return {
          badge: 'bg-rose-950/60 border-rose-800 text-rose-300',
          dot: 'bg-rose-500',
          border: 'border-rose-500',
          text: 'Аварийный простой',
        };
      case 'offline':
        return {
          badge: 'bg-slate-900 border-slate-700 text-slate-400',
          dot: 'bg-slate-500',
          border: 'border-slate-600',
          text: 'Нет связи (>45 мин)',
        };
    }
  };

  const handleSelectMachine = (m: Machine) => {
    setSelectedMachine(m);
    setSelectedMachineId(m.id);
    if (m.status === 'breakdown') {
      setInspectorTab('incident');
    } else {
      setInspectorTab('telemetry');
    }
  };

  const handleConfirmReason = () => {
    if (!activeEvent) return;
    confirmDowntimeReason(activeEvent.id, reasonId, dispatcherNote);
    setReasonConfirmedMsg('Причина простоя верифицирована диспетчером');
    setTimeout(() => setReasonConfirmedMsg(null), 3000);
  };

  const handleEmitMoveOrder = (cand: ReallocationCandidate) => {
    if (!activeEvent) return;
    const order = confirmRelocation(cand.candidateMachineId, activeEvent.id, cand.needsTrailer);
    setOrderCreatedMsg(`Наряд ${order.id} на перебазирование ${cand.needsTrailer ? 'с тралом ТРАЛ-01' : 'самоходом'} оформлен!`);
    setTimeout(() => setOrderCreatedMsg(null), 4000);
  };

  return (
    <div className="space-y-3">
      {/* 1. Industrial Workbench Bar: Filter & Viewport Layers */}
      <div className="bg-[#0b101b] border border-slate-800/90 rounded p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Section Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 font-mono text-[11px] shrink-0 mr-1">
              Участки трассы:
            </span>
            <button
              onClick={() => setSelectedSectionFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors shrink-0 ${
                selectedSectionFilter === 'all'
                  ? 'bg-slate-800 text-amber-400 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              Все (ПК0–ПК180)
            </button>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSectionFilter(s.id === selectedSectionFilter ? 'all' : s.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors shrink-0 ${
                  selectedSectionFilter === s.id
                    ? 'bg-slate-800 text-amber-400 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
                }`}
              >
                {s.code}: ПК{s.startStation}–ПК{s.endStation}
              </button>
            ))}
          </div>

          {/* Right: Machine Type and Status Filter */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-500">Машины:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-0.5 focus:outline-none"
            >
              <option value="all">Все типы (20 ед)</option>
              <option value="excavator">Экскаваторы</option>
              <option value="bulldozer">Бульдозеры</option>
              <option value="paver">Укладчики</option>
              <option value="roller">Катки</option>
              <option value="dump_truck">Самосвалы</option>
              <option value="grader">Автогрейдеры</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-0.5 focus:outline-none"
            >
              <option value="all">Все статусы</option>
              <option value="operating">В работе</option>
              <option value="idle">Холостой ход</option>
              <option value="breakdown">Авария</option>
              <option value="offline">Серый (нет связи)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Infrakit/B2W Workspace Grid (Canvas on Left + Docked Right Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Central Map Canvas (8 cols if inspector open, 12 cols if closed) */}
        <div className={`${selectedMachine ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-3 transition-all duration-200`}>
          <div className="bg-[#0b101b] border border-slate-800 rounded p-4 relative overflow-hidden">
            {/* Map Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-200 text-xs">
                  ОСЬ ТРАССЫ М-12 (CAD / GIS СРЕЗ)
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  · 4 технологических участка · 20 активных единиц
                </span>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> В работе
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Холостой
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Авария
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500" /> Нет связи (&gt;45м)
                </span>
              </div>
            </div>

            {/* The CAD / GIS Linear Alignment View (Infrakit Style) */}
            <div className="py-6 px-1 overflow-x-auto select-none">
              {/* Technological section layers */}
              <div className="grid grid-cols-4 gap-1 h-6 rounded overflow-hidden mb-3 font-mono text-[10px] font-semibold text-center">
                {sections.map((sec) => {
                  const styles: Record<string, string> = {
                    'sec-1': 'bg-amber-950/40 border border-amber-800/60 text-amber-200',
                    'sec-2': 'bg-cyan-950/40 border border-cyan-800/60 text-cyan-200',
                    'sec-3': 'bg-rose-950/40 border border-rose-800/60 text-rose-200',
                    'sec-4': 'bg-indigo-950/40 border border-indigo-800/60 text-indigo-200',
                  };
                  const isFiltered = selectedSectionFilter === sec.id;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionFilter(sec.id === selectedSectionFilter ? 'all' : sec.id)}
                      className={`p-1 cursor-pointer transition-all truncate flex items-center justify-center gap-1 ${
                        styles[sec.id]
                      } ${isFiltered ? 'ring-1 ring-amber-400' : 'hover:opacity-90'}`}
                      title={`${sec.name} (ПК${sec.startStation}–ПК${sec.endStation})`}
                    >
                      <span className="font-bold">{sec.code}</span>
                      <span className="text-[9px] opacity-75 hidden sm:inline">ПК{sec.startStation}–{sec.endStation}</span>
                    </div>
                  );
                })}
              </div>

              {/* Road Axis Bed with Pickets and Fleet */}
              <div className="relative h-16 bg-[#060910] border border-slate-800 rounded flex items-center shadow-inner">
                {/* Road center line */}
                <div className="absolute inset-x-0 h-px border-t border-dashed border-slate-700/80 pointer-events-none" />

                {/* Picket Tick Marks (0, 20, 40, ... 180) */}
                {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((pk) => {
                  const left = (pk / 180) * 100;
                  return (
                    <div
                      key={pk}
                      className="absolute -bottom-5 flex flex-col items-center pointer-events-none -translate-x-1/2"
                      style={{ left: `${left}%` }}
                    >
                      <div className="w-px h-2.5 bg-slate-700" />
                      <span className="text-[9px] font-mono text-slate-500 font-medium tabular-nums mt-0.5">
                        ПК{pk}
                      </span>
                    </div>
                  );
                })}

                {/* Machines Placed on the Alignment */}
                {filteredMachines.map((m) => {
                  const left = Math.min(Math.max((m.station / 180) * 100, 1), 99);
                  const isSelected = selectedMachine?.id === m.id;
                  const st = getStatusStyle(m.status);

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMachine(m)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-10 ${
                        isSelected ? 'scale-125 z-20' : ''
                      }`}
                      style={{ left: `${left}%`, top: '50%' }}
                    >
                      <div
                        className={`w-6 h-6 rounded border flex items-center justify-center font-mono font-bold text-[9px] ${
                          st.badge
                        } ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950' : ''} ${
                          m.status === 'breakdown' ? 'animate-bounce' : ''
                        }`}
                        title={`${m.code} (${m.model}) на ПК${m.station}`}
                      >
                        {m.code.slice(0, 3)}
                      </div>

                      {/* Tooltip on marker */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-mono px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {m.code}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Клик по машине открывает панель инспектора справа</span>
              <span>Масштаб: 1 пикет = 100 м (Федеральная трасса)</span>
            </div>
          </div>

          {/* Actionable Bottom Incident Ribbon */}
          <div className="bg-rose-950/20 border border-rose-900/60 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-rose-900/40 text-rose-300">
                <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="font-semibold text-rose-200 text-xs flex items-center gap-2">
                  <span>Инцидент простоя #{activeEvent.id}</span>
                  <span className="font-mono text-rose-300 font-normal">ЭК-01 на ПК{activeEvent.station} (Участок №3)</span>
                </div>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  {activeEvent.dependentCrewImpact}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const targetMach = machines.find(m => m.id === activeEvent.machineId);
                if (targetMach) setSelectedMachine(targetMach);
                setInspectorTab('reallocation');
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Подобрать замену (5 факторов)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Docked Right Inspector (Infrakit Property Inspector & B2W Move Planner) */}
        {selectedMachine && (
          <div className="lg:col-span-5 xl:col-span-4 bg-[#0b101b] border border-slate-800 rounded p-4 space-y-3 sticky top-14">
            {/* Inspector Header */}
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-amber-400">
                    {selectedMachine.code}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {selectedMachine.model}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  ПК{selectedMachine.station}+00 · {sections.find(s => s.id === selectedMachine.sectionId)?.name}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${getStatusStyle(selectedMachine.status).badge}`}>
                  {getStatusStyle(selectedMachine.status).text}
                </span>
                <button
                  onClick={() => setSelectedMachine(null)}
                  className="p-1 text-slate-500 hover:text-white rounded"
                  title="Закрыть панель инспектора"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-slate-800 font-mono text-xs">
              <button
                onClick={() => setInspectorTab('telemetry')}
                className={`py-1.5 px-3 border-b-2 transition-colors ${
                  inspectorTab === 'telemetry'
                    ? 'border-amber-400 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Телеметрия
              </button>
              {selectedMachine.status === 'breakdown' && (
                <>
                  <button
                    onClick={() => setInspectorTab('incident')}
                    className={`py-1.5 px-3 border-b-2 transition-colors ${
                      inspectorTab === 'incident'
                        ? 'border-rose-400 text-rose-300 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Разбор простоя
                  </button>
                  <button
                    onClick={() => setInspectorTab('reallocation')}
                    className={`py-1.5 px-3 border-b-2 transition-colors ${
                      inspectorTab === 'reallocation'
                        ? 'border-amber-400 text-amber-300 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Подбор резерва (5 факторов)
                  </button>
                </>
              )}
            </div>

            {/* TAB 1: Telemetry & Timestamps */}
            {inspectorTab === 'telemetry' && (
              <div className="space-y-3 text-xs">
                {/* 3 Mandatory Timestamps */}
                <div className="space-y-1.5 bg-[#060910] p-2.5 rounded border border-slate-800/80 font-mono text-[11px]">
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans font-bold mb-1">
                    3 Отметки времени телеметрии (Раздел 5.3)
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">1. Замер на датчике (t_device):</span>
                    <span className="text-white font-bold">{selectedMachine.lastMeasurement.t_device}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2. Принято шлюзом (t_server):</span>
                    <span className="text-white">{selectedMachine.lastMeasurement.t_server}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3. Подтверждено (t_verified):</span>
                    <span className="text-emerald-400">{selectedMachine.lastMeasurement.t_verified}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    Возраст замера: {selectedMachine.lastMeasurement.gpsAgeMinutes} мин · Шлюз {selectedMachine.lastMeasurement.telemetrySource}
                  </div>
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-[#060910] p-2 rounded border border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-amber-400" /> ДВС:
                    </span>
                    <span className="text-white font-bold block mt-0.5">
                      {selectedMachine.lastMeasurement.engineRpm} об/мин
                    </span>
                  </div>
                  <div className="bg-[#060910] p-2 rounded border border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-emerald-400" /> Бак:
                    </span>
                    <span className="text-white font-bold block mt-0.5">
                      {selectedMachine.lastMeasurement.fuelLevelPct}%
                    </span>
                  </div>
                  <div className="bg-[#060910] p-2 rounded border border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400" /> Гидравлика:
                    </span>
                    <span className={`font-bold block mt-0.5 ${
                      selectedMachine.lastMeasurement.hydraulicPressureBar < 50 ? 'text-rose-400' : 'text-white'
                    }`}>
                      {selectedMachine.lastMeasurement.hydraulicPressureBar} бар
                    </span>
                  </div>
                  <div className="bg-[#060910] p-2 rounded border border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Наработка:
                    </span>
                    <span className="text-white font-bold block mt-0.5">
                      {selectedMachine.lastMeasurement.engineHours.toFixed(1)} м/ч
                    </span>
                  </div>
                </div>

                {/* Machine Passport info */}
                <div className="space-y-1 font-mono text-[11px] text-slate-400 bg-[#060910] p-2.5 rounded border border-slate-800">
                  <div className="flex justify-between">
                    <span>Госномер:</span> <span className="text-white">{selectedMachine.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Терминал ID:</span> <span className="text-amber-400">{selectedMachine.telematicsId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Машинист:</span> <span className="text-white">{selectedMachine.operator}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveScreen('equipment')}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  Открыть полный паспорт машины (Реестр)
                </button>
              </div>
            )}

            {/* TAB 2: Downtime Incident Inspector */}
            {inspectorTab === 'incident' && (
              <div className="space-y-3 text-xs">
                {reasonConfirmedMsg && (
                  <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-[11px] rounded flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {reasonConfirmedMsg}
                  </div>
                )}

                {/* 3 Types of downtime explanation */}
                <div className="p-2.5 bg-[#060910] border border-slate-800 rounded space-y-1">
                  <div className="font-semibold text-rose-300 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Тип: Производственный простой (срыв цикла)
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Датчики подтвердили: обрыв РВД, давление 12 бар, ДВС остановлен. Простой 44 мин блокирует укладчик ЩМА-16.
                  </p>
                </div>

                {/* Reason Confirmation Form */}
                <div className="space-y-2">
                  <label className="text-slate-400 text-[11px] block font-medium">
                    Причина из отраслевого справочника:
                  </label>
                  <select
                    value={reasonId}
                    onChange={(e) => setReasonId(e.target.value)}
                    className="w-full bg-[#060910] border border-slate-700 text-slate-100 rounded p-1.5 text-xs focus:outline-none"
                  >
                    {DOWNTIME_REASONS.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <label className="text-slate-400 text-[11px] block font-medium mt-2">
                    Заметка диспетчера:
                  </label>
                  <textarea
                    rows={2}
                    value={dispatcherNote}
                    onChange={(e) => setDispatcherNote(e.target.value)}
                    className="w-full bg-[#060910] border border-slate-700 text-slate-200 rounded p-1.5 text-xs focus:outline-none"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleConfirmReason}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded text-xs transition-colors"
                    >
                      Подтвердить причину
                    </button>
                    <button
                      onClick={() => setInspectorTab('reallocation')}
                      className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
                    >
                      К подбору замены →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 5-Factor Reallocation Matrix & Move Order */}
            {inspectorTab === 'reallocation' && (
              <div className="space-y-3 text-xs">
                {orderCreatedMsg && (
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    {orderCreatedMsg}
                  </div>
                )}

                <div className="text-[11px] text-slate-400 font-mono">
                  Матрица кандидатов на замену {activeEvent.machineCode} (ПК{activeEvent.station}):
                </div>

                {/* Candidate list */}
                <div className="space-y-2">
                  {candidates.map((cand, idx) => {
                    const m = machines.find(mach => mach.id === cand.candidateMachineId);
                    const donor = sections.find(s => s.id === cand.currentSectionId);
                    const isBest = idx === 0;

                    return (
                      <div
                        key={cand.candidateMachineId}
                        className={`p-2.5 rounded border transition-all ${
                          isBest 
                            ? 'bg-amber-950/20 border-amber-500/80' 
                            : 'bg-[#060910] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400">{m?.code}</span>
                            <span className="text-white text-[11px]">{m?.model}</span>
                            {isBest && (
                              <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300">
                                Топ 1
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            {cand.score} б · ~{cand.estimatedEtaMinutes} мин
                          </span>
                        </div>

                        {/* 5 Factors Checklist */}
                        <div className="space-y-1 my-2 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">1. Доступность:</span>
                            <span className="text-slate-200 font-mono">{cand.factors.availability.pass ? '✓ Свободен' : '✗ Занят'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">2. Совместимость:</span>
                            <span className="text-slate-200 font-mono">✓ Ковш 1.4-1.6 м³</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">3. Плечо и трал:</span>
                            <span className="text-amber-300 font-mono">
                              {cand.travelDistanceKm.toFixed(1)} км ({cand.needsTrailer ? 'ТРАЛ-01' : 'Самоход'})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">4. Ущерб донору ({donor?.code}):</span>
                            <span className={cand.factors.crewImpact.isCalculated ? 'text-slate-300' : 'text-amber-400 font-mono font-bold'}>
                              {cand.factors.crewImpact.isCalculated ? 'Минимальный' : 'Не рассчитан'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">5. Приоритет:</span>
                            <span className="text-emerald-300 font-mono">ШМА-16 (Критический)</span>
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 font-mono">
                            ПК{cand.currentStation} → ПК{cand.targetStation}
                          </span>
                          <button
                            onClick={() => handleEmitMoveOrder(cand)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] transition-colors flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            Оформить наряд
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
