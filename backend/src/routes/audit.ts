import { Router, Response } from 'express';
import { DataSource } from 'typeorm';
import { AuditRecord } from '../entity/AuditRecord';
import fs from 'fs';
import path from 'path';

const router = Router();

const dataSource = new DataSource({
  type: 'sqljs',
  location: 'prison_muster.sql',
  autoSave: true,
  entities: [AuditRecord],
});

const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

router.post('/capture', async (req: any, res: Response) => {
  try {
    const { userId, unitId, pageName, htmlSnapshot, cssSnapshot, jsonState, screenshotBase64 } = req.body;
    if (!htmlSnapshot && !screenshotBase64) {
      res.status(400).json({ error: 'HTML snapshot or screenshot required' });
      return;
    }
    if (!dataSource.isInitialized) { await dataSource.initialize(); }
    const repository = dataSource.getRepository(AuditRecord);
    const captureId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    let pngPath = '';
    let screenshotUrl = '';
    if (screenshotBase64) {
      try {
        const base64Data = screenshotBase64.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        pngPath = path.join(screenshotsDir, captureId + '.png');
        fs.writeFileSync(pngPath, buffer);
        screenshotUrl = '/api/screenshots/' + captureId + '.png';
      } catch (e) { console.error('Screenshot save error:', e); }
    }
    const auditRecord = repository.create({
      userId: userId || req.user?.id,
      unitId,
      pageName,
      htmlSnapshot: htmlSnapshot || '',
      cssSnapshot: cssSnapshot || '',
      jsonState: jsonState || {},
      screenshotUrl: screenshotUrl,
      pdfUrl: null,
    });
    await repository.save(auditRecord);
    res.status(201).json({ id: auditRecord.id, message: 'Audit record created', screenshotUrl: auditRecord.screenshotUrl });
  } catch (error) {
    console.error('Error capturing audit:', error);
    res.status(500).json({ error: 'Failed to capture audit record' });
  }
});

router.get('/', async (req, res: Response) => {
  try {
    if (!dataSource.isInitialized) { await dataSource.initialize(); }
    const repository = dataSource.getRepository(AuditRecord);
    const records = await repository.find({ order: { timestamp: 'DESC' }, take: 100 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

export default router;
