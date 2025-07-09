const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const path = require('path');
const Notice = require('../models/Notice');
const multer = require('multer');
const fs = require('fs');
const adminAuth = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');




// Storage setup
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/notices/');
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext);
//   },
// });

// const upload = multer({ storage });



// Ensure uploads directory exists
const uploadDir = 'uploads/notices/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (
    file.fieldname === 'file' &&
    ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Add notice
router.post('/add', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]), adminAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const newNotice = new Notice({
      title,
      description: description || '',
      image: req.files?.image?.[0]?.filename || null,
      file: req.files?.file?.[0]?.filename || null,
    });

    await newNotice.save();
    res.status(201).json({ message: 'Notice added successfully', notice: newNotice });
  } catch (err) {
    console.error('Error adding notice:', err);
    res.status(500).json({ message: 'Failed to add notice' });
  }
});


router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
    });
  }

  return res.status(401).json({ message: 'Login failed' });
});

router.get('/assignments', adminAuth, async (req, res, next) => {
  try {
    const assignments = await Assignment.find().populate('studentId', 'fullName email');
    res.status(200).json(assignments);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/assignments/:id/remark
router.patch('/assignments/:id/remark', adminAuth, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const { remark } = req.body;

    const updated = await Assignment.findByIdAndUpdate(
      assignmentId,
      { remarks: remark },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json({ message: 'Remark added', assignment: updated });
  } catch (error) {
    next(error);
  }
});

// routes/admin.js or similar


router.get('/users', adminAuth, async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});


router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// router.delete('/assignments/:id', async (req, res) => {
//   try {
//     await Assignment.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Assignment deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to delete assignment' });
//   }
// });

router.delete('/assignments/:id', adminAuth, async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// DELETE Notice by ID
router.delete('/notices/:id', adminAuth, async (req, res) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (err) {
    console.error('Error deleting notice:', err);
    res.status(500).json({ message: 'Failed to delete notice' });
  }
});

// router.get('/notices/all/admin', adminAuth, async (req, res) => {
//   try {
//     const notices = await Notice.find().sort({ createdAt: -1 });
//     res.status(200).json(notices);
//   } catch (err) {
//     console.error('Error fetching notices for student:', err);
//     res.status(500).json({ message: 'Failed to load notices' });
//   }
// });
router.get('/notices/all/admin', adminAuth, async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (err) {
    console.error('Error fetching notices for admin:', err);
    res.status(500).json({ message: 'Failed to load notices' });
  }
});
module.exports = router;



