import React, { useState, useEffect, useRef, useContext } from 'react';
import { SharedDocContext } from '../providers/YjsContext.jsx';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import Editor from '@monaco-editor/react';
import { Languages } from '../constants.js';

function useCardCompression() {
    const ref = useRef(null);
    const [isCompressedH, setIsCompressedH] = useState(false);
    const [isCompressedV, setIsCompressedV] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setIsCompressedH(width <= 65);
                setIsCompressedV(height <= 65);
            }
        });
        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, []);

    return { ref, isCompressedH, isCompressedV };
}

function DevroomCard({ title, subtitle, name, icon, color, fontSize, isCompressedH, isCompressedV, headerActions, children }) {
    if (isCompressedH) {
        return (
            <div className="devroom-card">
                <div className="devroom-card-info" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div className="vertical-tab" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <span style={{ fontSize: '16px', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: icon }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{name}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isCompressedV) {
        const isTestResult = name === 'Test Result';
        return (
            <div className="devroom-card">
                <div className="devroom-card-info" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: isTestResult ? 'flex-start' : 'center',
                        paddingLeft: isTestResult ? '2%' : '10px',
                        gap: '8px',
                        width: '100%',
                        height: '100%',
                        color: '#fff'
                    }}>
                        <span style={{ fontSize: '16px', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: icon }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{name}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="devroom-card">
            <div className="devroom-card-info" style={{ padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                {/* Header Band */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: icon }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{name}</span>
                    </div>
                    {headerActions && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {headerActions}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: children ? 'stretch' : 'center',
                    justifyContent: children ? 'stretch' : 'center',
                    padding: children ? 0 : (title === 'Inner Dashboard Panel' ? '12px 20px' : '30px 40px'),
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    height: '100%',
                    width: '100%'
                }}>
                    {children ? children : (
                        title === 'Inner Dashboard Panel' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{title}</div>
                                <div className="subtitle" style={{ marginTop: '2px', fontSize: '11px' }}>{subtitle}</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: fontSize || '20px', fontWeight: 600, textShadow: '0 4px 20px rgba(0, 0, 0, 0.95)' }}>{title}</div>
                                <div className="subtitle">{subtitle}</div>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function ResizableCardWrapper({ children, className, style, ...props }) {
    const { ref, isCompressedH, isCompressedV } = useCardCompression();
    
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { isCompressedH, isCompressedV });
        }
        return child;
    });

    return (
        <div ref={ref} className={className} style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', ...style }} {...props}>
            {childrenWithProps}
        </div>
    );
}

// Lightweight dropdown menu implementation
function DropdownMenu({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            if (child.type === DropdownMenuTrigger) {
                return React.cloneElement(child, { isOpen, setIsOpen });
            }
            if (child.type === DropdownMenuContent) {
                return React.cloneElement(child, { isOpen, setIsOpen });
            }
        }
        return child;
    });

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
            {childrenWithProps}
        </div>
    );
}

function DropdownMenuTrigger({ isOpen, setIsOpen, render, children }) {
    const element = render || children;
    return React.cloneElement(element, {
        onClick: (e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    });
}

function DropdownMenuContent({ isOpen, setIsOpen, className, style, align, children }) {
    if (!isOpen) return null;
    return (
        <div 
            className={className} 
            style={{
                position: 'absolute',
                top: '100%',
                left: align === 'end' ? 'auto' : 0,
                right: align === 'end' ? 0 : 'auto',
                marginTop: '6px',
                zIndex: 100,
                background: '#0d0f19',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                padding: '4px',
                minWidth: '140px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                boxSizing: 'border-box',
                ...style
            }}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { setIsOpen });
                }
                return child;
            })}
        </div>
    );
}

function DropdownMenuGroup({ children, setIsOpen }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { setIsOpen });
                }
                return child;
            })}
        </div>
    );
}

function DropdownMenuLabel({ children }) {
    return (
        <div style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            userSelect: 'none'
        }}>
            {children}
        </div>
    );
}

function DropdownMenuItem({ onClick, setIsOpen, children, disabled }) {
    const handleClick = (e) => {
        if (disabled) return;
        if (onClick) onClick(e);
        if (setIsOpen) setIsOpen(false);
    };

    return (
        <div 
            onClick={handleClick}
            style={{
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                userSelect: 'none'
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#fff';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }
            }}
        >
            {children}
        </div>
    );
}

function DropdownMenuSeparator() {
    return (
        <div style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.08)',
            margin: '4px 0'
        }} />
    );
}

export default function CodingRoom({ roomId, currentUser, onLeaveRoom }) {
    const { doc: sharedDoc, users } = useContext(SharedDocContext);
    console.log("Connected users:", users);

    const [isHost, setIsHost] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editorLanguage, setEditorLanguage] = useState('javascript');
    const [problemDescription, setProblemDescription] = useState(
        `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`
    );
    const [case1Input, setCase1Input] = useState('nums = [2,7,11,15], target = 9');
    const [case1Output, setCase1Output] = useState('[0,1]');
    const [case2Input, setCase2Input] = useState('nums = [3,2,4], target = 6');
    const [case2Output, setCase2Output] = useState('[1,2]');

    // Code execution & AI Review states
    const [testPassedCount, setTestPassedCount] = useState(0);
    const testTotalCount = 3;
    const [executionError, setExecutionError] = useState('');
    const [isRunningCode, setIsRunningCode] = useState(false);
    const [runStatus, setRunStatus] = useState('idle'); // 'idle' | 'running' | 'success' | 'failed'
    const [aiOverviewText, setAiOverviewText] = useState('');
    const [isLoadingAiOverview, setIsLoadingAiOverview] = useState(false);

    const handleRunCode = () => {
        setIsRunningCode(true);
        setRunStatus('running');
        setExecutionError('');
        setAiOverviewText('');
        
        setTimeout(() => {
            setIsRunningCode(false);
            const succeed = Math.random() > 0.4;
            if (succeed) {
                setTestPassedCount(3);
                setRunStatus('success');
                setExecutionError('All tests passed successfully.\n\nTest Case 1: Success\nTest Case 2: Success\nTest Case 3: Success');
            } else {
                setTestPassedCount(1);
                setRunStatus('failed');
                setExecutionError('Runtime Error: TypeError: Cannot read properties of undefined (reading \'length\')\n    at twoSum (solution.js:12:21)\n    at Object.<anonymous> (solution.js:25:13)\n    at Module._compile (internal/modules/cjs/loader.js:1137:30)');
            }
        }, 1500);
    };

    const handleSubmitCode = () => {
        setIsRunningCode(true);
        setRunStatus('running');
        setExecutionError('');
        setAiOverviewText('');

        setTimeout(() => {
            setIsRunningCode(false);
            const succeed = Math.random() > 0.3;
            if (succeed) {
                setTestPassedCount(3);
                setRunStatus('success');
                setExecutionError('Submission Accepted!\n\nRuntime: 76 ms (Beats 84.2% of Javascript submissions)\nMemory: 42.1 MB (Beats 91.5% of Javascript submissions)');
            } else {
                setTestPassedCount(2);
                setRunStatus('failed');
                setExecutionError('AssertionError: expected [ 0, 2 ] to deeply equal [ 1, 2 ]\n    at Context.<anonymous> (solution_test.js:18:24)\n    at processImmediate (internal/timers.js:464:21)');
            }
        }, 2000);
    };

    const handleAiReview = () => {
        if (runStatus === 'idle') {
            alert('Please run the code first to generate an AI review.');
            return;
        }
        setIsLoadingAiOverview(true);
        setAiOverviewText('');

        setTimeout(() => {
            setIsLoadingAiOverview(false);
            if (runStatus === 'success') {
                setAiOverviewText('🤖 AI Code Review (Success)\n\n• Algorithm Analysis: Your implementation of the Two Sum algorithm is optimal (using a Single-Pass Hash Map which yields O(N) time complexity and O(N) space complexity).\n• Code Cleanliness: The structure is clean and correctly returns indices. Variable names are descriptive.\n• Improvement: Make sure to check for empty or null inputs at the beginning of the function to ensure robustness.');
            } else {
                setAiOverviewText('🤖 AI Bug Analysis & Review (Failure)\n\n• Error Explanation: The error indicates a TypeError or AssertionError. This occurs when you try to access properties of undefined or return incorrect indices.\n• Potential Cause: Make sure your map logic stores and checks indices correctly (map.has(target - nums[i])).\n• Hint: Verify if you are returning the 0-indexed values in the correct order, and check if your map storage handles 0 values properly.');
            }
        }, 1200);
    };

    const handlePushDescription = () => {
        if (!isHost) {
            alert('Access Denied: Only the session host is authorized to push description updates.');
            return;
        }
        if (!sharedDoc) {
            alert('Yjs not connected.');
            return;
        }
        const yDescMap = sharedDoc.getMap('description-data');
        sharedDoc.transact(() => {
            yDescMap.set('problemDescription', problemDescription);
            yDescMap.set('case1Input', case1Input);
            yDescMap.set('case1Output', case1Output);
            yDescMap.set('case2Input', case2Input);
            yDescMap.set('case2Output', case2Output);
        });
        alert('Description & Test Cases pushed successfully!');
    };

    useEffect(() => {
        if (!sharedDoc) return;
        const yDescMap = sharedDoc.getMap('description-data');

        // Initial fetch from Yjs Map on mount
        const initialDesc = yDescMap.get('problemDescription');
        if (initialDesc !== undefined) setProblemDescription(initialDesc);
        const initialC1In = yDescMap.get('case1Input');
        if (initialC1In !== undefined) setCase1Input(initialC1In);
        const initialC1Out = yDescMap.get('case1Output');
        if (initialC1Out !== undefined) setCase1Output(initialC1Out);
        const initialC2In = yDescMap.get('case2Input');
        if (initialC2In !== undefined) setCase2Input(initialC2In);
        const initialC2Out = yDescMap.get('case2Output');
        if (initialC2Out !== undefined) setCase2Output(initialC2Out);

        const handleObserve = (event) => {
            if (event.transaction.local) return;

            const desc = yDescMap.get('problemDescription');
            const c1In = yDescMap.get('case1Input');
            const c1Out = yDescMap.get('case1Output');
            const c2In = yDescMap.get('case2Input');
            const c2Out = yDescMap.get('case2Output');

            if (desc !== undefined) setProblemDescription(desc);
            if (c1In !== undefined) setCase1Input(c1In);
            if (c1Out !== undefined) setCase1Output(c1Out);
            if (c2In !== undefined) setCase2Input(c2In);
            if (c2Out !== undefined) setCase2Output(c2Out);
        };

        yDescMap.observe(handleObserve);
        return () => {
            yDescMap.unobserve(handleObserve);
        };
    }, [sharedDoc]);

    const canvasCleanupRef = useRef(null);

    useEffect(() => {
        return () => {
            if (canvasCleanupRef.current) {
                canvasCleanupRef.current();
            }
        };
    }, []);

    const containerRef = useRef(null);
    const leftPanelRef = useRef(null);
    const leftBottomRef = useRef(null);
    const rightStackRef = useRef(null);
    const rightTopRef = useRef(null);

    const hHandleRef = useRef(null);
    const vHandleRef = useRef(null);
    const vHandleLeftRef = useRef(null);

    const handleLeave = async () => {
        try {
            await fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' });
        } catch (err) {
            console.error("Error leaving room on backend:", err);
        }
        onLeaveRoom();
    };

    useEffect(() => {
        fetch(`/api/rooms/${roomId}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setIsHost(data.data.isHost);
                }
            })
            .catch(err => console.error("Error fetching room details:", err))
            .finally(() => setLoading(false));
    }, [roomId]);

    // Resizer logic
    const handleMouseDownH = (e) => {
        e.preventDefault();
        const handle = hHandleRef.current;
        if (handle) handle.classList.add('active');

        const containerRect = containerRef.current.getBoundingClientRect();

        const handleMouseMove = (moveEvent) => {
            let newWidth = moveEvent.clientX - containerRect.left;
            if (newWidth < 60) newWidth = 60;
            if (newWidth > containerRect.width - 60) newWidth = containerRect.width - 60;
            
            if (leftPanelRef.current) {
                leftPanelRef.current.style.width = `${newWidth}px`;
            }
        };

        const handleMouseUp = () => {
            if (handle) handle.classList.remove('active');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDownV = (e) => {
        e.preventDefault();
        const handle = vHandleRef.current;
        if (handle) handle.classList.add('active');

        const stackRect = rightStackRef.current.getBoundingClientRect();

        const handleMouseMove = (moveEvent) => {
            let newHeight = moveEvent.clientY - stackRect.top;
            if (newHeight < 60) newHeight = 60;
            if (newHeight > stackRect.height - 60) newHeight = stackRect.height - 60;
            
            if (rightTopRef.current) {
                rightTopRef.current.style.height = `${newHeight}px`;
            }
        };

        const handleMouseUp = () => {
            if (handle) handle.classList.remove('active');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDownVLeft = (e) => {
        e.preventDefault();
        const handle = vHandleLeftRef.current;
        if (handle) handle.classList.add('active');

        const leftRect = leftPanelRef.current.getBoundingClientRect();
        const handleRect = vHandleLeftRef.current.getBoundingClientRect();

        const handleMouseMove = (moveEvent) => {
            let newBottomHeight = leftRect.bottom - moveEvent.clientY - (handleRect.height / 2);
            const minBottomHeight = 60;
            const maxBottomHeight = leftRect.height / 2;
            
            if (newBottomHeight < minBottomHeight) newBottomHeight = minBottomHeight;
            if (newBottomHeight > maxBottomHeight) newBottomHeight = maxBottomHeight;
            
            if (leftBottomRef.current) {
                leftBottomRef.current.style.height = `${newBottomHeight}px`;
            }
        };

        const handleMouseUp = () => {
            if (handle) handle.classList.remove('active');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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
            background: '#000',
            overflow: 'hidden',
            position: 'relative'
        }}>
            
            {/* Header Navigation Bar */}
            <header className="experiment-header">
                <div className="header-inner">
                    <div className="header-left">
                        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <img src="/collaboration.png" alt="Devrooms Icon" style={{ width: '22px', height: '22px', marginRight: '8px', borderRadius: '4px', objectFit: 'contain' }} />
                            <span className="logo">Devrooms</span>
                        </div>
                        <span 
                            className="room-id" 
                            style={{ cursor: 'pointer' }}
                            title={`Click to copy Session ID: #${roomId}`}
                            onClick={(e) => {
                                navigator.clipboard.writeText(roomId);
                                const original = e.target.innerText;
                                e.target.innerText = 'Copied!';
                                setTimeout(() => {
                                    e.target.innerText = original;
                                }, 1200);
                            }}
                            onMouseEnter={(e) => { e.target.innerText = `#${roomId}` }}
                            onMouseLeave={(e) => { e.target.innerText = 'sessionID' }}
                        >
                            sessionID
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isHost ? (
                            <>
                                {/* Host red tag with crown icon and name */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#ef4444',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '15px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    userSelect: 'none'
                                }}>
                                    <i className="fa-solid fa-crown" style={{ color: '#ef4444' }}></i>
                                    {currentUser?.displayName || currentUser?.firstName || 'Host'}
                                </div>
                                {/* Single green participant badge showing count of participants (excluding host) */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#10b981',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '15px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    userSelect: 'none'
                                }}>
                                    <i className="fa-solid fa-user" style={{ color: '#10b981' }}></i>
                                    {users.filter(u => u.name && u.name !== (currentUser?.displayName || currentUser?.firstName)).length}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Participant only: green tag, user icon, and name */}
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#10b981',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '15px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    userSelect: 'none'
                                }}>
                                    <i className="fa-solid fa-user" style={{ color: '#10b981' }}></i>
                                    {currentUser?.displayName || currentUser?.firstName || 'Me'}
                                </div>
                            </>
                        )}
                        <button className="btn-end-session" onClick={handleLeave}>
                            <span className="logout-btn-glow"></span>
                            {isHost ? 'End Session' : 'Leave'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Rain Background Overlay Container */}
            <div className="session-hidden-bg">
                
                {/* Main Resizable Panel Layout */}
                <div ref={containerRef} className="experiment-layout-flex">
                    
                    {/* Left Column: Left Workspace Panel & Inner Dashboard Panel */}
                    <div ref={leftPanelRef} id="left-panel" style={{ width: '60%', minWidth: '60px', display: 'flex', flexDirection: 'column' }}>
                        <div id="left-top" style={{ flex: 1, minHeight: '60px', display: 'flex', flexDirection: 'column' }}>
                            <ResizableCardWrapper style={{ padding: '0 0 5px 0' }}>
                                <DevroomCard 
                                    title="Left Workspace Panel"
                                    subtitle="Encompasses the primary work environment layout."
                                    name="Code"
                                    icon='<i class="fa-solid fa-code"></i>'
                                    color="#10b981"
                                    fontSize="24px"
                                    headerActions={
                                        <>
                                            <button 
                                                disabled={isRunningCode}
                                                style={{
                                                    backgroundColor: '#271010',
                                                    color: '#fca5a5',
                                                    border: '1px solid #ef4444',
                                                    borderBottomWidth: '3px',
                                                    fontWeight: '600',
                                                    fontSize: '11px',
                                                    padding: '4px 12px',
                                                    borderRadius: '15px',
                                                    outline: 'none',
                                                    cursor: isRunningCode ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box',
                                                    opacity: isRunningCode ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isRunningCode) {
                                                        e.currentTarget.style.borderTopWidth = '3px';
                                                        e.currentTarget.style.borderBottomWidth = '1px';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isRunningCode) {
                                                        e.currentTarget.style.borderTopWidth = '1px';
                                                        e.currentTarget.style.borderBottomWidth = '3px';
                                                    }
                                                }}
                                                onClick={handleRunCode}
                                            >
                                                <i className="fa-solid fa-play" style={{ color: '#ef4444', marginRight: '6px', fontSize: '11px' }}></i>
                                                {isRunningCode && runStatus === 'running' ? 'Running...' : 'Run'}
                                            </button>
                                            <button 
                                                disabled={isRunningCode}
                                                style={{
                                                    backgroundColor: '#062d1d',
                                                    color: '#a7f3d0',
                                                    border: '1px solid #10b981',
                                                    borderBottomWidth: '3px',
                                                    fontWeight: '600',
                                                    fontSize: '11px',
                                                    padding: '4px 12px',
                                                    borderRadius: '15px',
                                                    outline: 'none',
                                                    cursor: isRunningCode ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box',
                                                    opacity: isRunningCode ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isRunningCode) {
                                                        e.currentTarget.style.borderTopWidth = '3px';
                                                        e.currentTarget.style.borderBottomWidth = '1px';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isRunningCode) {
                                                        e.currentTarget.style.borderTopWidth = '1px';
                                                        e.currentTarget.style.borderBottomWidth = '3px';
                                                    }
                                                }}
                                                onClick={handleSubmitCode}
                                            >
                                                <i className="fa-solid fa-arrow-up-from-bracket" style={{ color: '#10b981', marginRight: '6px', fontSize: '11px' }}></i>
                                                Submit
                                            </button>
                                        </>
                                    }
                                >
                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        {/* Sub-header / Toolbar for language selection */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            padding: '8px 16px',
                                            background: '#0d0f19',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontSize: '13px',
                                            boxSizing: 'border-box'
                                        }}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <button style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            outline: 'none',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: 0
                                                        }}>
                                                            <span>{Languages[editorLanguage]?.label || editorLanguage}</span>
                                                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}></i>
                                                        </button>
                                                    }
                                                />
                                                <DropdownMenuContent className="w-40" align="start">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Languages</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {Object.keys(Languages).map((langKey) => (
                                                            <DropdownMenuItem 
                                                                key={langKey}
                                                                onClick={() => {
                                                                    setEditorLanguage(langKey);
                                                                }}
                                                            >
                                                                {Languages[langKey].label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Editor Container */}
                                        <div style={{ flex: 1, position: 'relative', width: '100%' }}>
                                            <Editor 
                                                height="100%" 
                                                language={editorLanguage}
                                                value={Languages[editorLanguage]?.code || ''}
                                                theme="vs-dark"
                                            />
                                        </div>
                                    </div>
                                </DevroomCard>
                            </ResizableCardWrapper>
                        </div>

                        <div ref={vHandleLeftRef} className="resize-handle-v" id="v-handle-left" onMouseDown={handleMouseDownVLeft}>
                            <div className="handle-bar-v"></div>
                        </div>

                        <div ref={leftBottomRef} id="left-bottom" style={{ height: '220px', minHeight: '60px', flexShrink: 0, padding: '0 0.5px 0.5px 0.5px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                            <ResizableCardWrapper>
                                <DevroomCard 
                                    title="Test Output Feed"
                                    subtitle="Execution output and testing metrics."
                                    name="Test Result"
                                    icon='<i class="fa-solid fa-terminal"></i>'
                                    color="#f97316"
                                    fontSize="14px"
                                >
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        background: '#090b10',
                                        color: '#cbd5e1',
                                        fontFamily: 'monospace',
                                        fontSize: '13px',
                                        textAlign: 'left',
                                        boxSizing: 'border-box'
                                    }}>
                                        {/* Status Header Bar */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 16px',
                                            background: '#0e1117',
                                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                                            flexShrink: 0
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                {/* Test Cases Count */}
                                                <div>
                                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Passed:</span>{' '}
                                                    <span style={{ color: runStatus === 'success' ? '#10b981' : (runStatus === 'failed' ? '#ef4444' : '#94a3b8'), fontWeight: 'bold' }}>
                                                        {testPassedCount} / {testTotalCount}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* AI Review Trigger Button */}
                                            <button
                                                onClick={handleAiReview}
                                                disabled={runStatus === 'idle' || isLoadingAiOverview}
                                                style={{
                                                    backgroundColor: '#0f203a',
                                                    color: '#bfdbfe',
                                                    border: '1px solid #3b82f6',
                                                    borderBottomWidth: '3px',
                                                    fontWeight: '600',
                                                    fontSize: '11px',
                                                    padding: '4px 12px',
                                                    borderRadius: '15px',
                                                    outline: 'none',
                                                    cursor: (runStatus === 'idle' || isLoadingAiOverview) ? 'not-allowed' : 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box',
                                                    opacity: (runStatus === 'idle' || isLoadingAiOverview) ? 0.5 : 1,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (runStatus !== 'idle' && !isLoadingAiOverview) {
                                                        e.currentTarget.style.borderTopWidth = '3px';
                                                        e.currentTarget.style.borderBottomWidth = '1px';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (runStatus !== 'idle' && !isLoadingAiOverview) {
                                                        e.currentTarget.style.borderTopWidth = '1px';
                                                        e.currentTarget.style.borderBottomWidth = '3px';
                                                    }
                                                }}
                                            >
                                                {isLoadingAiOverview ? (
                                                    <>
                                                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px', fontSize: '11px' }}></i>
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#3b82f6', marginRight: '6px', fontSize: '11px' }}></i>
                                                        AI Review
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Main Content Pane */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px 16px', gap: '12px' }}>
                                            {isLoadingAiOverview || aiOverviewText ? (
                                                /* AI Review Screen (Overshadows console & metrics) */
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '8px',
                                                        flexShrink: 0
                                                    }}>
                                                        <div style={{ color: '#93c5fd', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <i className="fa-solid fa-wand-magic-sparkles"></i> AI Review Overview
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setAiOverviewText('');
                                                                setIsLoadingAiOverview(false);
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'rgba(255, 255, 255, 0.5)',
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                                                        >
                                                            <i className="fa-solid fa-arrow-left"></i> Back to Console
                                                        </button>
                                                    </div>

                                                    <div style={{
                                                        flex: 1,
                                                        background: 'rgba(59, 130, 246, 0.04)',
                                                        border: '1px dashed rgba(59, 130, 246, 0.25)',
                                                        borderRadius: '6px',
                                                        padding: '12px',
                                                        overflowY: 'auto',
                                                        boxSizing: 'border-box',
                                                        color: '#bfdbfe',
                                                        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                                                        fontSize: '13px',
                                                        lineHeight: '1.6'
                                                    }}>
                                                        {isLoadingAiOverview ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '100%', color: '#60a5fa' }}>
                                                                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '16px' }}></i>
                                                                <span>AI is analyzing your solution code...</span>
                                                            </div>
                                                        ) : (
                                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                                {aiOverviewText}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Normal Console / Test Cases View */
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Console Output</div>
                                                    <textarea
                                                        readOnly
                                                        value={executionError || (runStatus === 'idle' ? 'No code execution logs yet. Click "Run" or "Submit" to start.' : 'Running code and executing assertions...')}
                                                        style={{
                                                            width: '100%',
                                                            flex: 1,
                                                            minHeight: '80px',
                                                            background: '#05070a',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            borderRadius: '4px',
                                                            padding: '8px',
                                                            color: runStatus === 'failed' ? '#f87171' : (runStatus === 'success' ? '#34d399' : '#94a3b8'),
                                                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', Consolas, Monaco, monospace",
                                                            fontSize: '13px',
                                                            resize: 'none',
                                                            outline: 'none',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DevroomCard>
                            </ResizableCardWrapper>
                        </div>
                    </div>

                    <div ref={hHandleRef} className="resize-handle-h" id="h-handle" onMouseDown={handleMouseDownH}>
                        <div className="handle-bar-h"></div>
                    </div>

                    {/* Right Column: Right Top Panel & Right Bottom Panel */}
                    <div ref={rightStackRef} id="right-stack" style={{ flex: 1, minWidth: '60px', display: 'flex', flexDirection: 'column' }}>
                        <div ref={rightTopRef} id="right-top" style={{ height: '50%', minHeight: '60px', display: 'flex', flexDirection: 'column' }}>
                            <ResizableCardWrapper style={{ padding: '0 0 5px 0' }}>
                                <DevroomCard 
                                    title="Right Top Panel"
                                    subtitle="Secondary utility control modules."
                                    name="Canvas"
                                    icon='<i class="fa-solid fa-paintbrush"></i>'
                                    color="#ef4444"
                                    fontSize="20px"
                                >
                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                         <Tldraw
                                             onMount={(editor) => {
                                                 editor.selectAll();
                                                 if (sharedDoc) {
                                                     const yStoreMap = sharedDoc.getMap('tldraw-store');
                                                     const initialRecords = Array.from(yStoreMap.values());
                                                     if (initialRecords.length > 0) {
                                                         editor.store.mergeRemoteChanges(() => {
                                                             editor.store.put(initialRecords);
                                                         });
                                                     }
                                                     const handleYjsUpdate = (event) => {
                                                         editor.store.mergeRemoteChanges(() => {
                                                             event.changes.keys.forEach((change, key) => {
                                                                 if (change.action === 'add' || change.action === 'update') {
                                                                     const record = yStoreMap.get(key);
                                                                     if (record) {
                                                                         editor.store.put([record]);
                                                                     }
                                                                 } else if (change.action === 'delete') {
                                                                     editor.store.remove([key]);
                                                                 }
                                                             });
                                                         });
                                                     };
                                                     yStoreMap.observe(handleYjsUpdate);
                                                     const cleanupStoreListen = editor.store.listen((entry) => {
                                                         if (entry.source !== 'user') return;
                                                         sharedDoc.transact(() => {
                                                             Object.entries(entry.changes.added).forEach(([id, record]) => {
                                                                 yStoreMap.set(id, record);
                                                             });
                                                             Object.entries(entry.changes.updated).forEach(([id, [, to]]) => {
                                                                 yStoreMap.set(id, to);
                                                             });
                                                             Object.keys(entry.changes.removed).forEach((id) => {
                                                                 yStoreMap.delete(id);
                                                             });
                                                         });
                                                     }, { source: 'user', scope: 'all' });
                                                     canvasCleanupRef.current = () => {
                                                         yStoreMap.unobserve(handleYjsUpdate);
                                                         cleanupStoreListen();
                                                     };
                                                 }
                                             }}
                                         />
                                    </div>
                                </DevroomCard>
                            </ResizableCardWrapper>
                        </div>

                        <div ref={vHandleRef} className="resize-handle-v" id="v-handle" onMouseDown={handleMouseDownV}>
                            <div className="handle-bar-v"></div>
                        </div>

                        <div id="right-bottom" style={{ flex: 1, minHeight: '60px', display: 'flex', flexDirection: 'column' }}>
                            <ResizableCardWrapper>
                                <DevroomCard 
                                    title="Right Bottom Panel"
                                    subtitle="Problem details & console feeds."
                                    name="Description"
                                    icon='<i class="fa-solid fa-file-lines"></i>'
                                    color="#3b82f6"
                                    fontSize="20px"
                                >
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        padding: '16px',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        justifyContent: 'flex-start',
                                        overflowY: 'auto'
                                    }}>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: '#fff',
                                            marginBottom: '10px',
                                            textAlign: 'left'
                                        }}>
                                            Problem Statement
                                        </div>
                                        
                                        {/* Editable Textarea */}
                                        <textarea
                                            value={problemDescription}
                                            onChange={(e) => setProblemDescription(e.target.value)}
                                            readOnly={!isHost}
                                            disabled={!isHost}
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                background: isHost ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                borderRadius: '8px',
                                                padding: '12px 14px',
                                                color: isHost ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '13px',
                                                lineHeight: '1.6',
                                                fontFamily: 'inherit',
                                                resize: 'none',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                marginBottom: '16px',
                                                flexShrink: 0,
                                                cursor: isHost ? 'text' : 'not-allowed'
                                            }}
                                        />

                                        {/* Sample Input/Output Cases */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', flexShrink: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                                                Sample Test Cases
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {/* Case 1 */}
                                                <div style={{
                                                    background: 'rgba(255, 255, 255, 0.01)',
                                                    border: '1px solid rgba(255, 255, 255, 0.04)',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '12px',
                                                    fontFamily: 'monospace',
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '6px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <strong style={{ color: '#3b82f6', minWidth: '55px', userSelect: 'none' }}>Input:</strong>
                                                        <input 
                                                            type="text" 
                                                            value={case1Input} 
                                                            onChange={(e) => setCase1Input(e.target.value)}
                                                            readOnly={!isHost}
                                                            disabled={!isHost}
                                                            style={{
                                                                background: isHost ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                color: isHost ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                                                fontFamily: 'monospace',
                                                                fontSize: '12px',
                                                                outline: 'none',
                                                                flex: 1,
                                                                boxSizing: 'border-box',
                                                                cursor: isHost ? 'text' : 'not-allowed'
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <strong style={{ color: '#10b981', minWidth: '55px', userSelect: 'none' }}>Output:</strong>
                                                        <input 
                                                            type="text" 
                                                            value={case1Output} 
                                                            onChange={(e) => setCase1Output(e.target.value)}
                                                            readOnly={!isHost}
                                                            disabled={!isHost}
                                                            style={{
                                                                background: isHost ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                color: isHost ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                                                fontFamily: 'monospace',
                                                                fontSize: '12px',
                                                                outline: 'none',
                                                                flex: 1,
                                                                boxSizing: 'border-box',
                                                                cursor: isHost ? 'text' : 'not-allowed'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Case 2 */}
                                                <div style={{
                                                    background: 'rgba(255, 255, 255, 0.01)',
                                                    border: '1px solid rgba(255, 255, 255, 0.04)',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '12px',
                                                    fontFamily: 'monospace',
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '6px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <strong style={{ color: '#3b82f6', minWidth: '55px', userSelect: 'none' }}>Input:</strong>
                                                        <input 
                                                            type="text" 
                                                            value={case2Input} 
                                                            onChange={(e) => setCase2Input(e.target.value)}
                                                            readOnly={!isHost}
                                                            disabled={!isHost}
                                                            style={{
                                                                background: isHost ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                color: isHost ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                                                fontFamily: 'monospace',
                                                                fontSize: '12px',
                                                                outline: 'none',
                                                                flex: 1,
                                                                boxSizing: 'border-box',
                                                                cursor: isHost ? 'text' : 'not-allowed'
                                                            }}
                                                        />
                                                     </div>
                                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                         <strong style={{ color: '#10b981', minWidth: '55px', userSelect: 'none' }}>Output:</strong>
                                                         <input 
                                                             type="text" 
                                                             value={case2Output} 
                                                             onChange={(e) => setCase2Output(e.target.value)}
                                                             readOnly={!isHost}
                                                             disabled={!isHost}
                                                             style={{
                                                                 background: isHost ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                                                                 border: '1px solid rgba(255, 255, 255, 0.05)',
                                                                 borderRadius: '4px',
                                                                 padding: '4px 8px',
                                                                 color: isHost ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                                                 fontFamily: 'monospace',
                                                                 fontSize: '12px',
                                                                 outline: 'none',
                                                                 flex: 1,
                                                                 boxSizing: 'border-box',
                                                                 cursor: isHost ? 'text' : 'not-allowed'
                                                             }}
                                                         />
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Push Button Container */}
                                        {isHost && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', flexShrink: 0 }}>
                                                <button 
                                                    style={{
                                                        backgroundColor: '#0f203a',
                                                        color: '#bfdbfe',
                                                        border: '1px solid #3b82f6',
                                                        borderBottomWidth: '4px',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        padding: '10px 24px',
                                                        borderRadius: '30px',
                                                        outline: 'none',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderTopWidth = '4px';
                                                        e.currentTarget.style.borderBottomWidth = '1px';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderTopWidth = '1px';
                                                        e.currentTarget.style.borderBottomWidth = '4px';
                                                    }}
                                                    onClick={handlePushDescription}
                                                >
                                                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#3b82f6', marginRight: '8px', fontSize: '14px' }}></i>
                                                    Push
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </DevroomCard>
                            </ResizableCardWrapper>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
