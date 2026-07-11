import React from 'react';
import { Box, Circle, Cylinder, Hexagon, Cone, CircleDashed, Type, Activity, Bone } from 'lucide-react';
import { useStore, createPrimitive } from '../../store/useStore';

export default function MenuBar() {
  const addObject = useStore((state) => state.addObject);
  const objects = useStore((state) => state.objects);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAdd = (type: any) => {
    addObject(createPrimitive(type));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === '3del') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedObjects = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedObjects)) {
            importedObjects.forEach(obj => addObject(obj));
          } else if (typeof importedObjects === 'object') {
            Object.values(importedObjects).forEach((obj: any) => addObject(obj));
          }
        } catch (err) {
          alert('Failed to parse .3del file');
        }
      };
      reader.readAsText(file);
    } else if (ext && ['obj', 'stl', 'glb', 'gltf', 'fbx'].includes(ext)) {
      const url = URL.createObjectURL(file);
      const newObj = createPrimitive('Box'); // placeholder
      newObj.name = file.name;
      newObj.geometryType = 'Imported';
      newObj.fileUrl = url;
      newObj.fileExt = ext;
      addObject(newObj);
    } else if (ext === 'blend') {
      alert('Blender (.blend) files are not natively supported by standard web loaders. Please export from Blender as .glb, .obj, or .fbx first.');
    } else {
      alert(`Unsupported file format: .${ext}`);
    }
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objects, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "scene.3del");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <nav className="flex items-center justify-between h-8 px-4 bg-[#1e1e1e] border-b border-black text-xs">
      <input type="file" ref={fileInputRef} className="hidden" accept=".obj,.stl,.glb,.gltf,.fbx,.blend" onChange={handleImport} />
      <div className="flex space-x-4 items-center">
        <span className="font-bold text-orange-500 mr-2 uppercase tracking-tighter">3Del</span>
        
        <div className="relative group">
          <button className="hover:text-white cursor-default">File</button>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-48 bg-[#252525] border border-black shadow-xl z-50 rounded-md py-1">
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black">
              Import...
            </button>
            <button onClick={handleExport} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black">
              Export Scene
            </button>
          </div>
        </div>
        <div className="relative group">
          <button className="hover:text-white cursor-default">Edit</button>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-48 bg-[#252525] border border-black shadow-xl z-50 rounded-md py-1">
            <button onClick={() => {
              useStore.getState().copy();
            }} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex justify-between">
              <span>Copy</span>
              <span className="opacity-50">Ctrl+C</span>
            </button>
            <button onClick={() => {
              useStore.getState().paste();
            }} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex justify-between">
              <span>Paste</span>
              <span className="opacity-50">Ctrl+V</span>
            </button>
            <div className="border-t border-black my-1"></div>
            <button onClick={() => {
              useStore.setState({ selectedIds: Object.keys(useStore.getState().objects) });
            }} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black">
              Select All
            </button>
            <button onClick={() => {
              useStore.setState({ selectedIds: [] });
            }} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black">
              Deselect All
            </button>
            <div className="border-t border-black my-1"></div>
            <button onClick={() => {
              useStore.getState().selectedIds.forEach(id => useStore.getState().removeObject(id));
            }} className="w-full text-left px-4 py-1 hover:bg-red-500 hover:text-white text-red-400">
              Delete Selected
            </button>
          </div>
        </div>
        <div className="relative group">
          <button className="hover:text-white cursor-default">Add</button>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-48 bg-[#252525] border border-black shadow-xl z-50 rounded-md py-1">
            <button onClick={() => handleAdd('Box')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <Box size={14} /> Cube
            </button>
            <button onClick={() => handleAdd('Sphere')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <Circle size={14} /> Sphere
            </button>
            <button onClick={() => handleAdd('Cylinder')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <Cylinder size={14} /> Cylinder
            </button>
            <button onClick={() => handleAdd('Plane')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <div className="w-3 h-3 border border-current"></div> Plane
            </button>
            <button onClick={() => handleAdd('Text')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <Type size={14} /> Text
            </button>
            <button onClick={() => handleAdd('Curve')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <Activity size={14} /> Curve
            </button>
            <button onClick={() => handleAdd('Bone')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <Bone size={14} /> Bone
            </button>
            <button onClick={() => handleAdd('Parent')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black flex items-center gap-2">
              <div className="w-3 h-3 border border-current rounded-sm border-dashed"></div> Parent
            </button>
          </div>
        </div>
        <div className="relative group">
          <button className="hover:text-white cursor-default">Help</button>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-64 bg-[#252525] border border-black shadow-xl z-50 rounded-md py-1">
            <div className="px-4 py-2 text-gray-400 whitespace-normal">
              <strong className="text-white block mb-1">Navigation</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>Left Click: Select</li>
                <li>Right Click: Context Menu</li>
                <li>Middle Mouse / Alt+Drag: Orbit</li>
                <li>Shift+Middle Mouse: Pan</li>
                <li>Scroll: Zoom</li>
              </ul>
            </div>
            <div className="border-t border-black my-1"></div>
            <button onClick={() => alert('3Del v1.0.4 Alpha\nA lightweight, web-based 3D modeling tool.')} className="w-full text-left px-4 py-1 hover:bg-orange-500 hover:text-black">
              About 3Del
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 text-[10px] opacity-60 uppercase tracking-widest">
        <span>v1.0.4 Alpha</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    </nav>
  );
}
