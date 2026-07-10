import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Box, Circle, Cylinder, Lightbulb, Camera, CircleDashed } from 'lucide-react';

export default function Outliner() {
  const { objects, selectedIds, selectObject, removeObject, copy, paste } = useStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string | null } | null>(null);

  const getIcon = (type: string, geoType?: string) => {
    if (type === 'Light') return <Lightbulb size={12} />;
    if (type === 'Camera') return <Camera size={12} />;
    if (geoType === 'Sphere') return <Circle size={12} />;
    if (geoType === 'Cylinder') return <Cylinder size={12} />;
    if (geoType === 'Plane') return <div className="w-2.5 h-2.5 border border-current mx-[1px]" />;
    return <Box size={12} />;
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, objId: string | null) => {
    e.preventDefault();
    if (objId) {
      selectObject(objId, false);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, objectId: objId });
  };

  return (
    <div className="flex-1 flex flex-col relative" onContextMenu={(e) => {
      // Allow context menu on empty space to paste
      if ((e.target as HTMLElement).closest('.object-row')) return;
      handleContextMenu(e, null);
    }}>
      <div className="h-8 px-3 flex items-center justify-between border-b border-black bg-[#252525] text-[10px] font-bold uppercase tracking-wider">
        <span>Scene Outliner</span>
      </div>
      <div className="p-2 text-[11px] space-y-1 overflow-y-auto flex-1">
        {Object.values(objects).map((obj) => (
          <div
            key={obj.id}
            onClick={(e) => selectObject(obj.id, e.ctrlKey || e.metaKey)}
            onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, obj.id); }}
            className={`object-row flex items-center px-2 py-0.5 rounded cursor-pointer select-none ${
              selectedIds.includes(obj.id) ? 'bg-blue-600/30 text-white' : 'opacity-80 hover:bg-[#333333]'
            }`}
          >
            <span className="mr-2">{getIcon(obj.type, obj.geometryType)}</span>
            <span className="truncate">{obj.name}</span>
          </div>
        ))}
        {Object.keys(objects).length === 0 && (
          <div className="text-[11px] text-gray-500 text-center mt-4 opacity-80">Scene is empty</div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-[#252525] border border-black shadow-xl rounded-md py-1 z-50 text-[11px] min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.objectId ? (
            <>
              <div className="px-3 py-1 font-bold text-gray-400 border-b border-black mb-1">Properties</div>
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer flex justify-between" onClick={() => { copy(); setContextMenu(null); }}>
                <span>Copy</span><span className="opacity-50">Ctrl+C</span>
              </div>
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer flex justify-between" onClick={() => { paste(); setContextMenu(null); }}>
                <span>Paste</span><span className="opacity-50">Ctrl+V</span>
              </div>
              <div className="border-t border-black my-1" />
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer" onClick={() => setContextMenu(null)}>Add RigidBody</div>
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer" onClick={() => setContextMenu(null)}>Add Joints</div>
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer" onClick={() => setContextMenu(null)}>Physics Settings</div>
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer" onClick={() => setContextMenu(null)}>Collision Bounds</div>
              <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer" onClick={() => setContextMenu(null)}>Add Constraint</div>
              <div className="border-t border-black my-1" />
              <div className="px-3 py-1.5 hover:bg-red-500 hover:text-white cursor-pointer" onClick={() => { if (contextMenu.objectId) removeObject(contextMenu.objectId); setContextMenu(null); }}>Delete Object</div>
            </>
          ) : (
            <div className="px-3 py-1.5 hover:bg-orange-500 hover:text-black cursor-pointer flex justify-between" onClick={() => { paste(); setContextMenu(null); }}>
              <span>Paste</span><span className="opacity-50">Ctrl+V</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
