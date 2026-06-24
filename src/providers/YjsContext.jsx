/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { SERVER_WS_URL } from '../config.js';

export const SharedDocContext = createContext(null);

export const YjsProvider = ({ roomId, currentUser, children }) => {
    const [sharedDoc, setSharedDoc] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        console.log(`Initializing Yjs context for room: ${roomId}`);
        
        // Instantiate shared doc
        const sDoc = new Y.Doc();
        const sharedProvider = new WebsocketProvider(`${SERVER_WS_URL}/yjs`, `room-${roomId}-shared`, sDoc);

        setSharedDoc(sDoc);

        // Set up awareness state for presence/cursors
        sharedProvider.awareness.setLocalStateField('user', {
            name: currentUser.displayName || currentUser.firstName,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            avatarUrl: currentUser.avatarUrl || ''
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

        // Cleanup on unmount to prevent memory leaks and duplicate socket listeners
        return () => {
            console.log(`Cleaning up Yjs Providers and Documents for room: ${roomId}`);
            sharedProvider.destroy();
            sDoc.destroy();
        };
    }, [roomId, currentUser]);

    if (!sharedDoc) {
        return (
            <div className="auth-page-wrapper loading-state">
                <div className="spinner" style={{ borderTopColor: '#c084fc', width: '48px', height: '48px' }}></div>
            </div>
        );
    }

    return (
        <SharedDocContext.Provider value={{ doc: sharedDoc, users }}>
            {children}
        </SharedDocContext.Provider>
    );
};
