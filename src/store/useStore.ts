import { create } from 'zustand';
import { AppState, SceneObject, TransformMode, ViewportMode, ShadingMode } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useStore = create<AppState>((set) => ({
  objects: {},
  selectedIds: [],
  transformMode: 'translate' as TransformMode | null,
  viewportMode: 'perspective',
  shadingMode: 'solid',
  isSnapEnabled: false,
  snapDistance: 1,
  clipboard: [],

  history: [{}],
  historyIndex: 0,

  saveHistory: (newObjects) => set((state) => {
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(newObjects);
    if (nextHistory.length > 50) nextHistory.shift();
    return {
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return {
        objects: state.history[newIndex],
        historyIndex: newIndex,
        selectedIds: state.selectedIds.filter(id => state.history[newIndex][id]),
      };
    }
    return state;
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return {
        objects: state.history[newIndex],
        historyIndex: newIndex,
      };
    }
    return state;
  }),

  setObjects: (objects) => set((state) => {
    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(objects);
    if (nextHistory.length > 50) nextHistory.shift();
    return {
      objects,
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
      selectedIds: [],
    };
  }),

  copy: () => set((state) => {
    const copiedObjects = state.selectedIds.map(id => state.objects[id]).filter(Boolean);
    return { clipboard: copiedObjects };
  }),

  paste: () => set((state) => {
    if (!state.clipboard || !state.clipboard.length) return state;
    const newObjects = { ...state.objects };
    const newSelectedIds: string[] = [];
    
    state.clipboard.forEach(obj => {
      // Create a deep copy and assign a new ID
      const newObj = JSON.parse(JSON.stringify(obj)) as SceneObject;
      newObj.id = uuidv4();
      // Offset position slightly so it doesn't perfectly overlap
      newObj.position = [newObj.position[0] + 0.5, newObj.position[1] + 0.5, newObj.position[2] + 0.5];
      newObj.name = `${newObj.name} (Copy)`;
      newObjects[newObj.id] = newObj;
      newSelectedIds.push(newObj.id);
    });

    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(newObjects);
    if (nextHistory.length > 50) nextHistory.shift();
    
    return { 
      objects: newObjects, 
      selectedIds: newSelectedIds,
      history: nextHistory,
      historyIndex: nextHistory.length - 1
    };
  }),

  addObject: (obj) =>
    set((state) => {
      const newObjects = { ...state.objects, [obj.id]: obj };
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(newObjects);
      if (nextHistory.length > 50) nextHistory.shift();
      return {
        objects: newObjects,
        selectedIds: [obj.id], // Auto-select newly added
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      };
    }),

  removeObject: (id) =>
    set((state) => {
      const newObjects = { ...state.objects };
      delete newObjects[id];
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(newObjects);
      if (nextHistory.length > 50) nextHistory.shift();
      return {
        objects: newObjects,
        selectedIds: state.selectedIds.filter((selId) => selId !== id),
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      };
    }),

  updateObject: (id, updates) =>
    set((state) => {
      const newObjects = {
        ...state.objects,
        [id]: { ...state.objects[id], ...updates },
      };
      
      // Basic heuristic: we might not want to save history on every single update if it's rapid, but for simplicity we do it here.
      // Wait, let's actually just save it directly for now.
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      nextHistory.push(newObjects);
      if (nextHistory.length > 50) nextHistory.shift();

      return {
        objects: newObjects,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
      };
    }),

  selectObject: (id, additive = false) =>
    set((state) => {
      if (additive) {
        if (state.selectedIds.includes(id)) {
          return { selectedIds: state.selectedIds.filter((s) => s !== id) };
        }
        return { selectedIds: [...state.selectedIds, id] };
      }
      return { selectedIds: [id] };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  setTransformMode: (mode) => set({ transformMode: mode }),
  setViewportMode: (mode) => set({ viewportMode: mode }),
  setShadingMode: (mode) => set({ shadingMode: mode }),
  setIsSnapEnabled: (isSnapEnabled) => set({ isSnapEnabled }),
  setSnapDistance: (snapDistance) => set({ snapDistance }),
}));

export const createPrimitive = (type: SceneObject['geometryType'] | 'Curve' | 'Bone'): SceneObject => {
  const nameMap: Record<string, string> = {
    Box: 'Cube',
    Sphere: 'Sphere',
    Cylinder: 'Cylinder',
    Plane: 'Plane',
    Cone: 'Cone',
    Torus: 'Torus',
    Text: 'Text',
    Curve: 'Curve',
    Bone: 'Bone'
  };

  let objType: SceneObject['type'] = 'Mesh';
  if (type === 'Curve') objType = 'Curve';
  if (type === 'Bone') objType = 'Bone';

  return {
    id: uuidv4(),
    name: nameMap[type || 'Box'] || type || 'Object',
    type: objType,
    geometryType: (type !== 'Curve' && type !== 'Bone') ? type : undefined,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    visible: true,
    color: '#808080',
    text: type === 'Text' ? '3Del Text' : undefined,
    modifiers: [],
    children: [],
  };
};
