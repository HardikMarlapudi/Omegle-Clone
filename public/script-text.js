const socket = io();

const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const nextBtn = document.getElementById('nextBtn');
const reportBtn = document.getElementById('reportBtn');

function appendMessage(text, sender = 'System') {
  const div = document.createElement('div');
  const span = document.createElement('span');
  span.textContent = `${sender}: `;
  span.className = sender === 'You' ? 'you' : sender === 'Stranger' ? 'stranger' : '';
  div.appendChild(span);
  div.appendChild(document.createTextNode(text));
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function resetConnection() {
  input.disabled = true;
  sendBtn.disabled = true;
  nextBtn.disabled = true;
  chat.innerHTML = 'Waiting for partner...';
}

socket.on('partner-found', () => {
  appendMessage('Partner found. Say hi!');
  input.disabled = false;
  sendBtn.disabled = false;
  nextBtn.disabled = false;
});

socket.on('message', msg => {
  appendMessage(msg, 'Stranger');
});

socket.on('partner-disconnected', () => {
  appendMessage('Stranger disconnected.');
  resetConnection();
});

socket.on('report-confirmed', () => {
  alert('User reported.');
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && input.value.trim()) {
    sendMessage();
  }
});

sendBtn.addEventListener('click', () => {
  if (input.value.trim()) {
    sendMessage();
  }
});

function sendMessage() {
  const msg = input.value.trim();
  appendMessage(msg, 'You');
  socket.emit('message', msg);
  input.value = '';
}

nextBtn.addEventListener('click', () => {
  socket.emit('next');
  resetConnection();
});

reportBtn.addEventListener('click', () => {
  const reason = prompt("Why are you reporting this user?");
  if (reason) {
    socket.emit('report', reason);
  }
});

function verifyCaptcha() {
  const token = grecaptcha.getResponse();

  fetch('/verify-captcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('captchaContainer').style.display = 'none';
        document.getElementById('chatUI').style.display = 'block';
        socket.emit('ready');
      } else {
        alert('CAPTCHA failed.');
      }
    })
    .catch(() => alert('CAPTCHA check failed.'));
}
