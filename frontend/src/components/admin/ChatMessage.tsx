import './ChatMessage.css';

interface ChatMessageProps {
  role: 'ai' | 'user';
  content: string;
  avatar?: string;
}

function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`chat-message ${role}`}>
      <div className="message-avatar">
        <div className={`avatar-circle ${role}`}>
          {role === 'ai' ? '🤖' : '👤'}
        </div>
      </div>
      <div className="message-bubble">
        <p className="message-text">{content}</p>
      </div>
    </div>
  );
}

export default ChatMessage;

