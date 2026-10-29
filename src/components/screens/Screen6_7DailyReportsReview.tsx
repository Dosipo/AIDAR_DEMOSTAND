import React, { useState } from 'react';
import { useIds } from '../../context/IdsContext';
import { DailyReport, DailyReportItem } from '../../types/ids';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight, 
  Send, 
  MessageSquare, 
  Layers, 
  ShieldCheck,
  Edit3
} from 'lucide-react';

export const Screen6_7DailyReportsReview: React.FC = () => {
  const {
    dailyReports,
    verifyDailyReport,
    rejectDailyReport,
    setActiveScreen,
    activeRole
  } = useIds();

  const [selectedReportId, setSelectedReportId] = useState<string>(dailyReports[0]?.id || '');
  const [rejectReasonText, setRejectReasonText] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const activeReport = dailyReports.find(r => r.id === selectedReportId) || dailyReports[0];

  // Editable draft items state
  const [editedItems, setEditedItems] = useState<DailyReportItem[]>(activeReport?.items || []);

  // Update draft items when active report changes
  React.useEffect(() => {
    if (activeReport) {
      setEditedItems(activeReport.items);
    }
  }, [activeReport]);

  if (!activeReport) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-400">
        Нет входящих суточных сводок для проверки.
      </div>
    );
  }

  const handleItemChange = (itemId: string, field: keyof DailyReportItem, value: any) => {
    setEditedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleFixUnitMismatch = (itemId: string) => {
    setEditedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Convert 900 tons of sand to m3 using density 1.6: 900 / 1.6 = 562.5 m3
        return {
          ...item,
          unit: 'м³',
          factVolume: 562.5,
          unitAlert: undefined,
        };
      }
      return item;
    }));
    setActionSuccess('Единица измерения пересчитана: 900 тн песка переведены в 562.5 м³ по нормативной насыпной плотности 1.6 т/м³');
    setTimeout(() => setActionSuccess(null), 4500);
  };

  const handleConfirmReport = () => {
    verifyDailyReport(activeReport.id, editedItems, 'Учётчик Смирнова О.Н.');
    setActionSuccess(`Суточный факт #${activeReport.id} успешно подтвержден (Ревизия v${activeReport.version + 1}) и передан в Экран 8 для выгрузки в 1С!`);
    setTimeout(() => setActionSuccess(null), 4500);
  };

  const handleRejectConfirm = () => {
    if (!rejectReasonText.trim()) return;
    rejectDailyReport(activeReport.id, rejectReasonText);
    setShowRejectModal(false);
    setRejectReasonText('');
    setActionSuccess(`Сводка #${activeReport.id} возвращена прорабу на исправление.`);
    setTimeout(() => setActionSuccess(null), 4500);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Полевой учет: верификация суточных сводок и цифровой факт
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Side-by-Side сверка: Неизменяемый оригинал из мессенджера/скана слева ↔ Редактируемый цифровой черновик справа с автопроверкой единиц измерения.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('plan_fact')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Перейти к план-факту 1С
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Queue selector buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Очередь входящих сводок смены:</span>
          {dailyReports.map((r) => {
            const isSelected = selectedReportId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 ${
                  isSelected 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold' 
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{r.id} ({r.foremanName})</span>
                <span className={`text-[10px] px-1 py-0.2 rounded ${
                  r.status === 'verified' 
                    ? 'bg-emerald-950 text-emerald-300' 
                    : r.status === 'rejected' 
                      ? 'bg-rose-950 text-rose-300' 
                      : 'bg-amber-950 text-amber-300'
                }`}>
                  v{r.version} · {r.status === 'verified' ? 'Подтвержден' : r.status === 'rejected' ? 'Возвращен' : 'Черновик'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionSuccess}
        </div>
      )}

      {/* 2. Side-by-Side Layout: Screen 6 (Left) vs Screen 7 (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Screen 6 - Raw Unaltered Source Document */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Первоисточник · Неизменяемый входящий рапорт
              </span>
              <h2 className="text-sm font-bold text-white mt-0.5">
                Оригинал сообщения ({activeReport.channel})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{activeReport.receivedAt}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Автор / Прораб:</span>
              <strong className="text-white">{activeReport.foremanName}</strong>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Канал поступления:</span>
              <span className="text-amber-300 font-medium">{activeReport.channel}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Источник / Группа:</span>
              <span className="text-slate-300">{activeReport.originalAttachmentTitle}</span>
            </div>
          </div>

          {/* Raw Text Box */}
          <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
            {activeReport.originalText}
          </div>

          {/* Validation Warnings Box from AI / Rules Engine */}
          {activeReport.validationErrors.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded text-xs space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Обнаружены отклонения при самопроверке:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {activeReport.validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded text-[11px] text-slate-400">
            <strong>Правило аудита ИДС:</strong> Исходный текст сохраняется в неизменяемом виде. При любых корректировках создается новая ревизия цифрового факта, а оригинал остается доступен для ревизионных проверок.
          </div>
        </div>

        {/* Right Column (7 cols): Verified Structured Fact Draft */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                Цифровой факт · Структурированный черновик
              </span>
              <h2 className="text-sm font-bold text-white mt-0.5">
                Сменный рапорт участка (Ревизия v{activeReport.version})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Проверяющий:</span>
              <strong className="text-xs text-white">Учётчик ({activeRole})</strong>
            </div>
          </div>

          {/* Parsed items table / card editor */}
          <div className="space-y-3">
            {editedItems.map((item, idx) => {
              const hasUnitAlert = Boolean(item.unitAlert);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded border text-xs space-y-2.5 ${
                    hasUnitAlert 
                      ? 'bg-amber-950/20 border-amber-800' 
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-white text-xs">{item.workTypeName}</span>
                      <span className="font-mono text-slate-400 block mt-0.5">
                        Локация: <strong>{item.stationRange}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Техника:</span>
                      {item.machinesUsed.map(mCode => (
                        <span key={mCode} className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">
                          {mCode}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Volume and Unit Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">План объем:</span>
                      <span className="text-white font-bold">{item.planVolume} {item.unit}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">Факт объем:</span>
                      <input
                        type="number"
                        value={item.factVolume}
                        onChange={(e) => handleItemChange(item.id, 'factVolume', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white font-bold tabular-nums"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">Ед. изм.:</span>
                      <span className={`font-bold ${hasUnitAlert ? 'text-amber-400' : 'text-slate-200'}`}>
                        {item.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">Отработано:</span>
                      <span className="text-emerald-400 font-bold">{item.operatingHours} ч</span>
                      <span className="text-slate-500 ml-1">/ прост. {item.idleHours} ч</span>
                    </div>
                  </div>

                  {/* Unit Error alert with 1-click recalculation */}
                  {hasUnitAlert && (
                    <div className="p-2.5 bg-amber-950/60 border border-amber-700 rounded text-[11px] text-amber-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.unitAlert}</span>
                      </div>
                      <button
                        onClick={() => handleFixUnitMismatch(item.id)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors text-[10px]"
                      >
                        Пересчитать в м³ (562.5 м³)
                      </button>
                    </div>
                  )}

                  {/* Downtime explanation note if idle hours > 0 */}
                  {item.idleHours > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-500">Причина простоя:</span>
                      <span className="text-rose-300 font-medium">{item.idleReason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer: Confirm or Reject */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Статус записи: <strong className="text-white">
                {activeReport.status === 'verified' ? 'Подтверждено учётчиком' : 'Ожидает утверждения'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs font-medium transition-colors"
              >
                Вернуть прорабу с замечанием
              </button>

              <button
                onClick={handleConfirmReport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Подтвердить суточный факт
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Возврат сводки #{activeReport.id} на доработку прорабу
            </h3>
            <p className="text-xs text-slate-300">
              Укажите причину отклонения для уведомления прораба {activeReport.foremanName}:
            </p>
            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="Например: Неверные единицы измерения в песчаном слое или не указан простой катка..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Отмена
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs"
              >
                Отправить замечание
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
