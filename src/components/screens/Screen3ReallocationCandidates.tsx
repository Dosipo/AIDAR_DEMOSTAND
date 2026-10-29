import React, { useState } from 'react';
import { useIds } from '../../context/IdsContext';
import { ReallocationCandidate } from '../../types/ids';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Truck, 
  Clock, 
  ArrowRight, 
  Scale, 
  ShieldAlert, 
  HelpCircle,
  FileCheck2,
  RefreshCw
} from 'lucide-react';

export const Screen3ReallocationCandidates: React.FC = () => {
  const {
    activeReallocationEventId,
    downtimeEvents,
    calculateCandidatesForEvent,
    machines,
    sections,
    setActiveScreen,
    confirmRelocation,
    relocationOrders
  } = useIds();

  const activeEvent = downtimeEvents.find(e => e.id === activeReallocationEventId) || downtimeEvents[0];
  const targetSection = sections.find(s => s.id === activeEvent?.sectionId);
  const brokenMachine = machines.find(m => m.id === activeEvent?.machineId);

  const candidates: ReallocationCandidate[] = activeEvent ? calculateCandidatesForEvent(activeEvent.id) : [];

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.candidateMachineId || ''
  );

  // Screen 4 confirmation modal state / embedded step
  const [isConfirmingStep, setIsConfirmingStep] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  if (!activeEvent || candidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-400">
        Нет активных сценариев перераспределения. Перейдите в экран «Оперативная карта» или «Инциденты простоя».
      </div>
    );
  }

  const chosenCandidate = candidates.find(c => c.candidateMachineId === selectedCandidateId) || candidates[0];
  const chosenMachine = machines.find(m => m.id === chosenCandidate?.candidateMachineId);
  const donorSection = sections.find(s => s.id === chosenCandidate?.currentSectionId);

  const handleFinalConfirm = () => {
    if (!chosenCandidate) return;
    const order = confirmRelocation(
      chosenCandidate.candidateMachineId,
      activeEvent.id,
      chosenCandidate.needsTrailer
    );
    setCreatedOrder(order);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Problem Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                Матрица подбора резервной техники по 5 факторам
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono font-bold">
                Цель: Замена {brokenMachine?.code} на ПК{activeEvent.station}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Целевой объект: <strong className="text-white">{targetSection?.name}</strong> (Приоритет 1 · Критический). Модель ранжирования анализирует 5 ограничений с явной отметкой нерассчитанных рисков.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('downtime')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
            >
              ← Журнал инцидента
            </button>
            <button
              onClick={() => setIsConfirmingStep(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded transition-colors flex items-center gap-2 shadow-sm"
            >
              Оформить наряд перебазирования
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Order Screen Modal (Move Planner) */}
      {isConfirmingStep && (
        <div className="bg-slate-900 border-2 border-amber-500/80 rounded-lg p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">
                Move Planner · График перебазирования техники
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Подтверждение наряда на перебазирование и проверка конфликтов
              </h2>
            </div>
            <button
              onClick={() => setIsConfirmingStep(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              ✕ Вернуться к сравнению
            </button>
          </div>

          {!createdOrder ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What changes */}
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider">
                    Параметры переброски техники
                  </h3>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Назначаемая машина:</span>
                      <strong className="text-amber-400 text-sm">{chosenMachine?.code} ({chosenMachine?.model})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Откуда (донор):</span>
                      <span className="text-white">{donorSection?.name} (ПК{chosenCandidate.currentStation})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Куда (цель):</span>
                      <span className="text-white">{targetSection?.name} (ПК{chosenCandidate.targetStation})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Расстояние по трассе:</span>
                      <span className="text-white">{chosenCandidate.travelDistanceKm.toFixed(1)} км</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Способ доставки:</span>
                      <span className="text-amber-300 font-bold">
                        {chosenCandidate.needsTrailer ? 'Тяжелый трал ТРАЛ-01 (MAN TGX)' : 'Своим ходом по обочине'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Расчетное время прибытия:</span>
                      <span className="text-emerald-400 font-bold">{chosenCandidate.estimatedEtaMinutes} минут</span>
                    </div>
                  </div>
                </div>

                {/* Pre-flight conflict check (B2W Conflicts Panel) */}
                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    Повторная автоматическая проверка конфликтов (10:28:14)
                  </h3>
                  <ul className="space-y-1.5 text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Пересекающихся нарядов на смену 26.10 день нет</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Машинист {chosenMachine?.operator} подтвердил готовность</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Трал ТРАЛ-01 свободен на базе ПК050 (время подачи 25 мин)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Габариты мостовых переходов и путепроводов проверены</span>
                    </li>
                  </ul>
                  <div className="p-2 bg-emerald-950/40 border border-emerald-800 rounded text-[11px] text-emerald-300">
                    Статус проверки: <strong>Коллизий не обнаружено</strong>. Назначение безопасно для фиксации.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="text-slate-400 text-xs">
                  Ответственный: <strong>Диспетчер Смирнов А.П.</strong> · Фиксация с сохранением времени в аудит-логе.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConfirmingStep(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleFinalConfirm}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-2 shadow-md"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    Подтвердить переброску и выпустить Move Order
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-800 rounded p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                Наряд на перемещение #{createdOrder.id} успешно сформирован!
              </div>
              <p className="text-slate-300">
                Машина <strong className="text-white">{createdOrder.machineCode}</strong> переведена в статус перемещения на Участок №3 (ПК{createdOrder.toStation}). Подана заявка на трал {createdOrder.assignedTrailerCode}. Затронутый инцидент {activeEvent.id} переведен в статус «Разрешен».
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsConfirmingStep(false);
                    setActiveScreen('map');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded"
                >
                  Вернуться к мониторингу трассы →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Grid of Reallocation Candidates (Comparison Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((cand, idx) => {
          const m = machines.find(mach => mach.id === cand.candidateMachineId);
          const donor = sections.find(s => s.id === cand.currentSectionId);
          const isSelected = selectedCandidateId === cand.candidateMachineId;

          return (
            <div
              key={cand.candidateMachineId}
              onClick={() => setSelectedCandidateId(cand.candidateMachineId)}
              className={`bg-slate-900 border rounded-lg p-5 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Candidate Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-sm text-white">
                    {m?.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        Вариант {idx + 1}: {m?.code} ({m?.model})
                      </h3>
                      {idx === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                          Рекомендуемый
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Текущая локация: <strong className="text-white font-mono">ПК{cand.currentStation}+00</strong> ({donor?.name})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {cand.score} <span className="text-xs text-slate-500 font-normal">баллов</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Прибытие: ~{cand.estimatedEtaMinutes} мин
                  </div>
                </div>
              </div>

              {/* 5 Factors Checklist (Mandatory Section 5.1) */}
              <div className="my-3 space-y-2 text-xs">
                {/* Factor 1: Availability */}
                <div className="flex items-start gap-2">
                  {cand.factors.availability.pass ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">1. Доступность:</span>{' '}
                    <span className="text-slate-400">{cand.factors.availability.note}</span>
                  </div>
                </div>

                {/* Factor 2: Work Compatibility */}
                <div className="flex items-start gap-2">
                  {cand.factors.workCompatibility.pass ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">2. Соответствие виду работ:</span>{' '}
                    <span className="text-slate-400">{cand.factors.workCompatibility.note}</span>
                  </div>
                </div>

                {/* Factor 3: Haul distance & trailer */}
                <div className="flex items-start gap-2">
                  {cand.factors.haulDistance.pass ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">3. Плечо возки:</span>{' '}
                    <span className="text-slate-400">{cand.factors.haulDistance.note}</span>
                  </div>
                </div>

                {/* Factor 4: Crew impact on donor */}
                <div className="flex items-start gap-2">
                  {!cand.factors.crewImpact.isCalculated ? (
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  ) : cand.factors.crewImpact.pass ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">4. Загрузка звена-донора:</span>{' '}
                    <span className={!cand.factors.crewImpact.isCalculated ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                      {cand.factors.crewImpact.note}
                    </span>
                  </div>
                </div>

                {/* Factor 5: Section priority */}
                <div className="flex items-start gap-2">
                  {cand.factors.sectionPriority.pass ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200">5. Приоритет участка:</span>{' '}
                    <span className="text-slate-400">{cand.factors.sectionPriority.note}</span>
                  </div>
                </div>
              </div>

              {/* Uncalculated Warning Note (Rule from 5.1: if not calculated, explicitly state it) */}
              {cand.uncalculatedNotes && (
                <div className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded text-[11px] text-amber-300 flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cand.uncalculatedNotes}</span>
                </div>
              )}

              {/* Action row on card */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Источник данных: Телематика + Сменное задание
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCandidateId(cand.candidateMachineId);
                    setIsConfirmingStep(true);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  Выбрать и оформить →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Existing Move Orders Registry (From Section 2.2 B-S06 Move Planner) */}
      {relocationOrders.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            Реестр действующих нарядов на перебазирование (Move Orders)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2 px-3">Номер наряда</th>
                  <th className="py-2 px-3">Машина</th>
                  <th className="py-2 px-3">Маршрут</th>
                  <th className="py-2 px-3">Плечо</th>
                  <th className="py-2 px-3">Транспорт</th>
                  <th className="py-2 px-3">ETA</th>
                  <th className="py-2 px-3">Диспетчер</th>
                  <th className="py-2 px-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
                {relocationOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-amber-300">{ord.id}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{ord.machineCode}</td>
                    <td className="py-2.5 px-3">ПК{ord.fromStation} → ПК{ord.toStation}</td>
                    <td className="py-2.5 px-3">{ord.distanceKm.toFixed(1)} км</td>
                    <td className="py-2.5 px-3">{ord.assignedTrailerCode || 'Самоход'}</td>
                    <td className="py-2.5 px-3 text-emerald-400">~{ord.etaMinutes} мин</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{ord.assignedBy}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {ord.status === 'assigned' ? 'Назначен / В пути' : ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
