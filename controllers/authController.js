const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const crypto = require('crypto');
const mail = require('../handlers/mail');

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

exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    req.flash('error', 'This email address does not exist, please try again');
    return res.redirect('back');
  }

  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpire = Date.now() + 3600000;

  await user.save();

  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

  await mail.sendMail({
    from: `Jorge AC - <jardila@qarbono.com>`,
    to: user.email,
    filename: 'password-reset',
    subject: 'Reset your password',
    resetURL
  });

  req.flash('success', `You have been emailed a password reset link to ${resetURL}`);

  res.redirect(`/login`);
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Password reset is not valid or it has expired');
    return res.redirect('/login');
  }

  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }

  req.flash('error', 'Your passwords do not match, please try again');
  return res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'The token you provided is not valid or it has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);

  req.flash('success', 'Your password has been reset');
  res.redirect('/');
};
