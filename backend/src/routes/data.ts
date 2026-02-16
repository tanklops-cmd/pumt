import { Router, Response } from 'express';
import { DataSource } from 'typeorm';
import { Prisoner } from '../entity/Prisoner';
import { DailyTask } from '../entity/DailyTask';
import { MusterConfirmation } from '../entity/MusterConfirmation';
import { CellAlarm } from '../entity/CellAlarm';
import { HandoverSection } from '../entity/HandoverSection';
import { SearchTarget } from '../entity/SearchTarget';
import { UnitMaintenance } from '../entity/UnitMaintenance';
import { PrisonerInduction } from '../entity/PrisonerInduction';
import { StripSearch } from '../entity/StripSearch';
import { UnitConfig } from '../entity/UnitConfig';
import { broadcastUpdate } from '../ws';

const router = Router();

// Helper to broadcast after any data change
const broadcastChange = async () => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    
    const data = {
      prisoners: await ds.getRepository(Prisoner).find(),
      dailyTasks: await ds.getRepository(DailyTask).find(),
      musterConfirmations: await ds.getRepository(MusterConfirmation).find(),
      cellAlarms: await ds.getRepository(CellAlarm).find(),
      handovers: await ds.getRepository(HandoverSection).find(),
      searchTargets: await ds.getRepository(SearchTarget).find(),
      stripSearches: await ds.getRepository(StripSearch).find(),
      unitMaintenance: await ds.getRepository(UnitMaintenance).find(),
      prisonerInductions: await ds.getRepository(PrisonerInduction).find(),
      timestamp: new Date().toISOString(),
    };
    broadcastUpdate(data);
  } catch (e) {
    console.error('Broadcast error:', e);
  }
};

// Create a shared DataSource
const getDataSource = () => new DataSource({
  type: 'sqljs',
  location: 'prison_muster.sql',
  autoSave: true,
  synchronize: true,
  entities: [
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
  ],
});

// ==================== PRISONERS ====================

router.get('/prisoners', async (_req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(Prisoner);
    const prisoners = await repo.find();
    res.json(prisoners);
  } catch (error) {
    console.error('Error fetching prisoners:', error);
    res.status(500).json({ error: 'Failed to fetch prisoners' });
  }
});

router.get('/prisoners/:unitId', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(Prisoner);
    const prisoners = await repo.findBy({ unitId: req.params.unitId });
    res.json(prisoners);
  } catch (error) {
    console.error('Error fetching prisoners:', error);
    res.status(500).json({ error: 'Failed to fetch prisoners' });
  }
});

router.post('/prisoners', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(Prisoner);
    const prisoner = repo.create(req.body);
    await repo.save(prisoner);
    res.status(201).json(prisoner);
  } catch (error) {
    console.error('Error creating prisoner:', error);
    res.status(500).json({ error: 'Failed to create prisoner' });
  }
});

router.put('/prisoners/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(Prisoner);
    const prisoner = await repo.findOneBy({ id: req.params.id });
    if (!prisoner) {
      res.status(404).json({ error: 'Prisoner not found' });
      return;
    }
    Object.assign(prisoner, req.body);
    await repo.save(prisoner);
    res.json(prisoner);
  } catch (error) {
    console.error('Error updating prisoner:', error);
    res.status(500).json({ error: 'Failed to update prisoner' });
  }
});

router.delete('/prisoners/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(Prisoner);
    const result = await repo.delete(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error deleting prisoner:', error);
    res.status(500).json({ error: 'Failed to delete prisoner' });
  }
});

// ==================== DAILY TASKS ====================

router.get('/tasks', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(DailyTask);
    const { unitId, date } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    if (date) where.date = date as string;
    const tasks = await repo.findBy(where);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(DailyTask);
    const task = repo.create(req.body);
    await repo.save(task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(DailyTask);
    const task = await repo.findOneBy({ id: req.params.id });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    Object.assign(task, req.body);
    await repo.save(task);
    broadcastChange();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.post('/tasks/bulk', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(DailyTask);
    const { tasks } = req.body;
    for (const task of tasks) {
      const existing = await repo.findOneBy({ id: task.id });
      if (existing) {
        Object.assign(existing, task);
        await repo.save(existing);
      } else {
        const newTask = repo.create(task);
        await repo.save(newTask);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating tasks:', error);
    res.status(500).json({ error: 'Failed to bulk update tasks' });
  }
});

// ==================== MUSTER CONFIRMATIONS ====================

router.get('/muster', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(MusterConfirmation);
    const { unitId, date } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    if (date) where.date = date as string;
    const muster = await repo.findBy(where);
    res.json(muster);
  } catch (error) {
    console.error('Error fetching muster:', error);
    res.status(500).json({ error: 'Failed to fetch muster' });
  }
});

router.post('/muster', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(MusterConfirmation);
    const { unitId, date } = req.body;
    // Check if exists
    const existing = await repo.findOneBy({ unitId, date });
    if (existing) {
      Object.assign(existing, req.body);
      await repo.save(existing);
      broadcastChange();
      res.json(existing);
    } else {
      // Generate ID if not provided
      const musterData = {
        ...req.body,
        id: req.body.id || `muster-${unitId}-${date}`
      };
      const muster = repo.create(musterData);
      await repo.save(muster);
      broadcastChange();
      res.status(201).json(muster);
    }
  } catch (error) {
    console.error('Error saving muster:', error);
    res.status(500).json({ error: 'Failed to save muster' });
  }
});

// ==================== CELL ALARMS ====================

router.get('/alarms', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(CellAlarm);
    const { unitId, weekKey } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    if (weekKey) where.weekKey = weekKey as string;
    const alarms = await repo.findBy(where);
    res.json(alarms);
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
});

router.post('/alarms', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(CellAlarm);
    const alarm = repo.create(req.body);
    await repo.save(alarm);
    broadcastChange();
    res.status(201).json(alarm);
  } catch (error) {
    console.error('Error creating alarm:', error);
    res.status(500).json({ error: 'Failed to create alarm' });
  }
});

router.put('/alarms/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(CellAlarm);
    const alarm = await repo.findOneBy({ id: req.params.id });
    if (!alarm) {
      res.status(404).json({ error: 'Alarm not found' });
      return;
    }
    Object.assign(alarm, req.body);
    await repo.save(alarm);
    broadcastChange();
    res.json(alarm);
  } catch (error) {
    console.error('Error updating alarm:', error);
    res.status(500).json({ error: 'Failed to update alarm' });
  }
});

router.post('/alarms/bulk', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(CellAlarm);
    const { alarms } = req.body;
    for (const alarm of alarms) {
      const existing = await repo.findOneBy({ id: alarm.id });
      if (existing) {
        Object.assign(existing, alarm);
        await repo.save(existing);
      } else {
        const newAlarm = repo.create(alarm);
        await repo.save(newAlarm);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error bulk updating alarms:', error);
    res.status(500).json({ error: 'Failed to bulk update alarms' });
  }
});

// ==================== HANDOVER ====================

router.get('/handover', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(HandoverSection);
    const { unitId, date } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    if (date) where.date = date as string;
    const handovers = await repo.findBy(where);
    res.json(handovers);
  } catch (error) {
    console.error('Error fetching handover:', error);
    res.status(500).json({ error: 'Failed to fetch handover' });
  }
});

router.post('/handover', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(HandoverSection);
    const { unitId, date } = req.body;
    // Check if exists
    const existing = await repo.findOneBy({ unitId, date });
    if (existing) {
      Object.assign(existing, req.body);
      await repo.save(existing);
      broadcastChange();
      res.json(existing);
    } else {
      const handover = repo.create(req.body);
      await repo.save(handover);
      broadcastChange();
      res.status(201).json(handover);
    }
  } catch (error) {
    console.error('Error saving handover:', error);
    res.status(500).json({ error: 'Failed to save handover' });
  }
});

// ==================== SEARCH TARGETS ====================

router.get('/searches', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(SearchTarget);
    const { unitId, date } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    if (date) where.date = date as string;
    const searches = await repo.findBy(where);
    res.json(searches);
  } catch (error) {
    console.error('Error fetching searches:', error);
    res.status(500).json({ error: 'Failed to fetch searches' });
  }
});

router.post('/searches', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(SearchTarget);
    const { unitId, date } = req.body;
    // Clear existing for unit+date
    await repo.delete({ unitId, date });
    // Create new
    const searches = req.body.targets || [req.body];
    for (const search of searches) {
      const target = repo.create(search);
      await repo.save(target);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving searches:', error);
    res.status(500).json({ error: 'Failed to save searches' });
  }
});

router.delete('/searches', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(SearchTarget);
    const { unitId, date } = req.query;
    await repo.delete({ unitId: unitId as string, date: date as string });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting searches:', error);
    res.status(500).json({ error: 'Failed to delete searches' });
  }
});

// ==================== STRIP SEARCHES ====================

router.get('/strip-search', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(StripSearch);
    const { unitId, date } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    if (date) where.date = date as string;
    const searches = await repo.findBy(where);
    res.json(searches);
  } catch (error) {
    console.error('Error fetching strip searches:', error);
    res.status(500).json({ error: 'Failed to fetch strip searches' });
  }
});

router.post('/strip-search', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(StripSearch);
    const { unitId, date } = req.body;
    // Check if exists
    const existing = await repo.findOneBy({ unitId, date });
    if (existing) {
      Object.assign(existing, req.body);
      await repo.save(existing);
      res.json(existing);
    } else {
      const search = repo.create(req.body);
      await repo.save(search);
      res.status(201).json(search);
    }
  } catch (error) {
    console.error('Error saving strip search:', error);
    res.status(500).json({ error: 'Failed to save strip search' });
  }
});

// ==================== MAINTENANCE ====================

router.get('/maintenance', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitMaintenance);
    const { unitId } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    const maintenance = await repo.findBy(where);
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
});

router.post('/maintenance', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitMaintenance);
    const maintenance = repo.create(req.body);
    await repo.save(maintenance);
    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ error: 'Failed to create maintenance' });
  }
});

router.put('/maintenance/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitMaintenance);
    const maintenance = await repo.findOneBy({ id: req.params.id });
    if (!maintenance) {
      res.status(404).json({ error: 'Maintenance not found' });
      return;
    }
    Object.assign(maintenance, req.body);
    await repo.save(maintenance);
    res.json(maintenance);
  } catch (error) {
    console.error('Error updating maintenance:', error);
    res.status(500).json({ error: 'Failed to update maintenance' });
  }
});

router.delete('/maintenance/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitMaintenance);
    await repo.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance:', error);
    res.status(500).json({ error: 'Failed to delete maintenance' });
  }
});

// ==================== INDUCTIONS ====================

router.get('/inductions', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(PrisonerInduction);
    const { unitId } = req.query;
    const where: any = {};
    if (unitId) where.unitId = unitId as string;
    const inductions = await repo.findBy(where);
    res.json(inductions);
  } catch (error) {
    console.error('Error fetching inductions:', error);
    res.status(500).json({ error: 'Failed to fetch inductions' });
  }
});

router.post('/inductions', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(PrisonerInduction);
    const induction = repo.create(req.body);
    await repo.save(induction);
    res.status(201).json(induction);
  } catch (error) {
    console.error('Error creating induction:', error);
    res.status(500).json({ error: 'Failed to create induction' });
  }
});

router.put('/inductions/:id', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(PrisonerInduction);
    const induction = await repo.findOneBy({ id: req.params.id });
    if (!induction) {
      res.status(404).json({ error: 'Induction not found' });
      return;
    }
    Object.assign(induction, req.body);
    await repo.save(induction);
    res.json(induction);
  } catch (error) {
    console.error('Error updating induction:', error);
    res.status(500).json({ error: 'Failed to update induction' });
  }
});

// ==================== SYNC ENDPOINT ====================

router.get('/sync', async (_req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();

    const prisoners = await ds.getRepository(Prisoner).find();
    const tasks = await ds.getRepository(DailyTask).find();
    const muster = await ds.getRepository(MusterConfirmation).find();
    const alarms = await ds.getRepository(CellAlarm).find();
    const handovers = await ds.getRepository(HandoverSection).find();
    const searches = await ds.getRepository(SearchTarget).find();
    const stripSearches = await ds.getRepository(StripSearch).find();
    const maintenance = await ds.getRepository(UnitMaintenance).find();
    const inductions = await ds.getRepository(PrisonerInduction).find();

    res.json({
      prisoners,
      dailyTasks: tasks,
      musterConfirmations: muster,
      cellAlarms: alarms,
      handovers,
      searchTargets: searches,
      stripSearches,
      unitMaintenance: maintenance,
      prisonerInductions: inductions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// ==================== AUDIT ENTRIES ====================

router.get('/audit', async (_req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    // For now, return empty - audit is stored in frontend localStorage
    res.json([]);
  } catch (error) {
    console.error('Error fetching audit entries:', error);
    res.status(500).json({ error: 'Failed to fetch audit entries' });
  }
});

router.post('/audit', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    // For now, just acknowledge - audit is stored in frontend localStorage
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving audit entry:', error);
    res.status(500).json({ error: 'Failed to save audit entry' });
  }
});

// ==================== UNIT CONFIG ====================

router.get('/unit-config/:unitId', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitConfig);
    const config = await repo.findOneBy({ unitId: req.params.unitId });
    if (!config) {
      // Return default empty config
      res.json({ unitId: req.params.unitId, cells: [], facilities: [] });
      return;
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching unit config:', error);
    res.status(500).json({ error: 'Failed to fetch unit config' });
  }
});

router.post('/unit-config', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitConfig);
    const { unitId, cells, facilities } = req.body;
    
    const existing = await repo.findOneBy({ unitId });
    if (existing) {
      existing.cells = cells || [];
      existing.facilities = facilities || [];
      existing.updatedAt = new Date();
      await repo.save(existing);
      res.json(existing);
    } else {
      const config = repo.create({ unitId, cells: cells || [], facilities: facilities || [] });
      await repo.save(config);
      res.status(201).json(config);
    }
  } catch (error) {
    console.error('Error saving unit config:', error);
    res.status(500).json({ error: 'Failed to save unit config' });
  }
});

router.delete('/unit-config/:unitId', async (req, res: Response) => {
  try {
    const ds = getDataSource();
    if (!ds.isInitialized) await ds.initialize();
    const repo = ds.getRepository(UnitConfig);
    await repo.delete({ unitId: req.params.unitId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting unit config:', error);
    res.status(500).json({ error: 'Failed to delete unit config' });
  }
});

export default router;
