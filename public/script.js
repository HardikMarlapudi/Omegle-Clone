const socket = io();

let localStream;
let peerConnection;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
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

function createPeerConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = e => {
    console.log('[ontrack] Received remote stream');
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', e.candidate);
    }
  };

  console.log('[createPeerConnection] Setup complete');
}

function resetConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteVideo.srcObject = null;
  input.disabled = true;
  sendBtn.disabled = true;
  nextBtn.disabled = true;
  chat.innerHTML = 'Waiting for partner...';
}

socket.on('partner-found', async () => {
  appendMessage('Partner found. Setting up video...');
  createPeerConnection();

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
    console.log('[partner-found] Offer sent');
  } catch (err) {
    console.error('Error during offer creation:', err);
  }

  input.disabled = false;
  sendBtn.disabled = false;
  nextBtn.disabled = false;
});

socket.on('offer', async offer => {
  createPeerConnection();

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
    console.log('[offer] Answer sent');
  } catch (err) {
    console.error('Error during offer handling:', err);
  }

  input.disabled = false;
  sendBtn.disabled = false;
  nextBtn.disabled = false;
});

socket.on('answer', async answer => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('[answer] Remote description set');
  } catch (err) {
    console.error('Error during answer handling:', err);
  }
});

socket.on('ice-candidate', async candidate => {
  try {
    await peerConnection.addIceCandidate(candidate);
    console.log('[ice-candidate] Added');
  } catch (err) {
    console.error('Failed to add ICE candidate:', err);
  }
});

socket.on('message', msg => {
  appendMessage(msg, 'Stranger');
});

socket.on('report-confirmed', () => {
  alert('User reported.');
});

socket.on('partner-disconnected', () => {
  appendMessage('Stranger disconnected.');
  resetConnection();
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
        startVideo();
      } else {
        alert('CAPTCHA failed. Try again.');
      }
    })
    .catch(() => alert('CAPTCHA request failed.'));
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;
      localVideo.srcObject = stream;
      chat.innerHTML = 'Waiting for partner...';
      socket.emit('ready');
      console.log('[startVideo] Local stream started');
    })
    .catch(err => {
      alert('Could not access camera/microphone');
      console.error(err);
    });
}
