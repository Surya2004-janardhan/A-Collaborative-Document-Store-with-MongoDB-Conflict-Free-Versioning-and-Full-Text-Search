import { Router } from 'express';
import * as documentController from '../controllers/documentController.js';

const router = Router();

router.post('/', documentController.createDocument);
router.get('/search', documentController.searchDocuments);
router.get('/analytics/most-edited', documentController.getMostEdited);
router.get('/analytics/tag-cooccurrence', documentController.getTagCooccurrence);
router.get('/:slug', documentController.getDocumentBySlug);
router.put('/:slug', documentController.updateDocument);
router.delete('/:slug', documentController.deleteDocument);

export default router;
