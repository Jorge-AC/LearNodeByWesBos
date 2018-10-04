const nodemailer = require('nodemailer');
const promisify = require('es6-promisify');
const htmlToText = require('html-to-text');
const juice = require('juice');
const pug = require('pug');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const generateHtml = options => {
  const html = pug.renderFile(`${__dirname}/../views/email/${options.filename}.pug`, options);
  const inline = juice(html);

  return inline;
};

exports.sendMail = async options => {
  const html = generateHtml(options);
  const sendMail = promisify(transport.sendMail, transport);
  const text = htmlToText.fromString(html);

  const mailConfig = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html,
    text
  };

  await sendMail(mailConfig);
};
