const passport = require('passport');

exports.login = passport.authenticate('local', {
  failureFlash: 'Failed Login!',
  failureRedirect: '/Login',
  successFlash: 'You are now logged in!',
  successRedirect: '/'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash('error', 'You must be logged in to perform this action');
  res.redirect('/login');
};
