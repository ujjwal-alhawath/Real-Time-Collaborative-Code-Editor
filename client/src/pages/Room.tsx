import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useAuthStore } from '../stores/authStore';
import { useSocket } from '../hooks/useSocket';
import { useYjs } from '../hooks/useYjs';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { ChatPanel } from '../components/room/ChatPanel';

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const socket = useSocket();
  const { doc, awareness, users } = useYjs(socket, roomId!, user);
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('chat');

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;

    if (doc && awareness) {
      const type = doc.getText('monaco');
      bindingRef.current = new MonacoBinding(
        type,
        editor.getModel()!,
        new Set([editor]),
        awareness
      );
    }
  };

  useEffect(() => {
    if (editorRef.current && doc && awareness && !bindingRef.current) {
      const type = doc.getText('monaco');
      bindingRef.current = new MonacoBinding(
        type,
        editorRef.current.getModel()!,
        new Set([editorRef.current]),
        awareness
      );
    }
  }, [doc, awareness]);

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, []);

  // Execution Socket Listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('execution-started', ({ user: execUser }) => {
      setIsExecuting(true);
      setOutput(`[Running] Code execution started by ${execUser}...\n`);
    });

    socket.on('execution-result', ({ status, output: resultOutput }) => {
      setIsExecuting(false);
      setOutput(prev => prev + `\n[${status.toUpperCase()}]\n${resultOutput}`);
    });

    return () => {
      socket.off('execution-started');
      socket.off('execution-result');
    };
  }, [socket]);

  const handleRunCode = async () => {
    if (!doc) return;
    setIsExecuting(true);
    setOutput('Queuing execution...');
    try {
      await api.post(`/rooms/${roomId}/execute`, { language });
    } catch (error: any) {
      setIsExecuting(false);
      setOutput(`Error: ${error.response?.data?.error || 'Execution failed'}`);
      toast.error('Execution failed');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            ← Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-semibold text-sm truncate max-w-[200px]">Room: {roomId}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-xs text-muted-foreground">{users.length} Connected</span>
          </div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-muted text-sm border-none outline-none px-2 py-1.5 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
          <Button size="sm" variant="primary" onClick={handleRunCode} isLoading={isExecuting}>Run Code</Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col relative border-r border-border">
          {!doc ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : null}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                padding: { top: 16 },
                cursorBlinking: 'smooth',
              }}
              onMount={handleEditorMount}
            />
          </div>
          
          {/* Terminal Panel */}
          <div className="h-1/3 min-h-[150px] border-t border-border bg-black text-green-400 font-mono text-sm p-4 overflow-auto">
             <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground text-xs font-sans uppercase tracking-wider">Terminal Output</span>
                <button onClick={() => setOutput('')} className="text-xs text-muted-foreground hover:text-white">Clear</button>
             </div>
             <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>

        {/* Sidebar (Participants / Chat) */}
        <div className="w-80 bg-card flex flex-col shrink-0 hidden md:flex">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-border text-sm font-medium">
            <button 
              className={`flex-1 py-3 text-center transition-colors ${activeTab === 'participants' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
              onClick={() => setActiveTab('participants')}
            >
              Participants ({users.length})
            </button>
            <button 
              className={`flex-1 py-3 text-center transition-colors ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'participants' ? (
              <div className="p-4 overflow-y-auto h-full">
                <div className="space-y-3">
                  {users.map((u: any, idx: number) => (
                    <div key={`${u.name}-${idx}`} className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-sm ring-2 ring-background"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate">{u.name} {u.name === user?.name ? '(You)' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ChatPanel roomId={roomId!} socket={socket} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
