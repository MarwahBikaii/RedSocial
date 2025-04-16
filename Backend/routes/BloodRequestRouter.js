const express = require('express');
const router = express.Router();
const {authenticate}= require('../middlewares/authMiddleware')
const {createBloodRequest,deleteBloodRequest,assignDonorToRequest,updateBloodRequest,searchNearBloodRequests,getBloodRequestById,getAllBloodRequests,getMyRequests} = require('../controllers/bloodRequestController');

// Route to create a Blood Request
router.post('/create', authenticate, createBloodRequest);

router.get('/', getAllBloodRequests);

router.get("/myRequests", authenticate, getMyRequests);


router.get('/search', async (req, res) => {
  try {
    // Extract params from `req.query` (for GET requests)
    const { latitude: lat, longitude: lng, radius } = req.query;
    
    // Call controller with proper arguments
    const results = await searchNearBloodRequests(lat, lng, radius);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', authenticate, getBloodRequestById);

router.put("/:requestId",authenticate, updateBloodRequest); // PUT for updating a blood request

router.post("/assign-donor", authenticate, assignDonorToRequest);

router.delete("/:requestId", authenticate, deleteBloodRequest);



module.exports = router;
