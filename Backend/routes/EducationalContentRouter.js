const express= require('express')
const router=express.Router();
const {getContent } = require('../controllers/ContentController');
const {authenticate}= require('../middlewares/authMiddleware')

router.get('/', getContent); 


module.exports = router; 