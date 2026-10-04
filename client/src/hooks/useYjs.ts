import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';

export const useYjs = (socket: Socket | null, roomId: string, user: any) => {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  useEffect(() => {
    if (!socket) return;

    const ydoc = new Y.Doc();
    const yawareness = new Awareness(ydoc);
    
    // Set local user awareness info for cursors
    if (user) {
      yawareness.setLocalStateField('user', {
        name: user.name,
        color: user.avatarColor,
      });
    }

    setDoc(ydoc);
    setAwareness(yawareness);

    // 1. Sync Yjs Document
    const handleUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'socket') {
        socket.emit('yjs-update', { roomId, update: Array.from(update) });
      }
    };
    ydoc.on('update', handleUpdate);

    const handleSync = (updateBuffer: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(updateBuffer), 'socket');
    };
    socket.on('yjs-sync-step-1', handleSync);

    const handleRemoteUpdate = (updateBuffer: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(updateBuffer), 'socket');
    };
    socket.on('yjs-update', handleRemoteUpdate);

    // 2. Sync Awareness (Cursors)
    const handleAwarenessUpdate = ({ added, updated, removed }: any, origin: any) => {
      if (origin !== 'socket') {
        const changedClients = added.concat(updated, removed);
        const update = encodeAwarenessUpdate(yawareness, changedClients);
        socket.emit('awareness-update', { roomId, update: Array.from(update) });
      }
    };
    yawareness.on('update', handleAwarenessUpdate);

    const handleRemoteAwareness = (updateBuffer: ArrayBuffer) => {
      applyAwarenessUpdate(yawareness, new Uint8Array(updateBuffer), 'socket');
    };
    socket.on('awareness-update', handleRemoteAwareness);

    // Request to join the room and get initial state
    socket.emit('join-room', { roomId });

    return () => {
      ydoc.off('update', handleUpdate);
      socket.off('yjs-sync-step-1', handleSync);
      socket.off('yjs-update', handleRemoteUpdate);
      
      yawareness.off('update', handleAwarenessUpdate);
      socket.off('awareness-update', handleRemoteAwareness);
      
      yawareness.destroy();
      ydoc.destroy();
    };
  }, [socket, roomId, user]);

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!awareness) return;
    
    const updateUsers = () => {
      const states = Array.from(awareness.getStates().values());
      setUsers(states.filter(state => state.user).map(state => state.user));
    };
    
    awareness.on('change', updateUsers);
    updateUsers();
    
    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  return { doc, awareness, users };
};
