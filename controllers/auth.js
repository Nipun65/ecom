const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const sibTransport = require('nodemailer-sendinblue-transport');
const transporter = nodemailer.createTransport(
  new sibTransport({
    apiKey:
      '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',
  })
);

exports.getLogInPage = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = req.flash('error')[0];
  } else message = null;
  res.render('auth/login', {
    isAuthenticated: req.session.isLoggedIn,
    path: '/login',
    pageTitle: 'Login',
    errorMessages: message,
    oldInput: {
      email: '',
      password: '',
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  console.log(errors);
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessages: errors.array()[0].msg,
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: errors.array(),
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.user = user;
            req.session.isLoggedIn = true;
            req.session.save((err) => {
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            // errorMessages: errors.array()[0].msg,
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: errors.array(),
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSignUpPage = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessages: req.flash('error')[0],
    oldInput: {
      email: '',
      password: '',
      confirmpassword: '',
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmpassword;
  console.log(confirmPassword);
  console.log(req.body.confirmpassword);
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessages: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmpassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const user = new User({
        email: email,
        password: hashPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      res.redirect('/login');
      transporter
        .sendMail({
          to: email,
          from: 'shop@nodecomplete.com',
          subject: 'SignUp succedded!',
          html: '<h1>You successfully signed up!</h1>',
        })
        .catch((err) => {
          console.log(err);
        });
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  console.log(message);
  if (message.length > 0) {
    message = req.flash('error')[0];
  } else message = null;
  res.render('auth/reset', {
    path: '/reset-password',
    pageTitle: 'Reset Password',
    errorMessages: message,
  });
};
exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset-password');
    }
    const token = buffer.toString('hex');
    console.log(req.body.email);
    User.findOne({ email: req.body.email })
      .then((user) => {
        console.log(user);
        if (!user) {
          req.flash('error', 'No account found with this email');
          return res.redirect('reset-password');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        console.log(user);
        return user.save();
      })
      .then((result) => {
        res.redirect('/');
        console.log(req.body.email);
        transporter
          .sendMail({
            to: req.body.email,
            from: 'shop@nodecomplete.com',
            subject: 'Reset Password!',
            html: `<p>reset password link!</p><p>Click this <a href="http://localhost:3000/reset-password/${token}">link</a> to set a new password</p>`,
          })
          .then((result) => {
            console.log('sent?');
            console.log(result);
          })
          .catch((err) => {
            console.log('any error');
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      console.log(user);

      let message = req.flash('error');
      console.log(message);
      if (message.length > 0) {
        message = req.flash('error')[0];
      } else message = null;
      console.log('new password user');
      console.log(user);
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessages: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const token = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect('/login');
    });
};
