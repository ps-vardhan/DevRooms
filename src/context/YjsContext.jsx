/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const SharedDocContext = createContext(null);
export const PrivateDocContext = createContext(null);

export const YjsProvider = ({ roomId, currentUser, children }) => {
    const [sharedDoc, setSharedDoc] = useState(null);
    const [privateDoc, setPrivateDoc] = useState(null);
    const [provider, setProvider] = useState(null);
    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState([]);

    const lastCopiedPushId = useRef(null);

    useEffect(() => {
        console.log(`Initializing Yjs context for room: ${roomId}`);
        
        // 1. Instantiate dual docs
        const sDoc = new Y.Doc();
        const pDoc = new Y.Doc();

        // 2. Setup WebSocket Provider targeting backend /yjs endpoint
        const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
        const sharedProvider = new WebsocketProvider(`${WS_URL}/yjs`, `room-${roomId}-shared`, sDoc);

        setSharedDoc(sDoc);
        setPrivateDoc(pDoc);
        setProvider(sharedProvider);

        // 3. Set up awareness state for presence/cursors
        sharedProvider.awareness.setLocalStateField('user', {
            name: currentUser.firstName,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16)
        });

        // Track connection status
        sharedProvider.on('status', event => {
            setConnected(event.status === 'connected');
        });

        // Sync awareness users list
        const updateUsers = () => {
            const states = Array.from(sharedProvider.awareness.getStates().values());
            const activeUsers = states
                .filter(state => state.user)
                .map(state => state.user);
            setUsers(activeUsers);
        };

        sharedProvider.awareness.on('change', updateUsers);

        // 4. Locked Copy Logic (Problem Push ID)
        sDoc.on('update', () => {
            const meta = sDoc.getMap('meta');
            const pushId = meta.get('problemPushId');
            if (pushId && lastCopiedPushId.current !== pushId) {
                lastCopiedPushId.current = pushId;
                
                // Copy sharedDoc state into local privateDoc exactly once per push
                const snapshot = Y.encodeStateAsUpdate(sDoc);
                Y.applyUpdate(pDoc, snapshot);
                
                console.log(`Successfully copied shared snapshot to private doc for push: ${pushId}`);
            }
        });

        // 5. Cleanup on unmount to prevent memory leaks and duplicate socket listeners
        return () => {
            console.log(`Cleaning up Yjs Providers and Documents for room: ${roomId}`);
            sharedProvider.destroy();
            sDoc.destroy();
            pDoc.destroy();
        };
    }, [roomId, currentUser]);

    if (!sharedDoc || !privateDoc) {
        return (
            <div className="auth-page-wrapper loading-state">
                <div className="spinner" style={{ borderTopColor: '#c084fc', width: '48px', height: '48px' }}></div>
            </div>
        );
    }

    return (
        <SharedDocContext.Provider value={{ doc: sharedDoc, provider, connected, users }}>
            <PrivateDocContext.Provider value={{ doc: privateDoc }}>
                {children}
            </PrivateDocContext.Provider>
        </SharedDocContext.Provider>
    );
};
