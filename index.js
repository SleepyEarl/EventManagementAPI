const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

let events = [];
let registrations = [];

// ROLE SELECTION
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5;">
        <h1 style="color: #1c1e21;">Event Management System</h1>
        <p>Please select your portal to continue:</p>
        <div style="display: flex; gap: 20px;">
          <a href="/user-portal" style="text-decoration: none; padding: 20px 40px; background: #007bff; color: white; border-radius: 10px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">USER PORTAL</a>
          <a href="/admin" style="text-decoration: none; padding: 20px 40px; background: #343a40; color: white; border-radius: 10px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">ADMIN PORTAL</a>
        </div>
      </body>
    </html>
  `);
});


// USER PORTAL
app.get('/user-portal', (req, res) => {
  const eventListHtml = events
    .map(
      (event) => `
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; gap: 20px; align-items: center; background: white;">
      <img src="${
        event.imagePath || 'https://via.placeholder.com/150x100'
      }" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px;">
      <div style="flex-grow: 1;">
        <h2 style="margin: 0;">${event.title}</h2>
        <p><strong>Date:</strong> ${event.date}</p>
        <a href="/view-event/${event.id}">
          <button style="cursor:pointer; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px;">View & Join</button>
        </a>
      </div>
    </div>
  `
    )
    .join('');

  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 800px; margin: auto; padding: 20px; background: #f8f9fa;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h1>Explore Events</h1>
          <a href="/" style="text-decoration: none; color: #666;">Logout</a>
        </div>
        <hr>
        ${eventListHtml || '<p>No events available right now.</p>'}
      </body>
    </html>
  `);
});

app.get('/view-event/:id', (req, res) => {
  const event = events.find((e) => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).send('Event Not Found');

  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 800px; margin: auto; padding: 40px;">
        <a href="/user-portal" style="color: #007bff; text-decoration: none;">← Back to Events</a>
        <div style="margin-top: 20px;">
          ${
            event.imagePath
              ? `<img src="${event.imagePath}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">`
              : ''
          }
          <h1>${event.title}</h1>
          <p style="color: #666;">${event.date}</p>
          <hr>
          <h3>Description</h3>
          <p style="line-height: 1.6;">${event.description}</p>
          
          <div style="background: #e9ecef; padding: 25px; border-radius: 10px; margin-top: 30px;">
            <h3>Ready to attend?</h3>
            <form action="/join-event/${
              event.id
            }" method="POST" style="display: flex; gap: 10px;">
              <input type="text" name="userName" placeholder="Enter your name" required style="padding: 12px; flex-grow: 1; border-radius: 5px; border: 1px solid #ccc;">
              <button type="submit" style="background: #28a745; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-weight: bold;">JOIN EVENT</button>
            </form>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.post('/join-event/:id', (req, res) => {
  registrations.push({
    eventId: parseInt(req.params.id),
    userName: req.body.userName,
  });
  res.send(
    "<script>alert('Joined successfully!'); window.location.href='/user-portal';</script>"
  );
});


// ADMIN PORTAL
app.get('/admin', (req, res) => {
  const adminRows = events
    .map((event) => {
      const attendeeCount = registrations.filter(
        (r) => r.eventId === event.id
      ).length;
      const attendeeNames = registrations
        .filter((r) => r.eventId === event.id)
        .map((r) => r.userName)
        .join(', ');

      return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 15px;">
          <strong>${event.title}</strong><br>
          <small style="color: #28a745;">Attendees (${attendeeCount}): ${
        attendeeNames || 'None'
      }</small>
        </td>
        <td style="padding: 15px; text-align: right;">
          <form action="/admin/delete/${
            event.id
          }" method="POST" style="display: inline;">
            <button type="submit" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;" onclick="return confirm('Delete this event?')">Delete</button>
          </form>
        </td>
      </tr>
    `;
    })
    .join('');

  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 900px; margin: auto; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h1>Admin Management</h1>
          <a href="/" style="text-decoration: none; color: #666;">Exit Admin</a>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; margin-top: 20px;">
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; height: fit-content;">
            <h3>Create New Event</h3>
            <form action="/admin/create" method="POST" enctype="multipart/form-data" style="display: flex; flex-direction: column; gap: 10px;">
              <input type="text" name="title" placeholder="Event Title" required style="padding: 10px;">
              <input type="date" name="date" required style="padding: 10px;">
              <label style="font-size: 0.8em; color: #666;">Upload Banner:</label>
              <input type="file" name="eventImage" accept="image/*" required>
              <textarea name="description" placeholder="Event Description" rows="4" style="padding: 10px;"></textarea>
              <button type="submit" style="background: #343a40; color: white; padding: 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">PUBLISH EVENT</button>
            </form>
          </div>

          <div>
            <h3>Active Events & Rosters</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #eee;">
              <thead style="background: #eee;"><tr><th style="text-align: left; padding: 10px;">Event Details</th><th style="text-align: right; padding: 10px;">Actions</th></tr></thead>
              <tbody>${
                adminRows ||
                "<tr><td colspan='2' style='padding: 20px; text-align: center;'>No events created yet.</td></tr>"
              }</tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.post('/admin/create', upload.single('eventImage'), (req, res) => {
  const { title, date, description } = req.body;
  events.push({
    id: Date.now(),
    title,
    date,
    description,
    imagePath: req.file ? `/uploads/${req.file.filename}` : '',
  });
  res.redirect('/admin');
});

app.post('/admin/delete/:id', (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = events.find((e) => e.id === eventId);
  if (event && event.imagePath) {
    const fullPath = path.join(__dirname, event.imagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  events = events.filter((e) => e.id !== eventId);
  registrations = registrations.filter((r) => r.eventId !== eventId);
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
