import React from 'react';
import { useStore } from '../../store/useStore';
import { Move, RotateCw, Scaling, MousePointer2, Magnet } from 'lucide-react';
import { TransformMode } from '../../types';

export default function Toolbar() {
  const { transformMode, setTransformMode, isSnapEnabled, setIsSnapEnabled } = useStore();

  const ToolButton = ({ mode, icon: Icon, title }: { mode: TransformMode | 'select', icon: any, title: string }) => {
    // If we have a pure 'select' mode, we'd handle it. For now 'translate' without selection acts like select.
    // Drei's TransformControls needs a mode.
    const isActive = transformMode === mode || (mode === 'select' && transformMode === null);
    
    return (
      <button
        title={title}
        onClick={() => setTransformMode(mode === 'select' ? null : mode as TransformMode)}
        className={`p-1.5 rounded cursor-default transition-colors ${
          isActive ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white hover:bg-[#333333]'
        }`}
      >
        <Icon size={20} strokeWidth={2} />
      </button>
    );
  };

  return (
    <aside className="w-10 bg-[#1e1e1e] border-r border-black flex flex-col items-center py-4 space-y-4 shadow-lg z-10">
      <ToolButton mode="select" icon={MousePointer2} title="Select" />
      <ToolButton mode="translate" icon={Move} title="Move (G)" />
      <ToolButton mode="rotate" icon={RotateCw} title="Rotate (R)" />
      <ToolButton mode="scale" icon={Scaling} title="Scale (S)" />
      <div className="w-6 h-px bg-gray-700 my-2" />
      <button
        title="Toggle Snap to Grid"
        onClick={() => setIsSnapEnabled(!isSnapEnabled)}
        className={`p-1.5 rounded cursor-default transition-colors ${
          isSnapEnabled ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333333]'
        }`}
      >
        <Magnet size={20} strokeWidth={2} />
      </button>
    </aside>
  );
}
