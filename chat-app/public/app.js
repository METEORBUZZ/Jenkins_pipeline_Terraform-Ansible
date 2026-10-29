(() => {
  // DOM Elements
  const joinModal = document.getElementById('join-modal');
  const joinForm = document.getElementById('join-form');
  const usernameInput = document.getElementById('username-input');
  const randomNameBtn = document.getElementById('random-name-btn');
  const connectionStatus = document.getElementById('connection-status');
  const statusText = connectionStatus.querySelector('.status-text');
  const myUsernameSpan = document.getElementById('my-username');
  const myAvatarDot = document.getElementById('my-avatar-dot');
  const userCountSpan = document.getElementById('user-count');
  const userListUl = document.getElementById('user-list');
  const messagesContainer = document.getElementById('messages-container');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('sidebar');
  const emojiButtons = document.querySelectorAll('.emoji-btn');

  // State
  let socket = null;
  let currentUser = {
    id: null,
    username: '',
    color: '#3b82f6'
  };
  let reconnectAttempts = 0;
  let typingTimeout = null;
  let isTyping = false;

  // Cool developer handles generator
  const ADJECTIVES = ['Cloud', 'Dev', 'Terraform', 'Ansible', 'Docker', 'Kubernetes', 'Async', 'Binary', 'Cyber', 'Pixel'];
  const NOUNS = ['Architect', 'Pilot', 'Ninja', 'Master', 'Wizard', 'Captain', 'Engineer', 'Hacker', 'Falcon', 'Runner'];

  function generateRandomUsername() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj}${noun}${num}`;
  }

  // Pre-fill username input
  usernameInput.value = generateRandomUsername();

  randomNameBtn.addEventListener('click', () => {
    usernameInput.value = generateRandomUsername();
    usernameInput.focus();
  });

  // Toggle mobile sidebar
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Join Chat
  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const desiredName = usernameInput.value.trim();
    if (!desiredName) return;

    currentUser.username = desiredName;
    joinModal.classList.add('hidden');
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();

    initWebSocket();
  });

  // Connect WebSocket
  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    updateConnectionStatus('connecting', 'Connecting...');
    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      console.log('[WebSocket] Connection open');
      updateConnectionStatus('connected', 'Connected');
      reconnectAttempts = 0;

      // Send join event
      socket.send(JSON.stringify({
        type: 'JOIN',
        username: currentUser.username
      }));
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
      } catch (err) {
        console.error('[WebSocket] Error parsing incoming message:', err);
      }
    });

    socket.addEventListener('close', () => {
      console.warn('[WebSocket] Connection closed');
      updateConnectionStatus('disconnected', 'Disconnected. Retrying...');
      userCountSpan.textContent = '0';
      userListUl.innerHTML = '';
      scheduleReconnect();
    });

    socket.addEventListener('error', (err) => {
      console.error('[WebSocket] Socket error:', err);
    });
  }

  // Auto-reconnect with exponential backoff
  function scheduleReconnect() {
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
    console.log(`[WebSocket] Attempting reconnect in ${Math.round(delay / 1000)}s...`);
    setTimeout(() => {
      if (socket && socket.readyState === WebSocket.CLOSED) {
        initWebSocket();
      }
    }, delay);
  }

  function updateConnectionStatus(state, text) {
    connectionStatus.className = `status-indicator ${state}`;
    statusText.textContent = text;
  }

  // Incoming Message Handler
  function handleIncomingMessage(data) {
    switch (data.type) {
      case 'WELCOME': {
        currentUser.id = data.id;
        currentUser.username = data.username;
        currentUser.color = data.color;

        myUsernameSpan.textContent = currentUser.username;
        myAvatarDot.style.backgroundColor = currentUser.color;

        // Render message history
        if (Array.isArray(data.history)) {
          data.history.forEach((msg) => renderMessage(msg));
        }
        break;
      }

      case 'MESSAGE': {
        renderMessage(data);
        break;
      }

      case 'SYSTEM': {
        renderSystemNotice(data.text);
        break;
      }

      case 'USER_LIST': {
        renderUserList(data.count, data.users);
        break;
      }

      case 'TYPING': {
        handleTypingNotice(data);
        break;
      }

      default:
        console.log('[WebSocket] Unhandled payload:', data);
    }
  }

  // Render a chat message
  function renderMessage(msg) {
    const isSelf = msg.userId === currentUser.id;
    const row = document.createElement('div');
    row.className = `message-row ${isSelf ? 'self' : 'peer'}`;

    const initial = (msg.username || '?').charAt(0).toUpperCase();
    const timeFormatted = formatTime(msg.timestamp);

    row.innerHTML = `
      <div class="message-avatar" style="background-color: ${msg.color || '#3b82f6'}">
        ${escapeHtml(initial)}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">${escapeHtml(msg.username)}</span>
          <span class="timestamp">${timeFormatted}</span>
        </div>
        <div class="message-bubble">
          ${escapeHtml(msg.text)}
        </div>
      </div>
    `;

    messagesContainer.appendChild(row);
    scrollToBottom();
  }

  // Render system event
  function renderSystemNotice(text) {
    const notice = document.createElement('div');
    notice.className = 'system-message';
    notice.textContent = text;
    messagesContainer.appendChild(notice);
    scrollToBottom();
  }

  // Render active user list
  function renderUserList(count, users) {
    userCountSpan.textContent = count;
    userListUl.innerHTML = '';

    (users || []).forEach((u) => {
      const li = document.createElement('li');
      li.className = 'user-item';
      const initial = u.username.charAt(0).toUpperCase();
      const isMe = u.id === currentUser.id ? ' (You)' : '';

      li.innerHTML = `
        <span class="user-item-avatar" style="background-color: ${u.color || '#3b82f6'}">${escapeHtml(initial)}</span>
        <span class="user-item-name">${escapeHtml(u.username)}${isMe}</span>
      `;
      userListUl.appendChild(li);
    });
  }

  // Typing indicator handling
  const activeTypers = new Map();
  function handleTypingNotice(data) {
    if (data.isTyping) {
      activeTypers.set(data.userId, data.username);
    } else {
      activeTypers.delete(data.userId);
    }

    if (activeTypers.size === 0) {
      typingIndicator.textContent = '';
    } else {
      const names = Array.from(activeTypers.values()).join(', ');
      typingIndicator.textContent = `${names} is typing...`;
    }
  }

  // Send Message
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'MESSAGE',
      text
    }));

    messageInput.value = '';
    sendTypingStatus(false);
    messageInput.focus();
  });

  // Typing state detection
  messageInput.addEventListener('input', () => {
    if (!isTyping) {
      isTyping = true;
      sendTypingStatus(true);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      sendTypingStatus(false);
    }, 1500);
  });

  function sendTypingStatus(status) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'TYPING',
        isTyping: status
      }));
    }
  }

  // Emoji Quick Buttons
  emojiButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      messageInput.value += emoji;
      messageInput.focus();
    });
  });

  // Helpers
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();

