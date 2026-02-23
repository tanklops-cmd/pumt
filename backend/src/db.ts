import { DataSource } from 'typeorm';
import { AuditRecord } from './entity/AuditRecord';
import { Prisoner } from './entity/Prisoner';
import { DailyTask } from './entity/DailyTask';
import { MusterConfirmation } from './entity/MusterConfirmation';
import { CellAlarm } from './entity/CellAlarm';
import { HandoverSection } from './entity/HandoverSection';
import { SearchTarget } from './entity/SearchTarget';
import { UnitMaintenance } from './entity/UnitMaintenance';
import { PrisonerInduction } from './entity/PrisonerInduction';
import { StripSearch } from './entity/StripSearch';
import { UnitConfig } from './entity/UnitConfig';
import { PrisonBriefing } from './entity/PrisonBriefing';
import { Notification } from './entity/Notification';
import { SacraReminder } from './entity/SacraReminder';
import { ControlHandover } from './entity/ControlHandover';
import { IsuObservation } from './entity/IsuObservation';
import { BriefingPDF } from './entity/BriefingPDF';
import { PrisonerRequest, PrisonerRequestAction } from './entity/PrisonerRequest';

export const dataSource = new DataSource({
  type: 'sqljs',
  location: 'prison_muster.sql',
  synchronize: true,
  autoSave: true,
  entities: [
    AuditRecord,
    Prisoner,
    DailyTask,
    MusterConfirmation,
    CellAlarm,
    HandoverSection,
    SearchTarget,
    UnitMaintenance,
    PrisonerInduction,
    StripSearch,
    UnitConfig,
    PrisonBriefing,
    Notification,
    SacraReminder,
    ControlHandover,
    IsuObservation,
    BriefingPDF,
    PrisonerRequest,
    PrisonerRequestAction,
  ],
});

export function getDataSource() {
  return dataSource;
}
