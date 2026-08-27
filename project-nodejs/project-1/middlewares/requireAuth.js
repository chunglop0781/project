// middlewares/requireAuth.js
module.exports = function(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    req.session.redirectTo = req.originalUrl;
    res.redirect('/login');
};