// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const studentRoutes = require('./routes/studentRoutes');
// const { errorHandler } = require('./middleware/errorMiddleware');
// const cors = require('cors');

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('✅ MongoDB connected'))
// .catch((err) => {
//   console.error('❌ MongoDB connection error:', err.message);
//   process.exit(1);
// });

// app.use('/api/students', studentRoutes);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });


const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const studentRoutes = require('./routes/studentRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
