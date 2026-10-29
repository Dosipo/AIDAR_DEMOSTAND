import React, { useState } from 'react';
import { useIds } from '../../context/IdsContext';
import { Machine } from '../../types/ids';
import { 
  Radio, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ShieldCheck, 
  Cpu, 
  Database,
  ArrowRight
} from 'lucide-react';

export const Screen5EquipmentDataQuality: React.FC = () => {
  const {
    machines,
    sections,
    selectedMachineId,
    setSelectedMachineId,
    resolveTelematicsConflict,
    setActiveScreen
  } = useIds();

  const [searchQuery, setSearchQuery] = useState('');
  const [conflictOnly, setConflictOnly] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeMachine = machines.find(m => m.id === selectedMachineId) || machines[0];
  const section = sections.find(s => s.id === activeMachine?.sectionId);

  const filteredList = machines.filter(m => {
    if (conflictOnly && (!m.telematicsConflict || m.telematicsConflict.status !== 'active')) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.code.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q) ||
        m.plateNumber.toLowerCase().includes(q) ||
        m.telematicsId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleResolveConflict = (resolution: 'assign_new_id' | 'split_signals') => {
    if (!activeMachine) return;
    resolveTelematicsConflict(activeMachine.id, resolution);
    setSuccessToast(
      resolution === 'assign_new_id' 
        ? 'Конфликт разрешен: ЭК-01 присвоен уникальный идентификатор OMNI-7701-A'
        : 'Конфликт разрешен: произведено разделение потоков телеметрии'
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              Реестр парка техники и аудит качества телематики
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Единая карточка машины: внешние ID, протоколы телематики, 3 отметки времени и разрешение конфликтов дублирования.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('map')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
            >
              ← К оперативной карте
            </button>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successToast}
        </div>
      )}

      {/* 2. Main Layout: Left Column Machines Master List, Right Column Unified Equipment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left List: 4 cols */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Парк дорожных машин ({filteredList.length})
            </span>
            <button
              onClick={() => setConflictOnly(!conflictOnly)}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                conflictOnly 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800'
              }`}
            >
              Только с конфликтами
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру, модели, ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {filteredList.map((m) => {
              const isSelected = activeMachine?.id === m.id;
              const hasConflict = m.telematicsConflict?.status === 'active';

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMachineId(m.id)}
                  className={`p-2.5 cursor-pointer rounded transition-all text-xs ${
                    isSelected ? 'bg-slate-800 text-white border-l-2 border-amber-400' : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{m.code}</span>
                      <span className="font-medium truncate max-w-[140px]">{m.model}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">ПК{m.station}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="font-mono truncate">{m.telematicsId}</span>
                    {hasConflict && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-medium">
                        Дубль ID
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Card: 8 cols */}
        {activeMachine && (
          <div className="lg:col-span-8 space-y-4">
            {/* Top Identity Block */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-lg text-amber-400">
                    {activeMachine.code}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {activeMachine.code} · {activeMachine.model}
                    </h2>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>Госномер: <strong className="text-white font-mono">{activeMachine.plateNumber}</strong></span>
                      <span>·</span>
                      <span>VIN: <strong className="text-white font-mono">{activeMachine.vin}</strong></span>
                      <span>·</span>
                      <span>Участок: <strong className="text-white">{section?.name}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Закрепленный машинист</span>
                  <span className="text-sm font-semibold text-white">{activeMachine.operator}</span>
                </div>
              </div>

              {/* Conflict Resolution Box if Active */}
              {activeMachine.telematicsConflict && (
                <div className={`mt-4 p-4 rounded-lg border text-xs ${
                  activeMachine.telematicsConflict.status === 'active'
                    ? 'bg-amber-950/50 border-amber-800/80 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {activeMachine.telematicsConflict.status === 'active' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Конфликт телематики: Дублирование идентификатора {activeMachine.telematicsConflict.terminalId}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Конфликт телематики устранен
                        </>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {activeMachine.telematicsConflict.detectedAt}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">
                    {activeMachine.telematicsConflict.description}
                  </p>

                  {activeMachine.telematicsConflict.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-amber-900/60 flex flex-wrap items-center gap-3">
                      <span className="text-slate-300 font-medium">Действие механика:</span>
                      <button
                        onClick={() => handleResolveConflict('assign_new_id')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors text-xs shadow-sm"
                      >
                        Присвоить уникальный ID (OMNI-7701-A)
                      </button>
                      <button
                        onClick={() => handleResolveConflict('split_signals')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors text-xs"
                      >
                        Разделить потоки RS-485
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Three Timestamps (Section 5.3) */}
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Три обязательные отметки времени телеметрии (Раздел 5.3 документа)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500">1. Замер на устройстве (t_device):</span>
                    <div className="text-sm font-mono font-bold text-white mt-1">
                      {activeMachine.lastMeasurement.t_device}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Возраст замера: {activeMachine.lastMeasurement.gpsAgeMinutes} мин
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500">2. Прием сервером (t_server):</span>
                    <div className="text-sm font-mono font-bold text-white mt-1">
                      {activeMachine.lastMeasurement.t_server}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block">
                      Шлюз: {activeMachine.lastMeasurement.telemetrySource}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500">3. Подтверждение человеком (t_verified):</span>
                    <div className="text-sm font-mono font-bold text-white mt-1">
                      {activeMachine.lastMeasurement.t_verified}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Сменный диспетчер / Главный механик
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware & Sensor Architecture */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-400" />
                Оснащение бортовой телематикой и датчиками
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-950 p-3 rounded border border-slate-800 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Бортовой терминал:</span>
                    <span className="text-white font-semibold">{activeMachine.lastMeasurement.telemetrySource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Идентификатор ID:</span>
                    <span className="text-amber-400 font-bold">{activeMachine.telematicsId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Интервал опроса:</span>
                    <span className="text-white">{activeMachine.updateIntervalSec} сек</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Шлюзовой протокол:</span>
                    <span className="text-white">EGTS / Wialon IPS v2</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 font-mono block mb-2">Подключенные датчики и шины:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMachine.sensorPack.map((sensor, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
                      >
                        ✓ {sensor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
