const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const axios = require('axios');

const PORT = 3000;
const SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Google's test secret key

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let waitingUser = null;
let reports = [];

// CAPTCHA verification
app.post('/verify-captcha', async (req, res) => {
  const token = req.body.token;
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`
    );
    res.json({ success: response.data.success });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

function pair(socket1, socket2) {
  socket1.partner = socket2;
  socket2.partner = socket1;
  socket1.emit('partner-found');
  socket2.emit('partner-found');
  console.log(`Paired ${socket1.id} with ${socket2.id}`);
}

function disconnect(socket) {
  if (socket.partner) {
    socket.partner.emit('partner-disconnected');
    socket.partner.partner = null;
    socket.partner = null;
  }
}

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`);

  socket.on('ready', () => {
    if (waitingUser && waitingUser !== socket && !waitingUser.disconnected) {
      pair(socket, waitingUser);
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on('offer', data => {
    if (socket.partner) {
      socket.partner.emit('offer', data);
    }
  });

  socket.on('answer', data => {
    if (socket.partner) {
      socket.partner.emit('answer', data);
    }
  });

  socket.on('ice-candidate', data => {
    if (socket.partner) {
      socket.partner.emit('ice-candidate', data);
    }
  });

  socket.on('message', msg => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('next', () => {
    disconnect(socket);
    if (waitingUser === socket) waitingUser = null;
    socket.emit('partner-disconnected');

    if (waitingUser && waitingUser !== socket && !waitingUser.disconnected) {
      pair(socket, waitingUser);
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on('report', reason => {
    if (socket.partner) {
      reports.push({
        reporter: socket.id,
        reported: socket.partner.id,
        reason,
        time: new Date().toISOString()
      });
      console.log('Report logged:', reports[reports.length - 1]);
      socket.emit('report-confirmed');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (waitingUser === socket) waitingUser = null;
    disconnect(socket);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
