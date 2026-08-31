const router = require("express").Router();
const generateController = require("../controllers/generate.controller");

router.post("/", generateController.generate);
router.post("/tts", (req, res) => {
    req.body.type = 'audio';
    generateController.generate(req, res);
});

module.exports = router;