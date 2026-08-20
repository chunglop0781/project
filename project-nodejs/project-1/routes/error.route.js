const express = require('express');
const router = express.Router();

const errorController = require('../controllers/error/error.controller');

router.use(errorController.notFound);

module.exports = router;