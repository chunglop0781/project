const router = require('express').Router();

const tourController = require('../../controllers/client/tour.controller');

router.get('/', tourController.list);
// router.get('/create', tourController.create)
// router.get('/delete', tourController.delete)
// router.get('/edit', tourController.edit)

module.exports = router;