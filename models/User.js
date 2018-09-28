const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongoDbErroHandler = require('mongoose-mongodb-errors');
const passportlocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowerCase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  }
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);

  return `https://gravatar.com/avatar/${hash}?s=200`;
});
userSchema.plugin(passportlocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongoDbErroHandler);

module.exports = mongoose.model('User', userSchema);
