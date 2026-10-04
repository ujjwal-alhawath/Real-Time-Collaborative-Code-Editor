import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

interface Message {
  _id: string;
  text: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    avatarColor: string;
  };
}

interface ChatPanelProps {
  roomId: string;
  socket: Socket | null;
}

export const ChatPanel = ({ roomId, socket }: ChatPanelProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}/messages`);
        if (data.data.messages) {
          setMessages(data.data.messages);
        }
      } catch (error) {
        console.error('Failed to load chat history', error);
      }
    };
    fetchHistory();
  }, [roomId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };
    
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    
    socket.emit('send-message', { roomId, text: text.trim() });
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="p-4 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">Room Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground mt-10">No messages yet.</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?._id;
            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{isMe ? 'You' : msg.sender.name}</span>
                </div>
                <div className={`text-sm px-3 py-2 rounded-2xl max-w-[90%] ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-3 border-t border-border shrink-0 flex gap-2">
        <Input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Type a message..." 
          className="text-sm h-9"
        />
        <Button type="submit" size="sm" className="h-9 px-3">Send</Button>
      </form>
    </div>
  );
};
