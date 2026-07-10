/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Toolbar from './components/layout/Toolbar';
import Outliner from './components/layout/Outliner';
import PropertiesPanel from './components/layout/PropertiesPanel';
import Viewport from './components/viewport/Viewport';
import MenuBar from './components/layout/MenuBar';
import { Box } from 'lucide-react';

export default function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#121212] font-sans text-gray-300 relative items-center justify-center overflow-hidden">
        <div className="absolute top-6 left-6 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          RECOMMENDED PLAYING ON COMPUTER OR TABLET
        </div>

        <div className="flex flex-col items-center text-center space-y-6 max-w-lg z-10 px-6">
          <div className="w-20 h-20 bg-[#1e1e1e] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Box size={40} className="text-orange-500" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-white">3Del</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            A lightweight, web-based 3D modeling tool. Create, edit, and export 3D geometry directly in your browser.
          </p>
          <button 
            onClick={() => setStarted(true)}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded transition-colors duration-200 shadow-lg mt-4 uppercase tracking-wider"
          >
            Start Modeling
          </button>
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.03]">
          <Box size={800} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121212] font-sans text-gray-300 overflow-hidden select-none">
      <MenuBar />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <main className="flex-1 relative bg-[#2a2a2a] overflow-hidden">
          <Viewport />
        </main>
        <aside className="w-64 bg-[#1e1e1e] border-l border-black flex flex-col">
          <Outliner />
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}

