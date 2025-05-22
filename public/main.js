let socket;
let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function initializeWebSocket() {
  socket = new WebSocket("ws://localhost:8080");

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'chat') {
      document.getElementById("chat-box").innerHTML += `<div>Stranger: ${data.message}</div>`;
    } else if (data.offer) {
      createPeerConnection();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.send(JSON.stringify({ answer }));
    } else if (data.answer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  socket.onclose = () => {
    console.warn("WebSocket closed. Trying to reconnect...");
    setTimeout(initializeWebSocket, 2000);
  };
}

function sendMessage() {
  const input = document.getElementById("message");
  const message = input.value.trim();
  if (message && socket.readyState === WebSocket.OPEN) {
    document.getElementById("chat-box").innerHTML += `<div>You: ${message}</div>`;
    socket.send(JSON.stringify({ type: "chat", message }));
    input.value = '';
  } else {
    alert("WebSocket is not connected.");
  }
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  peerConnection.ontrack = event => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  if (localStream) {
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  }
}

async function startCall() {
  if (!localStream) {
    alert("Cannot start call: camera access was denied or not initialized.");
    return;
  }

  createPeerConnection();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.send(JSON.stringify({ offer }));
}

async function initMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;
  } catch (err) {
    alert("Camera/microphone permission is required to use video chat.");
    console.error("Media error:", err);
  }
}

// Initialize everything on load
window.onload = () => {
  initMedia();
  initializeWebSocket();
};
