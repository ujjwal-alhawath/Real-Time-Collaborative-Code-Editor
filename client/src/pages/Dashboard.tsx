import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data.data.rooms);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    setIsCreating(true);
    try {
      await api.post('/rooms', { name: newRoomName });
      toast.success('Room created successfully');
      setNewRoomName('');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">CodeSync</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: user?.avatarColor }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Your Rooms</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="col-span-1 md:col-span-3 bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Create a new room</h3>
            <form onSubmit={handleCreateRoom} className="flex gap-4">
              <Input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="max-w-md"
              />
              <Button type="submit" isLoading={isCreating}>Create Room</Button>
            </form>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading rooms...</div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room: any) => (
              <div key={room._id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg truncate">{room.name}</h3>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium">
                    {room.language}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-6">
                  ID: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{room.roomId}</code>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {room.members.slice(0, 3).map((m: any) => (
                      <div 
                        key={m.user._id}
                        className="w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: m.user.avatarColor }}
                        title={m.user.name}
                      >
                        {m.user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {room.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium text-foreground">
                        +{room.members.length - 3}
                      </div>
                    )}
                  </div>
                  <Button size="sm">Join Room</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
            <h3 className="text-lg font-medium mb-2">No rooms yet</h3>
            <p className="text-muted-foreground">Create a room to start collaborating.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
