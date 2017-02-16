module.exports = function(req, res, next) {
    if (!req.session.role) {
        res.redirect('/login');
    }
    next();
}