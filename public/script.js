document.getElementById('textBtn')?.addEventListener('click', () => {
    window.location.href = 'text.html';
  });
  
  document.getElementById('videoBtn')?.addEventListener('click', () => {
    window.location.href = 'video.html';
  });
  
  // Text Chat Logic
  const chatBox = document.getElementById('chat-box');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  
  sendBtn?.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
      const messageElement = document.createElement('div');
      messageElement.textContent = `You: ${message}`;
      chatBox.appendChild(messageElement);
      messageInput.value = '';
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });
  
  // Skip Logic for Text Chat
  document.getElementById('nextBtn')?.addEventListener('click', () => {
    alert('Skipping to the next chat partner...');
    window.location.reload();
  });
  
  // Video Chat Placeholder Logic
  document.getElementById('startBtn')?.addEventListener('click', () => {
    alert('Starting video chat (WebRTC integration needed).');
  });
  