export type Role = 'dispatcher' | 'foreman' | 'mechanic' | 'accountant' | 'director';

export type MachineType = 
  | 'excavator' 
  | 'bulldozer' 
  | 'roller' 
  | 'paver' 
  | 'dump_truck' 
  | 'grader';

export type MachineStatus = 
  | 'operating'   // В работе под нагрузкой (зеленый)
  | 'idle'        // Холостой ход / ожидание (желтый)
  | 'breakdown'   // Аварийный простой (красный)
  | 'offline';    // Устаревшие данные / нет связи (серый)

export interface LastMeasurement {
  t_device: string;              // Время измерения на терминале
  t_server: string;              // Время приема сервером
  t_verified: string;            // Время верификации диспетчером
  gpsAgeMinutes: number;         // Возраст координат
  fuelLevelPct: number;          // Топливо %
  engineRpm: number;             // Обороты двигателя
  engineHours: number;           // Моточасы
  hydraulicPressureBar: number;  // Давление в гидросистеме (бар)
  isIgnitionOn: boolean;         // Зажигание
  telemetrySource: string;       // Например: Omnicomm Profi / Wialon / АвтоГРАФ
}

export interface TelematicsConflict {
  conflictType: 'duplicate_id' | 'orphan_terminal' | 'mismatched_model';
  terminalId: string;
  duplicateMachineCode?: string;
  detectedAt: string;
  status: 'active' | 'resolved';
  description: string;
}

export interface Machine {
  id: string;
  code: string;                 // Бортовой номер: ЭК-01
  model: string;                // CAT 330, Komatsu PC300
  type: MachineType;
  status: MachineStatus;
  station: number;              // Пикет, например 112 = ПК112+00
  sectionId: string;            // Участок привязки
  operator: string;             // ФИО машиниста
  operatorStatus: 'ready' | 'shift_ending' | 'absent';
  vin: string;
  plateNumber: string;
  telematicsId: string;         // Внешний ID терминала
  sensorPack: string[];         // Датчики: GPS, CAN, Топливо, Гидравлика
  updateIntervalSec: number;
  lastMeasurement: LastMeasurement;
  telematicsConflict?: TelematicsConflict;
}

export interface Section {
  id: string;
  name: string;
  code: string;
  startStation: number;         // ПК начало (например, 0)
  endStation: number;           // ПК конец (например, 45)
  priority: 1 | 2 | 3;          // 1 = Критический, 2 = Высокий, 3 = Стандартный
  priorityLabel: string;
  foreman: string;
  activeCrewName: string;
  workDescription: string;
  plannedOutputToday: string;
}

export type DowntimeType = 
  | 'gps_stop'          // Остановка по координатам (машина не едет)
  | 'idle_run'          // Холостой ход двигателя (мотор заведен, нагрузки нет)
  | 'production_stop';  // Производственный простой (срыв технологического цикла)

export interface DowntimeEvent {
  id: string;
  machineId: string;
  machineCode: string;
  sectionId: string;
  station: number;
  detectedAt: string;
  durationMinutes: number;
  type: DowntimeType;
  status: 'needs_verification' | 'confirmed' | 'resolved';
  sourceSignal: string;
  confirmedReasonId?: string;
  confirmedReasonName?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  dispatcherNote?: string;
  repairRequestId?: string;
  dependentCrewImpact: string;
  timeline: Array<{
    time: string;
    rpm: number;
    pressure: number;
    fuel: number;
    isIgnition: boolean;
    state: string;
  }>;
}

export interface ReallocationCandidate {
  candidateMachineId: string;
  score: number;
  currentSectionId: string;
  targetSectionId: string;
  currentStation: number;
  targetStation: number;
  travelDistanceKm: number;
  needsTrailer: boolean;
  estimatedEtaMinutes: number;
  factors: {
    availability: { pass: boolean; note: string };
    workCompatibility: { pass: boolean; note: string };
    haulDistance: { pass: boolean; distanceKm: number; note: string };
    crewImpact: { pass: boolean; note: string; isCalculated: boolean };
    sectionPriority: { pass: boolean; donorPriority: number; targetPriority: number; note: string };
  };
  uncalculatedNotes: string | null;
}

export interface RelocationOrder {
  id: string;
  createdAt: string;
  downtimeEventId: string;
  machineId: string;
  machineCode: string;
  fromSectionId: string;
  toSectionId: string;
  fromStation: number;
  toStation: number;
  distanceKm: number;
  needsTrailer: boolean;
  assignedTrailerCode?: string;
  assignedBy: string;
  etaMinutes: number;
  status: 'assigned' | 'in_transit' | 'delivered';
  conflictsCheckedAt: string;
  conflictCheckStatus: 'clear' | 'warning';
}

export interface DailyReportItem {
  id: string;
  workTypeId: string;
  workTypeName: string;
  stationRange: string;
  planVolume: number;
  factVolume: number;
  unit: string;
  machinesUsed: string[];
  operatingHours: number;
  idleHours: number;
  idleReason?: string;
  unitAlert?: string;
}

export interface DailyReport {
  id: string;
  date: string;
  shift: 'day' | 'night';
  sectionId: string;
  foremanName: string;
  channel: 'Telegram' | 'WhatsApp' | 'PaperScan' | 'DirectInput';
  originalText: string;
  originalAttachmentTitle?: string;
  receivedAt: string;
  version: number;
  status: 'draft' | 'needs_review' | 'verified' | 'rejected' | 'exported_to_1c';
  reviewer?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  validationErrors: string[];
  items: DailyReportItem[];
}

export interface PlanFactEntry {
  id: string;
  sectionId: string;
  workTypeName: string;
  stationRange: string;
  planVolume: number;
  factVolume: number;
  unit: string;
  variancePct: number;
  planHours: number;
  factHours: number;
  idleHours: number;
  primaryIdleReason: string;
  sourceReportId: string;
  sync1CStatus: 'ready' | 'synced' | 'failed' | 'pending';
  sync1CTransactionId?: string;
  sync1CTimestamp?: string;
  syncError?: string;
}
