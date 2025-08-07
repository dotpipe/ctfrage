/**
 * ChessChat - Server-based chat system for multiplayer chess games
 */
class ChessChat {
  constructor(myId, opponentId, matchId) {
    this.myId = myId;
    this.opponentId = opponentId;
    this.matchId = matchId;
    this.lastCheckedTimestamp = Date.now();
    this.pollInterval = null;
    this.processedMessages = new Set(); // Track processed messages to avoid duplicates
    
    console.log("ChessChat initialized with:", {
      myId: this.myId,
      opponentId: this.opponentId,
      matchId: this.matchId
    });
    
    this.createChatWindow();
    this.startPolling();
  }
  
  createChatWindow() {
    // Remove existing chat window if any
    const existingChat = document.getElementById('chess-chat-window');
    if (existingChat) {
      existingChat.remove();
    }
    
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chess-chat-window';
    chatWindow.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      height: 400px;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      z-index: 9999;
    `;
    
    chatWindow.innerHTML = `
      <div class="chat-header" style="padding: 10px; background: #f0f0f0; border-bottom: 1px solid #ccc; border-radius: 8px 8px 0 0;">
        <span>Chess Chat</span>
        <button id="minimize-chat" style="float: right; border: none; background: none; cursor: pointer;">−</button>
      </div>
      <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 10px;"></div>
      <div style="padding: 10px; border-top: 1px solid #ccc;">
        <input id="chat-input" type="text" placeholder="Type a message..." style="width: 80%; padding: 5px;">
        <button id="send-chat" style="width: 18%; padding: 5px;">Send</button>
      </div>
    `;
    
    document.body.appendChild(chatWindow);
    
    // Add event listeners
    document.getElementById('minimize-chat').addEventListener('click', () => this.toggleChatWindow());
    document.getElementById('send-chat').addEventListener('click', () => this.sendChatMessage());
    document.getElementById('chat-input').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.sendChatMessage();
    });
    
    // Add system message
    this.addSystemMessage('Chat connected. Say hello to your opponent!');
  }
  
  toggleChatWindow() {
    const chatWindow = document.getElementById('chess-chat-window');
    const messagesContainer = document.getElementById('chat-messages');
    const inputContainer = document.querySelector('#chess-chat-window > div:last-child');
    
    if (messagesContainer.style.display === 'none') {
      messagesContainer.style.display = 'block';
      inputContainer.style.display = 'block';
      chatWindow.style.height = '400px';
      document.getElementById('minimize-chat').textContent = '−';
    } else {
      messagesContainer.style.display = 'none';
      inputContainer.style.display = 'none';
      chatWindow.style.height = '40px';
      document.getElementById('minimize-chat').textContent = '+';
    }
  }
  
  sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const timestamp = Date.now();
    const messageId = `msg_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    
    const chatMessage = {
      id: messageId,
      sender: this.myId,
      message: message,
      timestamp: timestamp
    };
    
    // Add to my chat window immediately
    this.addMessageToChat(chatMessage, true);
    
    // Send to server
    const formData = new FormData();
    formData.append('game_id', this.matchId);
    formData.append('player_id', this.myId);
    formData.append('message', JSON.stringify(chatMessage));
    
    fetch('php/send_chat.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        console.error('Error sending chat message:', data.message);
        this.addSystemMessage('Error sending message. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error sending chat message:', error);
      this.addSystemMessage('Network error. Please try again.');
    });
    
    // Clear input
    input.value = '';
  }
  
  addMessageToChat(chatMessage, isFromMe) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = isFromMe ? 'my-message' : 'opponent-message';
    messageDiv.style.cssText = `
      margin: 5px 0;
      padding: 8px 12px;
      border-radius: 15px;
      max-width: 80%;
      word-wrap: break-word;
      ${isFromMe ? 
        'background-color: #DCF8C6; align-self: flex-end; margin-left: auto;' : 
        'background-color: #F2F2F2; align-self: flex-start;'}
    `;
    
    messageDiv.textContent = chatMessage.message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  addSystemMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.style.cssText = `
      margin: 5px 0;
      padding: 5px 10px;
      border-radius: 10px;
      background-color: #f0f0f0;
      color: #666;
      font-style: italic;
      text-align: center;
      font-size: 0.9em;
    `;
    
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  startPolling() {
    // Poll for new messages
    this.pollInterval = setInterval(() => {
      this.checkForNewMessages();
    }, 2000);
  }
  
  checkForNewMessages() {
    if (!this.matchId || !this.myId) return;
    
    fetch(`php/get_chat.php?game_id=${this.matchId}&player_id=${this.myId}&last_timestamp=${this.lastCheckedTimestamp}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.messages && data.messages.length > 0) {
          console.log("Received chat messages:", data.messages);
          
          // Process new messages
          for (const messageData of data.messages) {
            try {
              const chatMessage = JSON.parse(messageData.message);
              
              // Skip if we've already processed this message or it's our own
              if (chatMessage.sender === this.myId || 
                  (chatMessage.id && this.processedMessages.has(chatMessage.id))) {
                continue;
              }
              
              // Add message to chat
              this.addMessageToChat(chatMessage, false);
              
              // Mark as processed
              if (chatMessage.id) {
                this.processedMessages.add(chatMessage.id);
              }
              
              // Update last checked timestamp
              if (chatMessage.timestamp > this.lastCheckedTimestamp) {
                this.lastCheckedTimestamp = chatMessage.timestamp;
              }
            } catch (e) {
              console.error('Error processing chat message:', e);
            }
          }
        }
      })
      .catch(error => {
        console.error('Error checking for chat messages:', error);
      });
  }
  
  resetChat() {
    // Clear chat messages
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    // Reset timestamp
    this.lastCheckedTimestamp = Date.now();
    this.processedMessages.clear();
    
    // Add system message
    this.addSystemMessage('Chat reset. New game started.');
  }
  
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
  
  handleGameEnd(result) {
    this.addSystemMessage(`Game over: ${result}`);
    this.stopPolling();
  }
}

// Make ChessChat available globally
window.ChessChat = ChessChat;
