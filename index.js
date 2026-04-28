const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public')); // serve frontend

// create uploads folder
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// multer config
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// DATA
let events = [];
let registrations = [];

// ROUTES

// get all events
app.get('/api/events', (req, res) => {
  res.json(events);
});

// get single event
app.get('/api/events/:id', (req, res) => {
  const event = events.find(e => e.id == req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  res.json(event);
});

// create event
app.post('/api/events', upload.single('eventImage'), (req, res) => {
  const { title, date, description } = req.body;

  const newEvent = {
    id: Date.now(),
    title,
    date,
    description,
    imagePath: req.file ? `/uploads/${req.file.filename}` : ''
  };

  events.push(newEvent);
  res.json(newEvent);
});

// delete event
app.delete('/api/events/:id', (req, res) => {
  const id = parseInt(req.params.id);

  events = events.filter(e => e.id !== id);
  registrations = registrations.filter(r => r.eventId !== id);

  res.json({ message: 'Deleted' });
});

// join event
app.post('/api/events/:id/join', (req, res) => {
  const { userName } = req.body;

  registrations.push({
    eventId: parseInt(req.params.id),
    userName
  });

  res.json({ message: 'Joined' });
});

// get registrations (admin)
app.get('/api/registrations', (req, res) => {
  res.json(registrations);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});