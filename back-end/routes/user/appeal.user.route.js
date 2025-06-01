import express from 'express';
import { 
    viewAllAppeals, 
    viewAppeal, 
    createAppeal, 
    updateAppeal, 
    deleteAppeal 
} from '../../controllers/user/appeal.user.controller.js';
const router = express.Router();

router.get('/', viewAllAppeals);
router.get('/:id', viewAppeal);
router.post('/', createAppeal);
router.patch('/:id', updateAppeal);
router.delete('/:id', deleteAppeal);


export default router;
