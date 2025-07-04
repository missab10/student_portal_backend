// const mongoose = require('mongoose');

// const assignmentSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   pdf: { type: String, required: true },
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Assignment', assignmentSchema);


const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  pdf: String,
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
