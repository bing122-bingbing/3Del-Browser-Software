import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import { useStore } from '../../store/useStore';
import { MousePointer2 } from 'lucide-react';

export default function Viewport() {
  const { clearSelection, selectedIds, removeObject, objects, undo, redo, copy, paste } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Copy / Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copy();
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        paste();
        e.preventDefault();
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
        e.preventDefault();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedIds.forEach((id) => removeObject(id));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, removeObject, undo, redo, copy, paste]);

  return (
    <div className="absolute inset-0 bg-transparent">
      {/* Viewport Overlays */}
      <div className="absolute top-3 left-3 flex space-x-2 z-10">
        <div className="bg-[#1e1e1e]/80 backdrop-blur px-2 py-1 rounded text-[10px] border border-white/10 text-gray-300 pointer-events-none select-none">
          Perspective | Solid
        </div>
      </div>
      
      {/* Viewport Stats */}
      <div className="absolute top-3 right-3 text-[10px] text-right font-mono opacity-70 text-gray-300 z-10 pointer-events-none select-none">
        <div>Objects: {Object.keys(objects).length}</div>
        <div>Selected: {selectedIds.length}</div>
      </div>

      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        onPointerMissed={() => clearSelection()}
      >
        <React.Suspense fallback={null}>
          <Scene />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
