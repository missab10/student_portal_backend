const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Notice = require('../models/Notice');
// Storage config for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'Uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Register Route
router.post('/', async (req, res, next) => {
  try {
    const { fullName, email, age, phoneNumber, password } = req.body;

    if (!fullName || !email || !age || !phoneNumber || !password) {
      res.status(400);
      throw new Error('All fields are required');
    }

    const existing = await Student.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error('Student already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await Student.create({
      fullName,
      email,
      age,
      phoneNumber,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Student registered', student });
  } catch (error) {
    next(error);
  }
});

// Login Route
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const student = await Student.findOne({ email });
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    res.status(200).json({
      message: 'Login successful',
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email
      }
    });
  } catch (error) {
    next(error);
  }
});

// Assignment Route
router.post('/assignment', upload.single('pdf'), async (req, res, next) => {
  try {
    const { title, description, studentId } = req.body;
    const pdfFilePath = req.file ? req.file.path : null;

    if (!title || !studentId || !pdfFilePath) {
      res.status(400);
      throw new Error('Title, student ID, and PDF are required');
    }

    // Validate studentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      throw new Error('Invalid student ID');
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    const assignment = await Assignment.create({
      title,
      description,
      studentId,
      pdf: pdfFilePath
    });

    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    next(error);
  }
});


// 📄 View Assignments by Student ID
router.get('/assignments/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      throw new Error('Invalid student ID');
    }

    const assignments = await Assignment.find({ studentId }).sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    next(error);
  }
});


// router.get('/:id', async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id).select('-password');
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found' });
//     }
//     res.json(student);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid student ID' });
  }

  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



router.put('/edit-profile/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, age, phoneNumber, currentPassword, newPassword } = req.body;

    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid student ID');
    }

    // Check if student exists
    const student = await Student.findById(id);
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Validate required fields
    if (!fullName || !email || !age || !phoneNumber) {
      res.status(400);
      throw new Error('Full name, email, age, and phone number are required');
    }

    // Check if email is already taken by another student
    if (email !== student.email) {
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        res.status(400);
        throw new Error('Email already registered by another student');
      }
    }

    // Prepare update data
    const updateData = {
      fullName,
      email,
      age,
      phoneNumber
    };

    // Handle password update if provided
    if (newPassword) {
      if (!currentPassword) {
        res.status(400);
        throw new Error('Current password is required to set a new password');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
      if (!isCurrentPasswordValid) {
        res.status(401);
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedNewPassword;
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    next(error);
  }
});


router.get('/notices/all', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (err) {
    console.error('Error fetching notices for student:', err);
    res.status(500).json({ message: 'Failed to load notices' });
  }
});


module.exports = router;