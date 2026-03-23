import { Router } from 'express';
import * as documentController from '../controllers/documentController';

const router = Router();

router.post('/', documentController.createDocument);
router.get('/:slug', documentController.getDocumentBySlug);
router.put('/:slug', documentController.updateDocument);
router.delete('/:slug', documentController.deleteDocument);

export default router;
 Riverside
