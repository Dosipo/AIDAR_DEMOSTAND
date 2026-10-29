import React, { useState } from 'react';
import { useIds } from '../../context/IdsContext';
import { DOWNTIME_REASONS } from '../../data/mockData';
import { 
  AlertOctagon, 
  Clock, 
  Activity, 
  Wrench, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  Layers,
  FileText
} from 'lucide-react';
import { DowntimeType } from '../../types/ids';

export const Screen2DowntimeEventModal: React.FC = () => {
  const {
    downtimeEvents,
    selectedDowntimeId,
    confirmDowntimeReason,
    setActiveScreen,
    setActiveReallocationEventId,
    sections,
    machines
  } = useIds();

  const activeEvent = downtimeEvents.find(e => e.id === selectedDowntimeId) || downtimeEvents[0];
  const machine = machines.find(m => m.id === activeEvent?.machineId);
  const section = sections.find(s => s.id === activeEvent?.sectionId);

  const [selectedReasonId, setSelectedReasonId] = useState<string>(activeEvent?.confirmedReasonId || 'rs-tech-hydr');
  const [dispatcherNote, setDispatcherNote] = useState<string>(activeEvent?.dispatcherNote || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!activeEvent) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-400">
        Нет активных инцидентов простоя для разбора.
      </div>
    );
  }

  const handleConfirm = () => {
    confirmDowntimeReason(activeEvent.id, selectedReasonId, dispatcherNote);
    setSuccessMsg('Причина простоя подтверждена в журнале инцидентов!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleProceedToReallocation = () => {
    // If not confirmed yet, auto confirm with chosen reason
    if (activeEvent.status === 'needs_verification') {
      confirmDowntimeReason(activeEvent.id, selectedReasonId, dispatcherNote);
    }
    setActiveReallocationEventId(activeEvent.id);
    setActiveScreen('reallocation');
  };

  const getDowntimeConceptExplanation = (type: DowntimeType) => {
    switch (type) {
      case 'gps_stop':
        return {
          title: '1. Остановка по координатам (GPS)',
          desc: 'Подтверждает: машина не меняет геопозицию. Не подтверждает: поломку двигателя или остановку навесного органа.',
          badge: 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
        };
      case 'idle_run':
        return {
          title: '2. Холостой ход двигателя (Idle)',
          desc: 'Подтверждает: двигатель работает без полезной нагрузки. Не определяет: объективную причину ожидания.',
          badge: 'bg-amber-950/60 border-amber-800 text-amber-300'
        };
      case 'production_stop':
        return {
          title: '3. Производственный простой (Инцидент)',
          desc: 'Подтверждает: технологический цикл сорван, требуется подтверждение причины диспетчером и перераспределение.',
          badge: 'bg-rose-950/60 border-rose-800 text-rose-300'
        };
    }
  };

  const currentConcept = getDowntimeConceptExplanation(activeEvent.type);

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  Инспектор события простоя #{activeEvent.id}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-rose-950 border border-rose-800 text-rose-300">
                  {activeEvent.machineCode} · ПК{activeEvent.station}+00
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${
                  activeEvent.status === 'confirmed' 
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
                    : 'bg-amber-950 border-amber-800 text-amber-300'
                }`}>
                  {activeEvent.status === 'confirmed' ? 'Причина подтверждена' : 'Требует проверки диспетчера'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Разделение трех понятий простоя по разделу 5.2 документа. Источник сигнала: {activeEvent.sourceSignal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('map')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
            >
              ← К трассе
            </button>
            <button
              onClick={handleProceedToReallocation}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded transition-colors flex items-center gap-2 shadow-sm"
            >
              Подбор замены по 5 факторам
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* 2. Three Distinct Concepts of Downtime (Section 5.2 of PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['gps_stop', 'idle_run', 'production_stop'] as DowntimeType[]).map((t) => {
          const info = getDowntimeConceptExplanation(t);
          const isCurrent = activeEvent.type === t;
          return (
            <div
              key={t}
              className={`p-3.5 rounded-lg border text-xs transition-all ${
                isCurrent 
                  ? 'bg-slate-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/30' 
                  : 'bg-slate-950/80 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white">{info.title}</span>
                {isCurrent && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-medium">
                    Текущий статус
                  </span>
                )}
              </div>
              <p className="text-slate-400 leading-relaxed">{info.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3. Left 2 columns: Telematics Timeline & Signal Detail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Временная шкала датчиков за смену (ЭК-01 · Давление / Обороты / Топливо)
              </h3>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Начало инцидента: {activeEvent.detectedAt} (длительность: {activeEvent.durationMinutes} мин)
              </span>
            </div>

            {/* Timeline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2 px-3">Время</th>
                    <th className="py-2 px-3">Зажигание</th>
                    <th className="py-2 px-3">Обороты ДВС</th>
                    <th className="py-2 px-3">Давление гидросистемы</th>
                    <th className="py-2 px-3">Топливо</th>
                    <th className="py-2 px-3">Статус телематики</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
                  {activeEvent.timeline.map((point, idx) => {
                    const isFailure = point.pressure <= 50;
                    return (
                      <tr key={idx} className={isFailure ? 'bg-rose-950/20' : 'hover:bg-slate-800/40'}>
                        <td className="py-2.5 px-3 font-semibold text-white">{point.time}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            point.isIgnition ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {point.isIgnition ? 'ВКЛ' : 'ВЫКЛ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{point.rpm} об/мин</td>
                        <td className="py-2.5 px-3">
                          <span className={isFailure ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                            {point.pressure} бар
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{point.fuel}%</td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">{point.state}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Автоматическое основание инцидента:</strong> В 09:35 зафиксирован критический сброс гидравлического давления с 288 до 110 бар с последующей остановкой ДВС. В 09:40 координата GPS замерла на ПК110. Машина не выполняет технологическую операцию в течение 44 минут.
              </div>
            </div>
          </div>

          {/* Dependent Crew Impact Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-rose-400" />
              Влияние на смежное производственное звено (Участок №3)
            </h3>
            <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded text-xs text-rose-200 space-y-2">
              <p>{activeEvent.dependentCrewImpact}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-rose-900/40 text-[11px] font-mono">
                <div>
                  Затронуто: <strong>Асфальтоукладчик АСФ-01</strong>
                </div>
                <div>
                  Самосвалы в очереди: <strong>4 ед. (80 тн асфальта)</strong>
                </div>
                <div>
                  Температура смеси: <strong>132°C (критично)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Right column: Reason Confirmation & Dispatcher Actions */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Wrench className="w-4 h-4 text-amber-400" />
              Подтверждение причины уполномоченным лицом
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Справочник подтвержденных причин простоя:
                </label>
                <select
                  value={selectedReasonId}
                  onChange={(e) => setSelectedReasonId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                >
                  {DOWNTIME_REASONS.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.category}] {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Справочник причин отделен от кодов дефектов 1С согласно разделу 5.2.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Связанная заявка на ремонт (В2W Repair Request):
                </label>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                  <span className="font-mono text-amber-300 font-bold">{activeEvent.repairRequestId || 'ЗНР-4091'}</span>
                  <span className="text-[10px] text-slate-400">Слесарь Васильев К. вызван</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Заметка диспетчера / прораба:
                </label>
                <textarea
                  rows={3}
                  value={dispatcherNote}
                  onChange={(e) => setDispatcherNote(e.target.value)}
                  placeholder="Укажите подробности переговоров с машинистом..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <button
                  onClick={handleConfirm}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Подтвердить причину в журнале
                </button>

                <button
                  onClick={handleProceedToReallocation}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  Запустить подбор резервной техники →
                </button>
              </div>
            </div>
          </div>

          {/* Machine & Operator Context */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Паспорт машины инцидента
            </h4>
            <div className="space-y-1.5 text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Машина:</span> <span className="text-white">{machine?.code} ({machine?.model})</span>
              </div>
              <div className="flex justify-between">
                <span>Участок:</span> <span className="text-white">{section?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Машинист:</span> <span className="text-white">{machine?.operator}</span>
              </div>
              <div className="flex justify-between">
                <span>Статус оператора:</span> <span className="text-emerald-400">На объекте (готов)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
