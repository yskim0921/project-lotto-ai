// middleware/auth.js
function checkAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error/403');
}

module.exports = { checkAdmin };
