const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  file: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notice', noticeSchema);
