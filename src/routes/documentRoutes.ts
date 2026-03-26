import { Router } from 'express';
import * as documentController from '../controllers/documentController.js';

const router = Router();

router.post('/documents', documentController.createDocument);
router.get('/search', documentController.searchDocuments);
router.get('/analytics/most-edited', documentController.getMostEdited);
router.get('/analytics/tag-cooccurrence', documentController.getTagCooccurrence);
router.get('/documents/:slug', documentController.getDocumentBySlug);
router.put('/documents/:slug', documentController.updateDocument);
router.delete('/documents/:slug', documentController.deleteDocument);

export default router;
