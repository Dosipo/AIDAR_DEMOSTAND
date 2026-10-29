import React, { useState } from 'react';
import { useIds } from '../../context/IdsContext';
import { PlanFactEntry } from '../../types/ids';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  Send, 
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';

export const Screen8PlanFactAndAccounting: React.FC = () => {
  const {
    planFactEntries,
    exportFactTo1C,
    retryExportTo1C,
    sections,
    setActiveScreen
  } = useIds();

  const [selectedEntry, setSelectedEntry] = useState<PlanFactEntry | null>(planFactEntries[0] || null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleExport = (id: string) => {
    exportFactTo1C(id);
    setSuccessToast(`Запись #${id} успешно передана в контур 1С:ERP с присвоением транзакции!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleRetry = (id: string) => {
    retryExportTo1C(id);
    setSuccessToast(`Повторная передача #${id} в 1С выполнена успешно без риска дублирования проводок.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Tracking Account · План-факт выработки и шлюз 1С:ERP
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Сопоставление сменных целей и подтвержденного факта (Tracking Account). Защита от дублей при передаче в бухгалтерию.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('reports')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
            >
              ← К полевому учету
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

      {/* 2. Main Plan-Fact Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            Производственный учет за смену 26.10 (Трасса ПК0–ПК180)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Кликните на строку для перехода к первоисточнику и объяснению отклонения
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Участок</th>
                <th className="py-2.5 px-3">Вид дорожных работ</th>
                <th className="py-2.5 px-3">Пикетаж</th>
                <th className="py-2.5 px-3 text-right">План объем</th>
                <th className="py-2.5 px-3 text-right">Факт объем</th>
                <th className="py-2.5 px-3 text-right">Отклонение</th>
                <th className="py-2.5 px-3 text-right">Часы (факт / прост.)</th>
                <th className="py-2.5 px-3">Основная причина простоя</th>
                <th className="py-2.5 px-3">Статус в 1С:ERP</th>
                <th className="py-2.5 px-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
              {planFactEntries.map((entry) => {
                const sec = sections.find(s => s.id === entry.sectionId);
                const isSelected = selectedEntry?.id === entry.id;
                const isNegative = entry.variancePct < 0;

                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-slate-800/80 font-medium' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-white">
                      {sec?.code || 'УЧ'}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-200">
                      {entry.workTypeName}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {entry.stationRange}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {entry.planVolume} {entry.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {entry.factVolume} {entry.unit}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isNegative ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {entry.variancePct > 0 ? `+${entry.variancePct}%` : `${entry.variancePct}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {entry.factHours}ч / <span className="text-rose-400 font-bold">{entry.idleHours}ч</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400 truncate max-w-[200px]">
                      {entry.primaryIdleReason}
                    </td>
                    <td className="py-3 px-3">
                      {entry.sync1CStatus === 'synced' && (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Передано в 1С
                        </span>
                      )}
                      {entry.sync1CStatus === 'ready' && (
                        <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> Готово к выгрузке
                        </span>
                      )}
                      {entry.sync1CStatus === 'failed' && (
                        <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Ошибка шлюза 1С
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      {entry.sync1CStatus === 'ready' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(entry.id);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded transition-colors"
                        >
                          Передать в 1С
                        </button>
                      )}
                      {entry.sync1CStatus === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(entry.id);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded transition-colors"
                        >
                          Повторить без дубля
                        </button>
                      )}
                      {entry.sync1CStatus === 'synced' && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {entry.sync1CTransactionId?.slice(-6)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Detail Drilldown: Trace to Source Report & Reason Breakdown */}
      {selectedEntry && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Сквозная прослеживаемость факта
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Анализ отклонения: {selectedEntry.workTypeName} ({selectedEntry.stationRange})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Связанная суточная сводка:</span>
              <button
                onClick={() => setActiveScreen('reports')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs rounded flex items-center gap-1"
              >
                {selectedEntry.sourceReportId}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Column 1: Variance Root Cause */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Причина отклонения выработки:</span>
              <p className="text-slate-200 leading-relaxed">
                {selectedEntry.primaryIdleReason}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Зафиксировано часов простоя: <strong className="text-rose-400 font-mono">{selectedEntry.idleHours} ч</strong>
              </div>
            </div>

            {/* Column 2: 1C Accounting Integration Status */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold block">Интеграционный статус 1С:</span>
              {selectedEntry.sync1CStatus === 'synced' ? (
                <div className="space-y-1 text-emerald-300 font-mono">
                  <div>Документ 1С: <strong>{selectedEntry.sync1CTransactionId}</strong></div>
                  <div className="text-[11px] text-slate-400">Время шлюза: {selectedEntry.sync1CTimestamp}</div>
                  <div className="text-[10px] text-emerald-400">Идемпотентный ключ сохранен в регистре сведений</div>
                </div>
              ) : selectedEntry.sync1CStatus === 'failed' ? (
                <div className="space-y-1.5 text-rose-300">
                  <div className="font-semibold">Ошибка выгрузки:</div>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed bg-rose-950/40 p-2 rounded border border-rose-900">
                    {selectedEntry.syncError}
                  </p>
                  <button
                    onClick={() => handleRetry(selectedEntry.id)}
                    className="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
                  >
                    Повторить отправку (без дубля)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-amber-300">Ожидает отправки в бухгалтерию</span>
                  <button
                    onClick={() => handleExport(selectedEntry.id)}
                    className="block px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                  >
                    Выполнить экспорт в 1С
                  </button>
                </div>
              )}
            </div>

            {/* Column 3: Audit Trail */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-1.5 text-slate-400 font-mono text-[11px]">
              <span className="text-slate-300 font-semibold block font-sans">Журнал ревизий и авторства:</span>
              <div>Источник: Полевой рапорт прораба</div>
              <div>Верификатор: Учётчик Смирнова О.Н.</div>
              <div>Контроль пикетажа: ПК{selectedEntry.stationRange}</div>
              <div>Защита: MD5-хеш исходного сообщения сохранен</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
