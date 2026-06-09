import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import * as Y from 'yjs';
import * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { SharedDocContext, PrivateDocContext } from '../context/YjsContext.jsx';

export default function CodingRoom({ roomId, onLeaveRoom }) {
    const { doc: sharedDoc, provider, users } = useContext(SharedDocContext);
    const { doc: privateDoc } = useContext(PrivateDocContext);

    const [roomDetails, setRoomDetails] = useState(null);
    const [isHost, setIsHost] = useState(false);
    
    // Inputs & state
    const [problemInput, setProblemInput] = useState('');
    const [boilerplateInput, setBoilerplateInput] = useState('// Write your solution here\nfunction twoSum(nums, target) {\n    \n}');
    const [currentProblem, setCurrentProblem] = useState('Waiting for the host to push a problem...');
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
    const [isRecording, setIsRecording] = useState(false);
    
    // Participant view tab
    const [activeTab, setActiveTab] = useState('shared'); // 'shared' or 'private'
    const [hostTyping, setHostTyping] = useState(false);
    
    // Code execution output
    const [runOutput, setRunOutput] = useState('-> Output console idle');
    
    // Whiteboard drawing tools (Host)
    const [drawActive, setDrawActive] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    // Panel states for auto direction adjustment
    const [editorCollapsed, setEditorCollapsed] = useState(false);
    const [whiteboardCollapsed, setWhiteboardCollapsed] = useState(false);
    const [problemCollapsed, setProblemCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const secondaryDirection = editorCollapsed ? 'horizontal' : 'vertical';

    // Panel refs
    const editorPanelRef = useRef(null);
    const rightPanelRef = useRef(null);
    const whiteboardPanelRef = useRef(null);
    const problemPanelRef = useRef(null);

    // Sync collapsing whiteboard and problem with the outer right panel
    useEffect(() => {
        if (whiteboardCollapsed && problemCollapsed) {
            rightPanelRef.current?.collapse();
        }
    }, [whiteboardCollapsed, problemCollapsed]);

    useEffect(() => {
        if (!rightPanelCollapsed) {
            if (whiteboardCollapsed && problemCollapsed) {
                whiteboardPanelRef.current?.expand();
                problemPanelRef.current?.expand();
            }
        }
    }, [rightPanelCollapsed, whiteboardCollapsed, problemCollapsed]);
    
    // Monaco Refs
    const sharedEditorContainerRef = useRef(null);
    const privateEditorContainerRef = useRef(null);
    const sharedEditorRef = useRef(null);
    const privateEditorRef = useRef(null);

    const sharedModelRef = useRef(null);
    const privateModelRef = useRef(null);
    const sharedBindingRef = useRef(null);
    const privateBindingRef = useRef(null);
    
    const canvasRef = useRef(null);
    const currentStrokeRef = useRef(null);

    const lastCopiedPushId = useRef(null);

    const sharedText = sharedDoc.getText('code');
    const privateText = privateDoc.getText('code');
    const whiteboardArray = sharedDoc.getArray('whiteboard');

    // 1. Clock timer
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch Room details & role validation
    useEffect(() => {
        fetch(`/api/rooms/${roomId}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setRoomDetails(data.data);
                    setIsHost(data.data.isHost);
                    if (data.data.problem) {
                        setCurrentProblem(data.data.problem);
                        setProblemInput(data.data.problem);
                    }
                }
            })
            .catch(err => console.error("Error fetching room details:", err))
            .finally(() => setLoading(false));
    }, [roomId]);

    // 3. Sync problem description changes & copy logic
    useEffect(() => {
        const meta = sharedDoc.getMap('meta');
        const observer = () => {
            const problem = meta.get('problemText');
            if (problem) {
                setCurrentProblem(problem);
            }

            // UUID-Gated Seeding
            const pushId = meta.get('problemPushId');
            if (pushId && lastCopiedPushId.current !== pushId) {
                lastCopiedPushId.current = pushId;
                if (sharedModelRef.current && privateModelRef.current) {
                    const sharedContent = sharedModelRef.current.getValue();
                    privateModelRef.current.setValue(sharedContent);
                    console.log(`Seeded private workspace with shared boilerplate for push ID: ${pushId}`);
                }
            }
        };
        meta.observe(observer);
        
        const initialProblem = meta.get('problemText');
        if (initialProblem) {
            setCurrentProblem(initialProblem);
        }

        const initialPushId = meta.get('problemPushId');
        if (initialPushId) {
            lastCopiedPushId.current = initialPushId;
        }

        return () => meta.unobserve(observer);
    }, [sharedDoc]);

    // 4. Detect host typing activity on Shared Code
    useEffect(() => {
        let timeout;
        const observer = (event) => {
            if (!event.transaction.local) {
                setHostTyping(true);
                clearTimeout(timeout);
                timeout = setTimeout(() => setHostTyping(false), 2500);
            }
        };
        sharedText.observe(observer);
        return () => {
            sharedText.unobserve(observer);
            clearTimeout(timeout);
        };
    }, [sharedText]);

    // 5. Initialize Monaco Models and Editors (Dual-mount to keep internal states)
    useEffect(() => {
        if (loading) return;

        // Create models
        sharedModelRef.current = monaco.editor.createModel(sharedText.toString(), 'javascript');
        privateModelRef.current = monaco.editor.createModel(privateText.toString(), 'javascript');

        // Create Shared Editor Instance
        const sharedEditor = monaco.editor.create(sharedEditorContainerRef.current, {
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'ui-monospace, Consolas, monospace',
            lineHeight: 22,
            readOnly: !isHost,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
            }
        });
        sharedEditorRef.current = sharedEditor;
        sharedEditor.setModel(sharedModelRef.current);

        // Create Private Editor Instance
        const privateEditor = monaco.editor.create(privateEditorContainerRef.current, {
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'ui-monospace, Consolas, monospace',
            lineHeight: 22,
            readOnly: false,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
            }
        });
        privateEditorRef.current = privateEditor;
        privateEditor.setModel(privateModelRef.current);

        // Bind Monaco instances to documents
        sharedBindingRef.current = new MonacoBinding(
            sharedText,
            sharedModelRef.current,
            new Set([sharedEditor]),
            provider?.awareness
        );

        privateBindingRef.current = new MonacoBinding(
            privateText,
            privateModelRef.current,
            new Set([privateEditor])
        );

        return () => {
            if (sharedBindingRef.current) sharedBindingRef.current.destroy();
            if (privateBindingRef.current) privateBindingRef.current.destroy();
            if (sharedModelRef.current) sharedModelRef.current.dispose();
            if (privateModelRef.current) privateModelRef.current.dispose();
            sharedEditor.dispose();
            privateEditor.dispose();
        };
    }, [loading, isHost, provider, sharedText, privateText]);

    // Update readOnly dynamically if host role changes
    useEffect(() => {
        if (sharedEditorRef.current) {
            sharedEditorRef.current.updateOptions({ readOnly: !isHost });
        }
    }, [isHost]);

    // 7. Handle Language updates
    const handleLanguageChange = (e) => {
        const lang = e.target.value.toLowerCase();
        setSelectedLanguage(e.target.value);
        
        let monacoLang = lang;
        if (lang === 'c++') monacoLang = 'cpp';
        
        if (sharedModelRef.current) {
            monaco.editor.setModelLanguage(sharedModelRef.current, monacoLang);
        }
        if (privateModelRef.current) {
            monaco.editor.setModelLanguage(privateModelRef.current, monacoLang);
        }
    };

    // 8. Whiteboard Sync Redraw Logic
    const redrawWhiteboard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        whiteboardArray.forEach(strokeMap => {
            const color = strokeMap.get('color') || '#c084fc';
            const points = strokeMap.get('points');
            if (!points || points.length === 0) return;
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            const firstPoint = points.get(0);
            ctx.moveTo(firstPoint.x * canvas.width, firstPoint.y * canvas.height);
            
            for (let i = 1; i < points.length; i++) {
                const pt = points.get(i);
                ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
            }
            ctx.stroke();
        });
    }, [whiteboardArray]);

    useEffect(() => {
        if (loading) return;

        redrawWhiteboard();
        
        const observer = () => {
            redrawWhiteboard();
        };
        whiteboardArray.observeDeep(observer);
        window.addEventListener('resize', redrawWhiteboard);
        
        return () => {
            whiteboardArray.unobserveDeep(observer);
            window.removeEventListener('resize', redrawWhiteboard);
        };
    }, [loading, redrawWhiteboard, whiteboardArray]);

    // Trigger canvas redraw when whiteboard collapses/expands
    useEffect(() => {
        if (!loading && !whiteboardCollapsed) {
            setTimeout(redrawWhiteboard, 50);
        }
    }, [whiteboardCollapsed, loading, redrawWhiteboard]);

    // 9. Whiteboard Pointer Capture
    const startDrawing = (e) => {
        if (!isHost || !drawActive) return;
        setIsDrawing(true);
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        const strokeMap = new Y.Map();
        strokeMap.set('color', '#c084fc');
        const pointsArray = new Y.Array();
        strokeMap.set('points', pointsArray);
        
        sharedDoc.transact(() => {
            whiteboardArray.push([strokeMap]);
        });
        
        currentStrokeRef.current = pointsArray;
        pointsArray.push([{ x, y }]);
    };

    const draw = (e) => {
        if (!isDrawing || !currentStrokeRef.current) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        currentStrokeRef.current.push([{ x, y }]);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        currentStrokeRef.current = null;
    };

    // Clear whiteboard drawing (Host only action)
    const handleClearWhiteboard = () => {
        if (!isHost) return;
        sharedDoc.transact(() => {
            whiteboardArray.delete(0, whiteboardArray.length);
        });
    };

    // 10. Push Problem (Host action)
    const handlePushProblem = async (e) => {
        e.preventDefault();
        if (!problemInput.trim()) return;

        try {
            const response = await fetch(`/api/rooms/${roomId}/problem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem: problemInput })
            });

            if (response.ok) {
                sharedDoc.transact(() => {
                    sharedDoc.getMap('meta').set('problemText', problemInput);
                    sharedText.delete(0, sharedText.length);
                    sharedText.insert(0, boilerplateInput);
                    sharedDoc.getMap('meta').set('problemPushId', crypto.randomUUID());
                });
            } else {
                const data = await response.json();
                alert(data.message || "Failed to push problem.");
            }
        } catch (err) {
            console.error("Error pushing problem:", err);
            alert("Error communicating with server.");
        }
    };

    // 11. Run code safely in visual console
    const handleRunCode = () => {
        const code = activeTab === 'shared' ? sharedText.toString() : privateText.toString();
        try {
            let logs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
            };
            
            // Execute JavaScript function call if exists
            const result = new Function(code + '\nif (typeof twoSum === "function") { return twoSum([2, 7, 11, 15], 9); }')();
            console.log = originalLog;
            
            const output = logs.length > 0 ? logs.join('\n') : (result !== undefined ? `-> ${JSON.stringify(result)}` : '-> Code executed successfully.');
            setRunOutput(output);
        } catch (err) {
            setRunOutput(`Error: ${err.message}`);
        }
    };

    const handleLeave = async () => {
        try {
            await fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' });
        } catch (err) {
            console.error("Error leaving room on backend:", err);
        }
        onLeaveRoom();
    };

    const getInitials = (userName) => {
        if (!userName) return 'U';
        const parts = userName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="auth-page-wrapper loading-state">
                <div className="spinner" style={{ borderTopColor: '#c084fc', width: '48px', height: '48px' }}></div>
            </div>
        );
    }

    return (
        <div className="coding-room-root" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            background: '#0b0c14',
            color: '#9ca3af',
            overflow: 'hidden'
        }}>
            
            {/* 1. Header Navigation Bar */}
            <div className="room-header-nav" style={{
                height: '64px',
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0d0f19',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>
                        {roomDetails?.name || 'DSA fundamentals'}
                    </span>
                    <span className="live-pill-nav" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <span className="pulse-indicator" style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                        live
                    </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                        {currentTime}
                    </span>
                </div>


                {/* Connected Users Avatars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                        {users.map((u, idx) => (
                            <div key={idx} style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: u.color || '#7c3aed',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                border: '2px solid #0d0f19',
                                marginLeft: idx > 0 ? '-8px' : '0',
                                zIndex: users.length - idx,
                                title: u.name
                            }}>
                                {getInitials(u.name)}
                            </div>
                        ))}
                    </div>

                    {isHost ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                                onClick={() => setIsRecording(!isRecording)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '30px',
                                    padding: '7px 16px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    backgroundColor: isRecording ? '#ef4444' : '#fff', 
                                    borderRadius: '50%',
                                    animation: isRecording ? 'spin 1.5s infinite ease' : 'none'
                                }}></span>
                                {isRecording ? 'Recording' : 'Record'}
                            </button>
                            <button onClick={handleLeave} style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '30px',
                                padding: '7px 16px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                ⎋ End session
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLeave} style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '30px',
                            padding: '7px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}>
                            ⎋ Leave
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Main Resizable Panel Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {editorCollapsed && (
                    <div 
                        className="collapsed-tab-vertical" 
                        onClick={() => editorPanelRef.current?.expand()}
                        title="Expand Editor"
                    >
                        <div className="collapsed-tab-vertical-text">
                            <span>💻</span> &lt;/&gt; Code
                        </div>
                    </div>
                )}
                <PanelGroup direction="horizontal" autoSaveId={`room-layout-${roomId}-horizontal`}>
                    
                    {/* Left Panel: Editor Workspace */}
                    <Panel 
                        ref={editorPanelRef}
                        defaultSize={60}
                        minSize={15}
                        collapsible={true}
                        onCollapse={() => setEditorCollapsed(true)}
                        onExpand={() => setEditorCollapsed(false)}
                    >
                        {!editorCollapsed && (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#0e1017'
                            }}>
                            
                            {/* Tab Selection Header */}
                            <div style={{
                                height: '48px',
                                padding: '0 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                background: '#0d0f17'
                            }}>
                                {isHost ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                                        <span style={{ width: '6px', height: '6px', backgroundColor: '#a855f7', borderRadius: '50%' }}></span>
                                        Shared editor (Host)
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={() => setActiveTab('shared')}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: activeTab === 'shared' ? '#fff' : 'rgba(255,255,255,0.4)',
                                                cursor: 'pointer',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                backgroundColor: activeTab === 'shared' ? 'rgba(255,255,255,0.04)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ width: '6px', height: '6px', backgroundColor: '#a855f7', borderRadius: '50%' }}></span>
                                            Shared
                                            {hostTyping && (
                                                <span className="typing-pulse-badge">
                                                    host typing
                                                </span>
                                            )}
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('private')}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: activeTab === 'private' ? '#fff' : 'rgba(255,255,255,0.4)',
                                                cursor: 'pointer',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                backgroundColor: activeTab === 'private' ? 'rgba(255,255,255,0.04)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                                            My workspace
                                        </button>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {/* Language Selector Dropdown */}
                                    <select 
                                        value={selectedLanguage}
                                        onChange={handleLanguageChange}
                                        style={{
                                            background: '#181a25',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            padding: '4px 12px',
                                            fontSize: '13px',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option>JavaScript</option>
                                        <option>TypeScript</option>
                                        <option>Python</option>
                                        <option>C++</option>
                                        <option>Java</option>
                                    </select>
                                    <button
                                        onClick={() => editorPanelRef.current?.collapse()}
                                        title="Collapse Editor"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255, 255, 255, 0.4)',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#fff'}
                                        onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                                    >
                                        ◀
                                    </button>
                                </div>
                            </div>

                            {/* Purple Watcher Banner (Only for participants on Shared tab) */}
                            {!isHost && activeTab === 'shared' && (
                                <div style={{
                                    padding: '10px 20px',
                                    background: 'rgba(168, 85, 247, 0.08)',
                                    borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
                                    fontSize: '12.5px',
                                    color: '#c084fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    textAlign: 'left'
                                }}>
                                    <span style={{ fontSize: '14px' }}>👁</span> Read only – watching host's live code
                                </div>
                            )}

                            {/* Monaco Editor Containers (State-managed dual mount) */}
                            <div style={{ flex: 1, minHeight: '200px', width: '100%', position: 'relative', background: '#0e1017' }}>
                                <div 
                                    ref={sharedEditorContainerRef} 
                                    style={{ display: activeTab === 'shared' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                />
                                <div 
                                    ref={privateEditorContainerRef} 
                                    style={{ display: activeTab === 'private' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                />
                            </div>

                            {/* Bottom Console / Execution Bar */}
                            <div style={{
                                height: '56px',
                                padding: '0 20px',
                                background: '#0d0f17',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <button 
                                        onClick={handleRunCode}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '30px',
                                            padding: '6px 18px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        ▷ Run
                                    </button>
                                    <span style={{
                                        fontSize: '13.5px',
                                        fontFamily: 'ui-monospace, Consolas, monospace',
                                        color: 'rgba(255,255,255,0.5)'
                                    }}>
                                        {runOutput}
                                    </span>
                                </div>

                                {/* Right tools */}
                                {isHost ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>broadcast</span>
                                            <label className="switch-toggle" style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px' }}>
                                                <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                                                <span className="slider-toggle-round" style={{
                                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: '#10b981', borderRadius: '34px', transition: '0.3s'
                                                }}></span>
                                            </label>
                                        </div>
                                        <button style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '30px',
                                            padding: '6px 16px',
                                            fontSize: '13px',
                                            color: '#fff',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}>
                                            ⚙ AI review
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#10b981',
                                            fontSize: '12.5px',
                                            fontWeight: '600',
                                            background: 'rgba(16, 185, 129, 0.08)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            borderRadius: '30px',
                                            padding: '4px 14px'
                                        }}>
                                            ✓ Passed
                                        </span>
                                        <button style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '30px',
                                            padding: '6px 16px',
                                            fontSize: '13px',
                                            color: '#fff',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}>
                                            ⚙ AI hint
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    </Panel>

                    {/* Resizable Divider Handle */}
                    <PanelResizeHandle className="resize-handle-horizontal" />

                    {/* Right Side: Split whiteboard & problem */}
                    <Panel 
                        ref={rightPanelRef}
                        defaultSize={40} 
                        minSize={15}
                        collapsible={true}
                        onCollapse={() => setRightPanelCollapsed(true)}
                        onExpand={() => setRightPanelCollapsed(false)}
                    >
                        {!rightPanelCollapsed && (
                            <>
                                {whiteboardCollapsed && (
                                    <div 
                                        className="collapsed-tab-horizontal" 
                                        onClick={() => whiteboardPanelRef.current?.expand()}
                                        title="Expand Whiteboard"
                                    >
                                        <div className="collapsed-tab-horizontal-text">
                                            <span>🎨</span> Whiteboard
                                        </div>
                                    </div>
                                )}
                                {problemCollapsed && (
                                    <div 
                                        className="collapsed-tab-horizontal" 
                                        onClick={() => problemPanelRef.current?.expand()}
                                        title="Expand Problem Description"
                                    >
                                        <div className="collapsed-tab-horizontal-text">
                                            <span>📝</span> Problem Description
                                        </div>
                                    </div>
                                )}
                                <PanelGroup direction={secondaryDirection} autoSaveId={`room-layout-${roomId}-vertical`}>
                            
                            {/* Top Panel: Whiteboard Canvas */}
                            <Panel 
                                ref={whiteboardPanelRef}
                                defaultSize={50}
                                minSize={10}
                                collapsible={true}
                                onCollapse={() => setWhiteboardCollapsed(true)}
                                onExpand={() => setWhiteboardCollapsed(false)}
                            >
                                {!whiteboardCollapsed && (
                                    <div style={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        background: '#0d0f19',
                                        padding: '16px 20px',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '600', color: '#fff' }}>
                                                <span style={{ width: '6px', height: '6px', backgroundColor: '#eab308', borderRadius: '50%' }}></span>
                                                Whiteboard
                                            </div>
                                            
                                            {isHost ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button 
                                                        onClick={handleClearWhiteboard}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.08)',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                                            borderRadius: '20px',
                                                            padding: '4px 12px',
                                                            fontSize: '11px',
                                                            color: '#ef4444',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                    <button 
                                                        onClick={() => setDrawActive(!drawActive)}
                                                        style={{
                                                            background: drawActive ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '20px',
                                                            padding: '4px 14px',
                                                            fontSize: '11px',
                                                            color: '#fff',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        ✎ Draw
                                                    </button>
                                                    <button
                                                        onClick={() => whiteboardPanelRef.current?.collapse()}
                                                        title="Collapse Whiteboard"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'rgba(255, 255, 255, 0.4)',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.color = '#fff'}
                                                        onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                                                    >
                                                        ▲
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase' }}>
                                                        view only
                                                    </span>
                                                    <button
                                                        onClick={() => whiteboardPanelRef.current?.collapse()}
                                                        title="Collapse Whiteboard"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'rgba(255, 255, 255, 0.4)',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.color = '#fff'}
                                                        onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                                                    >
                                                        ▲
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Interactive Sync Canvas */}
                                        <div style={{
                                            flex: 1,
                                            backgroundColor: 'rgba(0,0,0,0.25)',
                                            borderRadius: '12px',
                                            border: '1px dashed rgba(255,255,255,0.1)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <canvas
                                                ref={canvasRef}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'block',
                                                    cursor: isHost && drawActive ? 'crosshair' : 'default',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Panel>

                            {/* Divider Handle */}
                            <PanelResizeHandle className="resize-handle-vertical" />

                            {/* Bottom Panel: Problem description */}
                            <Panel 
                                ref={problemPanelRef}
                                defaultSize={50}
                                minSize={10}
                                collapsible={true}
                                onCollapse={() => setProblemCollapsed(true)}
                                onExpand={() => setProblemCollapsed(false)}
                            >
                                {!problemCollapsed && (
                                    <div style={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxSizing: 'border-box',
                                        background: '#0d0f19'
                                    }}>
                                        {/* Problem Panel Header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px 8px 20px',
                                        }}>
                                            <div style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                letterSpacing: '0.8px',
                                                color: isHost ? 'rgba(255,255,255,0.3)' : '#10b981',
                                                textTransform: 'uppercase'
                                            }}>
                                                {isHost ? 'PUSH PROBLEM' : 'PROBLEM'}
                                            </div>
                                            <button
                                                onClick={() => problemPanelRef.current?.collapse()}
                                                title="Collapse Problem"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'rgba(255, 255, 255, 0.4)',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => e.target.style.color = '#fff'}
                                                onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                                            >
                                                ▼
                                            </button>
                                        </div>
                                        
                                        {/* Problem Panel Content */}
                                        <div style={{
                                            flex: 1,
                                            padding: '0 20px 20px 20px',
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {isHost ? (
                                                <form onSubmit={handlePushProblem} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                    <textarea
                                                        value={problemInput}
                                                        onChange={(e) => setProblemInput(e.target.value)}
                                                        placeholder="Given nums and target, return indices of two numbers..."
                                                        required
                                                        style={{
                                                            flex: 1,
                                                            width: '100%',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            borderRadius: '10px',
                                                            color: '#fff',
                                                            padding: '12px 16px',
                                                            fontSize: '14.5px',
                                                            lineHeight: '1.5',
                                                            fontFamily: 'inherit',
                                                            resize: 'none',
                                                            outline: 'none',
                                                            marginBottom: '12px'
                                                        }}
                                                    />
                                                    
                                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Add boilerplate context if any..." 
                                                            value={boilerplateInput}
                                                            onChange={(e) => setBoilerplateInput(e.target.value)}
                                                            style={{
                                                                flex: 1,
                                                                background: 'rgba(0,0,0,0.2)',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                borderRadius: '8px',
                                                                color: '#fff',
                                                                padding: '8px 12px',
                                                                fontSize: '12.5px',
                                                                fontFamily: 'ui-monospace, monospace',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                    </div>

                                                    <button type="submit" style={{
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        padding: '10px 0',
                                                        borderRadius: '30px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        🚀 Push to all learners
                                                    </button>
                                                </form>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                                                    <div style={{
                                                        fontSize: '14.5px',
                                                        color: '#f3f4f6',
                                                        lineHeight: '1.6',
                                                        fontWeight: '500',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {currentProblem}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Panel>

                        </PanelGroup>
                            </>
                        )}
                    </Panel>

                </PanelGroup>

                {rightPanelCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
                        <div 
                            className="collapsed-tab-vertical" 
                            onClick={() => {
                                rightPanelRef.current?.expand();
                                whiteboardPanelRef.current?.expand();
                            }}
                            title="Expand Whiteboard"
                            style={{ flex: 1, borderLeft: '1px solid rgba(255, 255, 255, 0.05)' }}
                        >
                            <div className="collapsed-tab-vertical-text">
                                <span>🎨</span> Whiteboard
                            </div>
                        </div>
                        <div 
                            className="collapsed-tab-vertical" 
                            onClick={() => {
                                rightPanelRef.current?.expand();
                                problemPanelRef.current?.expand();
                            }}
                            title="Expand Problem Description"
                            style={{ flex: 1, borderLeft: '1px solid rgba(255, 255, 255, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
                        >
                            <div className="collapsed-tab-vertical-text">
                                <span>📝</span> Problem
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
