const router = require('express').Router();
const requireAdmin = require('../../middlewares/requireAdmin');
const profileController = require('../../controllers/admin/profile.controller');

router.get('/profile', requireAdmin, profileController.detail);

router.post('/profile', requireAdmin, profileController.update);

router.post('/profile/password', requireAdmin, profileController.updatePassword);

module.exports = router;
