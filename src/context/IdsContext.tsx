import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Machine, 
  Section, 
  DowntimeEvent, 
  ReallocationCandidate, 
  RelocationOrder, 
  DailyReport, 
  DailyReportItem, 
  PlanFactEntry, 
  Role 
} from '../types/ids';
import { 
  SECTIONS, 
  INITIAL_MACHINES, 
  INITIAL_DOWNTIME_EVENT, 
  DOWNTIME_REASONS, 
  INITIAL_DAILY_REPORTS, 
  INITIAL_PLAN_FACT 
} from '../data/mockData';

interface IdsContextType {
  // Navigation & session state
  activeScreen: 'map' | 'downtime' | 'reallocation' | 'equipment' | 'reports' | 'plan_fact';
  setActiveScreen: (screen: 'map' | 'downtime' | 'reallocation' | 'equipment' | 'reports' | 'plan_fact') => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  activeShift: 'day' | 'night';
  setActiveShift: (shift: 'day' | 'night') => void;
  activeDate: string;
  selectedSectionFilter: string;
  setSelectedSectionFilter: (sectionId: string) => void;

  // Selected Entities
  selectedMachineId: string | null;
  setSelectedMachineId: (id: string | null) => void;
  selectedDowntimeId: string | null;
  setSelectedDowntimeId: (id: string | null) => void;
  activeReallocationEventId: string | null;
  setActiveReallocationEventId: (id: string | null) => void;

  // Data Collections
  sections: Section[];
  machines: Machine[];
  downtimeEvents: DowntimeEvent[];
  relocationOrders: RelocationOrder[];
  dailyReports: DailyReport[];
  planFactEntries: PlanFactEntry[];

  // Action Methods
  confirmDowntimeReason: (eventId: string, reasonId: string, note?: string) => void;
  calculateCandidatesForEvent: (eventId: string) => ReallocationCandidate[];
  confirmRelocation: (candidateMachineId: string, downtimeEventId: string, needsTrailer: boolean) => RelocationOrder;
  resolveTelematicsConflict: (machineId: string, resolution: 'assign_new_id' | 'split_signals') => void;
  verifyDailyReport: (reportId: string, correctedItems: DailyReportItem[], reviewer: string) => void;
  rejectDailyReport: (reportId: string, reason: string) => void;
  exportFactTo1C: (factEntryId: string) => void;
  retryExportTo1C: (factEntryId: string) => void;
  resetAllData: () => void;
  triggerBreakdownDemo: () => void;
}

const IdsContext = createContext<IdsContextType | undefined>(undefined);

const STORAGE_KEY = 'ids_highway_prototype_v1';

export const IdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<'map' | 'downtime' | 'reallocation' | 'equipment' | 'reports' | 'plan_fact'>('map');
  const [activeRole, setActiveRole] = useState<Role>('dispatcher');
  const [activeShift, setActiveShift] = useState<'day' | 'night'>('day');
  const [activeDate] = useState<string>('2026-10-26');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>('m-ek01');
  const [selectedDowntimeId, setSelectedDowntimeId] = useState<string | null>('DW-2041');
  const [activeReallocationEventId, setActiveReallocationEventId] = useState<string | null>('DW-2041');

  const [sections] = useState<Section[]>(SECTIONS);
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_machines`);
    return saved ? JSON.parse(saved) : INITIAL_MACHINES;
  });

  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_events`);
    return saved ? JSON.parse(saved) : [INITIAL_DOWNTIME_EVENT];
  });

  const [relocationOrders, setRelocationOrders] = useState<RelocationOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reports`);
    return saved ? JSON.parse(saved) : INITIAL_DAILY_REPORTS;
  });

  const [planFactEntries, setPlanFactEntries] = useState<PlanFactEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_planfact`);
    return saved ? JSON.parse(saved) : INITIAL_PLAN_FACT;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_machines`, JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_events`, JSON.stringify(downtimeEvents));
  }, [downtimeEvents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(relocationOrders));
  }, [relocationOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reports`, JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_planfact`, JSON.stringify(planFactEntries));
  }, [planFactEntries]);

  // Action: Confirm Downtime Reason
  const confirmDowntimeReason = (eventId: string, reasonId: string, note?: string) => {
    const reasonObj = DOWNTIME_REASONS.find(r => r.id === reasonId);
    setDowntimeEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          status: 'confirmed',
          confirmedReasonId: reasonId,
          confirmedReasonName: reasonObj ? reasonObj.name : 'Причина подтверждена',
          dispatcherNote: note || ev.dispatcherNote,
          verifiedBy: 'Диспетчер Смирнов А.П.',
          verifiedAt: '10:25 (Смена 26.10)',
        };
      }
      return ev;
    }));
  };

  // Action: Calculate Reallocation Candidates based on 5 factors
  const calculateCandidatesForEvent = (eventId: string): ReallocationCandidate[] => {
    const event = downtimeEvents.find(e => e.id === eventId);
    if (!event) return [];

    const brokenMachine = machines.find(m => m.id === event.machineId);
    if (!brokenMachine) return [];

    const targetSection = sections.find(s => s.id === event.sectionId);
    const targetStation = event.station;

    // Filter potential candidates of the same type or compatible
    const pool = machines.filter(m => m.id !== brokenMachine.id && m.type === brokenMachine.type);

    return pool.map(candidate => {
      const donorSection = sections.find(s => s.id === candidate.sectionId);
      // Distance calculation along highway: 1 PK = 100 meters
      const distanceKm = Math.abs(candidate.station - targetStation) / 10;
      
      // Heavy tracked machinery (excavator, bulldozer) needs a lowboy trailer if > 3.0 km
      const needsTrailer = distanceKm > 3.0;

      // 1. Availability factor
      const isAvailable = candidate.status !== 'breakdown' && candidate.status !== 'offline';
      const availNote = candidate.status === 'breakdown' 
        ? 'Недоступна: аварийный ремонт' 
        : candidate.status === 'idle' 
          ? 'Свободна: находится в технологическом резерве' 
          : 'Занята на участке-доноре (требуется изъятие)';

      // 2. Work compatibility
      const isCompatible = candidate.model.includes('300') || candidate.model.includes('240') || candidate.model.includes('CAT');
      const compatNote = `Класс ковша 1.4-1.6 м³ соответствует карьерным работам и погрузке ЩМА`;

      // 3. Haul distance & trailer
      const haulPass = distanceKm <= 12.0; // допустимое плечо
      const haulNote = needsTrailer
        ? `Плечо ${distanceKm.toFixed(1)} км (>3 км: требуется тяжелый низкорамный трал ТРАЛ-01)`
        : `Плечо ${distanceKm.toFixed(1)} км (допустим самоходный перегон по обочине)`;

      // Estimated arrival time:
      // Trailer: 25 min dispatch + 15 min loading + (distance / 40 km/h)*60 + 15 min unload
      // Self-propelled: (distance / 3.5 km/h) * 60
      const estimatedEtaMinutes = needsTrailer
        ? Math.round(55 + (distanceKm / 40) * 60)
        : Math.round((distanceKm / 3.5) * 60);

      // 4. Crew impact on donor section
      const donorPriority = donorSection?.priority || 3;
      const targetPriority = targetSection?.priority || 1;
      
      let crewImpactPass = true;
      let crewImpactNote = '';
      let isCalculated = true;

      if (candidate.status === 'idle') {
        crewImpactPass = true;
        crewImpactNote = 'Минимальное влияние: машина в резерве, выпуск звена не снизится';
      } else if (candidate.code === 'ЭК-02') {
        crewImpactPass = false;
        crewImpactNote = 'Высокий риск: на Участке №1 снизится темп выемки грунта на 45% (звено недогружено)';
      } else {
        isCalculated = false;
        crewImpactNote = 'Внимание: точное влияние на смежное звено не рассчитано (нет сменных норм)';
      }

      // 5. Section priority
      const priorityPass = targetPriority <= donorPriority;
      const priorityNote = targetPriority === 1 
        ? `Целевой Участок №3 имеет КРИТИЧЕСКИЙ приоритет (ШМА-16), переброска с Участка №${donorSection?.code || ''} обоснована`
        : `Приоритет донора (${donorPriority}) выше или равен целевому`;

      // Calculate aggregated score
      let score = 50;
      if (candidate.status === 'idle') score += 30;
      if (candidate.status === 'operating') score += 10;
      if (distanceKm < 5) score += 20;
      else if (distanceKm < 10) score += 10;
      if (priorityPass) score += 15;
      if (crewImpactPass) score += 15;

      const uncalculatedNotes = !isCalculated 
        ? 'Плечо рассчитано по оси трассы. Ограничения искусственных сооружений для трала не проверены.' 
        : null;

      return {
        candidateMachineId: candidate.id,
        score,
        currentSectionId: candidate.sectionId,
        targetSectionId: event.sectionId,
        currentStation: candidate.station,
        targetStation,
        travelDistanceKm: distanceKm,
        needsTrailer,
        estimatedEtaMinutes,
        factors: {
          availability: { pass: isAvailable, note: availNote },
          workCompatibility: { pass: isCompatible, note: compatNote },
          haulDistance: { pass: haulPass, distanceKm, note: haulNote },
          crewImpact: { pass: crewImpactPass, note: crewImpactNote, isCalculated },
          sectionPriority: { pass: priorityPass, donorPriority, targetPriority, note: priorityNote },
        },
        uncalculatedNotes,
      };
    }).sort((a, b) => b.score - a.score);
  };

  // Action: Confirm Relocation and generate Move Order
  const confirmRelocation = (candidateMachineId: string, downtimeEventId: string, needsTrailer: boolean): RelocationOrder => {
    const candidate = machines.find(m => m.id === candidateMachineId);
    const event = downtimeEvents.find(e => e.id === downtimeEventId);

    const distanceKm = candidate && event ? Math.abs(candidate.station - event.station) / 10 : 3.2;

    const newOrder: RelocationOrder = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      createdAt: '10:28 (26.10)',
      downtimeEventId,
      machineId: candidateMachineId,
      machineCode: candidate?.code || 'ЭК-03',
      fromSectionId: candidate?.sectionId || 'sec-2',
      toSectionId: event?.sectionId || 'sec-3',
      fromStation: candidate?.station || 78,
      toStation: event?.station || 110,
      distanceKm,
      needsTrailer,
      assignedTrailerCode: needsTrailer ? 'ТРАЛ-01 (MAN TGX)' : undefined,
      assignedBy: 'Диспетчер Смирнов А.П.',
      etaMinutes: needsTrailer ? 65 : 45,
      status: 'assigned',
      conflictsCheckedAt: '10:28:14',
      conflictCheckStatus: 'clear',
    };

    setRelocationOrders(prev => [newOrder, ...prev]);

    // Update machine status and section
    setMachines(prev => prev.map(m => {
      if (m.id === candidateMachineId) {
        return {
          ...m,
          station: event?.station || 110,
          sectionId: event?.sectionId || 'sec-3',
          status: 'operating',
          lastMeasurement: {
            ...m.lastMeasurement,
            t_verified: '10:28 (Назначена замена)',
          }
        };
      }
      return m;
    }));

    // Update downtime event status
    setDowntimeEvents(prev => prev.map(ev => {
      if (ev.id === downtimeEventId) {
        return {
          ...ev,
          status: 'resolved',
          dispatcherNote: `${ev.dispatcherNote || ''} [10:28 Решено]: Назначена замена ${candidate?.code || 'ЭК-03'} по наряду ${newOrder.id}`,
        };
      }
      return ev;
    }));

    return newOrder;
  };

  // Action: Resolve Telematics Conflict (Screen 5)
  const resolveTelematicsConflict = (machineId: string, resolution: 'assign_new_id' | 'split_signals') => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && m.telematicsConflict) {
        return {
          ...m,
          telematicsId: resolution === 'assign_new_id' ? `OMNI-7701-A` : m.telematicsId,
          telematicsConflict: {
            ...m.telematicsConflict,
            status: 'resolved',
            description: resolution === 'assign_new_id' 
              ? 'Конфликт устранен: ЭК-01 назначен уникальный ID OMNI-7701-A, дубль отвязан'
              : 'Конфликт устранен: разделены потоки датчиков по портам RS-485',
          },
          lastMeasurement: {
            ...m.lastMeasurement,
            t_verified: '10:30 (Механик подтвердил привязку)',
          }
        };
      }
      return m;
    }));
  };

  // Action: Verify Daily Report (Screen 6 & 7)
  const verifyDailyReport = (reportId: string, correctedItems: DailyReportItem[], reviewer: string) => {
    setDailyReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        return {
          ...rep,
          items: correctedItems,
          status: 'verified',
          reviewer,
          reviewedAt: 'Сегодня 10:35',
          validationErrors: [],
          version: rep.version + 1,
        };
      }
      return rep;
    }));

    // Update plan fact sync state
    setPlanFactEntries(prev => prev.map(pf => {
      if (pf.sourceReportId === reportId) {
        return {
          ...pf,
          sync1CStatus: 'ready',
          syncError: undefined,
        };
      }
      return pf;
    }));
  };

  // Action: Reject Daily Report
  const rejectDailyReport = (reportId: string, reason: string) => {
    setDailyReports(prev => prev.map(rep => {
      if (rep.id === reportId) {
        return {
          ...rep,
          status: 'rejected',
          reviewNotes: reason,
          reviewedAt: 'Сегодня 10:35',
        };
      }
      return rep;
    }));
  };

  // Action: Export to 1C
  const exportFactTo1C = (factEntryId: string) => {
    setPlanFactEntries(prev => prev.map(pf => {
      if (pf.id === factEntryId) {
        return {
          ...pf,
          sync1CStatus: 'synced',
          sync1CTimestamp: 'Сегодня 10:36',
          sync1CTransactionId: `1C-ERP-TX-${Date.now().toString().slice(-6)}`,
          syncError: undefined,
        };
      }
      return pf;
    }));
  };

  // Action: Retry Export to 1C (idempotent, prevents duplicate creation)
  const retryExportTo1C = (factEntryId: string) => {
    setPlanFactEntries(prev => prev.map(pf => {
      if (pf.id === factEntryId) {
        return {
          ...pf,
          sync1CStatus: 'synced',
          sync1CTimestamp: 'Сегодня 10:37 (Повторная успешная передача)',
          sync1CTransactionId: `1C-ERP-RETRY-${Date.now().toString().slice(-6)}`,
          syncError: undefined,
        };
      }
      return pf;
    }));
  };

  // Action: Reset demo data
  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_machines`);
    localStorage.removeItem(`${STORAGE_KEY}_events`);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    localStorage.removeItem(`${STORAGE_KEY}_reports`);
    localStorage.removeItem(`${STORAGE_KEY}_planfact`);

    setMachines(INITIAL_MACHINES);
    setDowntimeEvents([INITIAL_DOWNTIME_EVENT]);
    setRelocationOrders([]);
    setDailyReports(INITIAL_DAILY_REPORTS);
    setPlanFactEntries(INITIAL_PLAN_FACT);
    setSelectedMachineId('m-ek01');
    setSelectedDowntimeId('DW-2041');
    setActiveReallocationEventId('DW-2041');
  };

  // Action: Trigger Breakdown Demo scenario
  const triggerBreakdownDemo = () => {
    setActiveScreen('downtime');
    setSelectedMachineId('m-ek01');
    setSelectedDowntimeId('DW-2041');
    setActiveReallocationEventId('DW-2041');
  };

  return (
    <IdsContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        activeRole,
        setActiveRole,
        activeShift,
        setActiveShift,
        activeDate,
        selectedSectionFilter,
        setSelectedSectionFilter,
        selectedMachineId,
        setSelectedMachineId,
        selectedDowntimeId,
        setSelectedDowntimeId,
        activeReallocationEventId,
        setActiveReallocationEventId,
        sections,
        machines,
        downtimeEvents,
        relocationOrders,
        dailyReports,
        planFactEntries,
        confirmDowntimeReason,
        calculateCandidatesForEvent,
        confirmRelocation,
        resolveTelematicsConflict,
        verifyDailyReport,
        rejectDailyReport,
        exportFactTo1C,
        retryExportTo1C,
        resetAllData,
        triggerBreakdownDemo,
      }}
    >
      {children}
    </IdsContext.Provider>
  );
};

export const useIds = () => {
  const context = useContext(IdsContext);
  if (!context) {
    throw new Error('useIds must be used within an IdsProvider');
  }
  return context;
};
