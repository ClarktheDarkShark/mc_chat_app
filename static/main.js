document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatResponseDiv = document.getElementById('chat-response');
  
    sendButton.addEventListener('click', async () => {
      const message = userInput.value.trim();
      if (!message) {
        chatResponseDiv.textContent = "Please enter a message.";
        return;
      }
  
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message }),
        });
        const data = await response.json();
        if (data.error) {
          chatResponseDiv.textContent = `Error: ${data.error}`;
        } else {
          chatResponseDiv.textContent = `Assistant: ${data.assistant_reply}`;
        }
      } catch (err) {
        console.error(err);
        chatResponseDiv.textContent = "Something went wrong.";
      }
    });
  });
  