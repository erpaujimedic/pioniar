import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minus } from 'lucide-react';

export default function WinBoxWindow({ 
  id, 
  title, 
  icon, 
  children, 
  initialX = 50, 
  initialY = 50, 
  initialWidth = 800, 
  initialHeight = 500,
  initialMaximized = false,
  isActive,
  isMinimized,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  forcedX,
  forcedY,
  forcedW,
  forcedH,
  layoutId
}) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false); // stores direction 'se', 'e', etc.
  const [isMaximized, setIsMaximized] = useState(initialMaximized);
  
  useEffect(() => {
    if (layoutId) {
      if (forcedX !== undefined && forcedY !== undefined) {
        setPos({ x: forcedX, y: forcedY });
      }
      if (forcedW !== undefined && forcedH !== undefined) {
        setSize({ w: forcedW, h: forcedH });
      }
      setIsMaximized(false);
    }
  }, [layoutId]);
  
  const windowRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, pos: { x: 0, y: 0 } });
  const resizeStartRef = useRef({ x: 0, y: 0, size: { w: 0, h: 0 }, pos: { x: 0, y: 0 } });

  // Handle Dragging
  const handleDragStart = (e) => {
    if (isMaximized) return; // Prevent drag if maximized
    if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;

    onFocus();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, pos: { ...pos } };
    e.preventDefault();
  };

  // Handle Resizing
  const handleResizeStart = (e, dir) => {
    e.stopPropagation();
    onFocus();
    setIsResizing(dir);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, size: { ...size }, pos: { ...pos } };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPos({
          x: Math.max(0, dragStartRef.current.pos.x + dx),
          y: Math.max(0, dragStartRef.current.pos.y + dy)
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        
        let newW = resizeStartRef.current.size.w;
        let newH = resizeStartRef.current.size.h;
        let newX = resizeStartRef.current.pos.x;
        let newY = resizeStartRef.current.pos.y;
        
        const minW = 250;
        const minH = 150;

        if (isResizing.includes('e')) {
            newW = Math.max(minW, resizeStartRef.current.size.w + dx);
        }
        if (isResizing.includes('s')) {
            newH = Math.max(minH, resizeStartRef.current.size.h + dy);
        }
        if (isResizing.includes('w')) {
            const possibleW = resizeStartRef.current.size.w - dx;
            if (possibleW >= minW) {
                newW = possibleW;
                newX = resizeStartRef.current.pos.x + dx;
            } else {
                newW = minW;
                newX = resizeStartRef.current.pos.x + (resizeStartRef.current.size.w - minW);
            }
        }
        if (isResizing.includes('n')) {
            const possibleH = resizeStartRef.current.size.h - dy;
            if (possibleH >= minH) {
                newH = possibleH;
                newY = resizeStartRef.current.pos.y + dy;
            } else {
                newH = minH;
                newY = resizeStartRef.current.pos.y + (resizeStartRef.current.size.h - minH);
            }
        }

        setSize({ w: newW, h: newH });
        if (isResizing.includes('w') || isResizing.includes('n')) {
            setPos({ x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  if (isMinimized) return null;

  // Resize border config
  const resizeBorders = [
    { dir: 'n', style: { top: -4, left: 0, right: 0, height: 8, cursor: 'n-resize' } },
    { dir: 's', style: { bottom: -4, left: 0, right: 0, height: 8, cursor: 's-resize' } },
    { dir: 'w', style: { top: 0, bottom: 0, left: -4, width: 8, cursor: 'w-resize' } },
    { dir: 'e', style: { top: 0, bottom: 0, right: -4, width: 8, cursor: 'e-resize' } },
    { dir: 'nw', style: { top: -4, left: -4, width: 12, height: 12, cursor: 'nw-resize' } },
    { dir: 'ne', style: { top: -4, right: -4, width: 12, height: 12, cursor: 'ne-resize' } },
    { dir: 'sw', style: { bottom: -4, left: -4, width: 12, height: 12, cursor: 'sw-resize' } },
    { dir: 'se', style: { bottom: -4, right: -4, width: 12, height: 12, cursor: 'se-resize' } },
  ];

  return (
    <div 
      ref={windowRef}
      onMouseDownCapture={onFocus}
      className={`os-window ${isActive ? 'window-active' : ''}`}
      style={{
        position: 'absolute',
        left: isMaximized ? 12 : pos.x,
        top: isMaximized ? 12 : pos.y,
        width: isMaximized ? 'calc(100% - 24px)' : size.w,
        height: isMaximized ? 'calc(100% - 24px)' : size.h,
        zIndex: zIndex,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 8-Directional Resize Handles */}
      {!isMaximized && resizeBorders.map(({ dir, style }) => (
        <div 
          key={dir}
          onMouseDown={(e) => handleResizeStart(e, dir)}
          style={{ position: 'absolute', zIndex: 101, ...style }}
        />
      ))}

      {/* Title Bar */}
      <div 
        onMouseDown={handleDragStart}
        className="os-title-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          cursor: isMaximized ? 'default' : 'move',
          userSelect: 'none'
        }}
        onDoubleClick={() => setIsMaximized(!isMaximized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}>
          {icon && React.cloneElement(icon, { size: 16, strokeWidth: 2, color: '#64748b' })} 
          {title}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', zIndex: 102 }}>
          <button className="os-std-btn" onClick={onMinimize} title="Minimize"><Minus size={14} /></button>
          <button className="os-std-btn" onClick={() => setIsMaximized(!isMaximized)} title="Maximize"><Maximize2 size={12} /></button>
          <button className="os-std-btn os-mac-close" onClick={onClose} title="Close"><X size={14} /></button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', backgroundColor: '#ffffff' }}>
        {children}
        
        {/* Visual Handle for SE */}
        {!isMaximized && (
          <div style={{ position: 'absolute', right: 2, bottom: 2, pointerEvents: 'none', zIndex: 100 }}>
             <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
               <path d="M 10 0 L 0 10 M 10 5 L 5 10" />
             </svg>
          </div>
        )}
      </div>
      
      {/* Overlay to block iframe/content pointer events while dragging */}
      {(isDragging || isResizing) && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 99 }} />
      )}
    </div>
  );
}
