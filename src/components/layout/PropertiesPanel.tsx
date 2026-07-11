import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Trash2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ModifierType } from '../../types';

export default function PropertiesPanel() {
  const { objects, selectedIds, updateObject, removeObject, clearSelection } = useStore();
  const [activeTab, setActiveTab] = useState<'Object' | 'Data' | 'Modifiers'>('Object');

  const selectedObj = selectedIds.length === 1 ? objects[selectedIds[0]] : null;

  if (!selectedObj) {
    return (
      <div className="h-1/2 border-t border-black flex flex-col">
        <div className="h-8 px-3 flex items-center border-b border-black bg-[#252525] text-[10px] font-bold uppercase tracking-wider space-x-4">
          <span className="border-b-2 border-orange-500 pb-1 mt-1">Object</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[11px] text-gray-500 gap-3">
          {selectedIds.length > 1 ? (
            <>
              <span>Multiple objects selected</span>
              <div className="flex gap-2">
                 <button onClick={() => selectedIds.forEach(id => removeObject(id))} className="px-2 py-1 bg-red-600/50 hover:bg-red-500/50 text-white rounded">Delete All</button>
                 <button onClick={clearSelection} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">Deselect All</button>
              </div>
            </>
          ) : 'No object selected'}
        </div>
      </div>
    );
  }

  const handleModifierAdd = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) return;
    const type = e.target.value as ModifierType;
    const newMod = { id: uuidv4(), type, active: true, value: 1 };
    updateObject(selectedObj.id, { modifiers: [...(selectedObj.modifiers || []), newMod] });
    e.target.value = "";
  };

  const removeModifier = (modId: string) => {
    updateObject(selectedObj.id, { modifiers: (selectedObj.modifiers || []).filter(m => m.id !== modId) });
  };

  const handleTransformChange = (axis: number, value: number, type: 'position' | 'rotation' | 'scale') => {
    const newArr = [...selectedObj[type]] as [number, number, number];
    newArr[axis] = isNaN(value) ? 0 : value;
    
    // For rotation, convert UI degrees to radians
    if (type === 'rotation') {
      newArr[axis] = newArr[axis] * (Math.PI / 180);
    }
    
    updateObject(selectedObj.id, { [type]: newArr });
  };

  const getDisplayValue = (val: number, type: 'position' | 'rotation' | 'scale') => {
    if (type === 'rotation') {
      return Number((val * (180 / Math.PI)).toFixed(2));
    }
    return Number(val.toFixed(2));
  };

  const TransformInputGroup = ({ label, type }: { label: string, type: 'position' | 'rotation' | 'scale' }) => (
    <div className="space-y-2 mb-4">
      <label className="text-[10px] text-gray-500 uppercase">{label}</label>
      <div className="grid grid-cols-3 gap-1 text-[11px]">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="bg-black/20 rounded px-1 flex justify-between items-center overflow-hidden border border-transparent focus-within:border-orange-500">
            <span className={
              axis === 'X' ? 'text-red-400' : 
              axis === 'Y' ? 'text-green-400' : 
              'text-blue-400'
            }>{axis}</span>
            <input
              type="number"
              step={type === 'scale' ? 0.1 : 1}
              value={getDisplayValue(selectedObj[type][i], type)}
              onChange={(e) => handleTransformChange(i, parseFloat(e.target.value), type)}
              className="w-12 bg-transparent text-right outline-none text-[11px] text-gray-300"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-1/2 border-t border-black flex flex-col">
      <div className="h-8 px-3 flex items-center border-b border-black bg-[#252525] text-[10px] font-bold uppercase tracking-wider space-x-4">
        <span className={`cursor-pointer pb-1 mt-1 ${activeTab === 'Object' ? 'border-b-2 border-orange-500 text-white' : 'opacity-50'}`} onClick={() => setActiveTab('Object')}>Object</span>
        <span className={`cursor-pointer pb-1 mt-1 ${activeTab === 'Data' ? 'border-b-2 border-orange-500 text-white' : 'opacity-50'}`} onClick={() => setActiveTab('Data')}>Data</span>
        <span className={`cursor-pointer pb-1 mt-1 ${activeTab === 'Modifiers' ? 'border-b-2 border-orange-500 text-white' : 'opacity-50'}`} onClick={() => setActiveTab('Modifiers')}>Modifiers</span>
      </div>

      <div className="flex px-3 py-2 border-b border-white/5 space-x-2 bg-[#2a2a2a] shrink-0">
        <button onClick={() => removeObject(selectedObj.id)} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] rounded border border-red-500/30">
          <Trash2 size={10} /> Delete
        </button>
        <button onClick={clearSelection} className="flex items-center gap-1 px-2 py-1 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 text-[10px] rounded border border-gray-500/30">
          <X size={10} /> Deselect
        </button>
      </div>

      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        {activeTab === 'Object' && (
          <>
            <div className="space-y-2">
              <input
                type="text"
                value={selectedObj.name}
                onChange={(e) => updateObject(selectedObj.id, { name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-white/5 rounded px-2 py-1 text-[11px] outline-none focus:border-orange-500 text-gray-300"
              />
            </div>

            <TransformInputGroup label="Location" type="position" />
            <TransformInputGroup label="Rotation" type="rotation" />
            <TransformInputGroup label="Scale" type="scale" />
            
            {(selectedObj.type === 'Mesh' || selectedObj.geometryType === 'Text') && (
              <div className="space-y-2 border-t border-black pt-4">
                <label className="text-[10px] text-gray-500 uppercase">Materials</label>
                <div className="p-2 bg-[#2a2a2a] rounded border border-white/5 flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedObj.color || '#808080'}
                    onChange={(e) => updateObject(selectedObj.id, { color: e.target.value })}
                    className="w-4 h-4 rounded-sm shadow-inner cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-[11px] text-gray-300">Material Color</span>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Data' && (
          <div className="space-y-4">
            <h3 className="text-[10px] text-gray-500 uppercase">Object Data Properties</h3>
            {selectedObj.geometryType === 'Text' ? (
              <div className="space-y-2">
                <label className="text-[11px] text-gray-400">Text Content</label>
                <input
                  type="text"
                  value={selectedObj.text || ''}
                  onChange={(e) => updateObject(selectedObj.id, { text: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-white/5 rounded px-2 py-1 text-[11px] outline-none focus:border-orange-500 text-gray-300"
                />
              </div>
            ) : selectedObj.type === 'Curve' ? (
              <div className="text-[11px] text-gray-400">Curve data options (Path, Bevel, Extrude)</div>
            ) : selectedObj.type === 'Bone' ? (
              <div className="text-[11px] text-gray-400">Armature / Bone properties</div>
            ) : (
              <div className="text-[11px] text-gray-500">No specific data properties available.</div>
            )}
          </div>
        )}

        {activeTab === 'Modifiers' && (
          <div className="space-y-4">
            <select
              onChange={handleModifierAdd}
              defaultValue=""
              className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1.5 text-[11px] outline-none focus:border-orange-500 text-gray-300"
            >
              <option value="" disabled>Add Modifier...</option>
              <option value="Subdivision">Subdivision Surface</option>
              <option value="Bevel">Bevel</option>
              <option value="Skin">Skin</option>
              <option value="Mirror">Mirror</option>
              <option value="Array">Array</option>
              <option value="Solidify">Solidify</option>
              <option value="Decimate">Decimate</option>
              <option value="Bend">Bend</option>
              <option value="Twist">Twist</option>
              <option value="Taper">Taper</option>
              <option value="Noise">Noise</option>
              <option value="Lattice">Lattice</option>
              <option value="Wave">Wave</option>
            </select>

            <div className="space-y-2">
              {selectedObj.modifiers?.map(mod => (
                <div key={mod.id} className="bg-[#1e1e1e] border border-white/5 rounded p-2 text-[11px]">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                    <span className="font-semibold text-gray-300">{mod.type}</span>
                    <button onClick={() => removeModifier(mod.id)} className="text-gray-500 hover:text-red-400"><X size={12} /></button>
                  </div>
                  <div className="text-gray-500 flex justify-between items-center space-x-2">
                     <span>Value</span>
                     <div className="flex items-center space-x-2">
                       <input 
                         type="range" 
                         min="0" 
                         max="10" 
                         step="1" 
                         value={mod.value || 0}
                         onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           const newMods = selectedObj.modifiers.map(m => m.id === mod.id ? { ...m, value: val } : m);
                           updateObject(selectedObj.id, { modifiers: newMods });
                         }}
                         className="w-16 accent-orange-500" 
                       />
                       <input
                         type="number"
                         min="0"
                         max="10000"
                         value={mod.value || 0}
                         onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           const validVal = isNaN(val) ? 0 : Math.min(10000, Math.max(0, val));
                           const newMods = selectedObj.modifiers.map(m => m.id === mod.id ? { ...m, value: validVal } : m);
                           updateObject(selectedObj.id, { modifiers: newMods });
                         }}
                         className="w-12 bg-[#2a2a2a] border border-white/5 rounded px-1 text-[10px] outline-none focus:border-orange-500 text-gray-300 text-right"
                       />
                     </div>
                  </div>
                </div>
              ))}
              {(!selectedObj.modifiers || selectedObj.modifiers.length === 0) && (
                <div className="text-[11px] text-gray-500 text-center py-4">No modifiers applied.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
