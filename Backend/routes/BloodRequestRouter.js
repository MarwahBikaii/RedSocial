const express = require('express');
const router = express.Router();
const {authenticate}= require('../middlewares/authMiddleware')
const {createBloodRequest,searchNearBloodRequests,getBloodRequestById,getAllBloodRequests} = require('../controllers/bloodRequestController');

// Route to create a Blood Request
router.post('/create', authenticate, createBloodRequest);

router.get('/', authenticate, getAllBloodRequests);

router.get('/search', authenticate, searchNearBloodRequests);


router.get('/:id', authenticate, getBloodRequestById);



module.exports = router;
