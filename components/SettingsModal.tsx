/**
 * @file Renders a modal for application settings.
 */
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}

/**
 * A modal that allows users to configure application settings, such as the
 * WebSocket server address.
 * @param {SettingsModalProps} props The properties for the component.
 * @returns {React.ReactElement | null} The rendered modal or null if not open.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [isListMode, setIsListMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load the currently saved custom URL from localStorage when the modal opens.
      const savedUrl = localStorage.getItem('custom_ws_url') || '';
      setServerUrl(savedUrl);
      
      // Load UI mode
      const savedListMode = localStorage.getItem('ui_list_mode');
      // Default to true if not set, otherwise parse 'true'/'false' string
      setIsListMode(savedListMode === null ? true : savedListMode === 'true');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleSave = () => {
    localStorage.setItem('ui_list_mode', String(isListMode));
    // Dispatch a custom event so App.tsx can listen for the change immediately without reload if we wanted,
    // but for now, App.tsx reads this on render or we can force a reload/update.
    // Since App.tsx passes onSave which calls forceReconnect, we might want to handle UI updates there too.
    // For simplicity, we rely on the parent's behavior, but we save the UI preference here.
    
    // We can also manually trigger a storage event for the current window if needed, 
    // but ideally App.tsx should pass a setter or we reload. 
    // Given the current structure, `onSave` triggers a reconnect. We will let App handle the URL, 
    // but the UI mode change might require a page refresh if not lifted to state.
    // To ensure immediate update, we can dispatch an event.
    window.dispatchEvent(new Event('storage'));
    
    onSave(serverUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>
        
        <div className="space-y-6">
            <div>
                <label htmlFor="server-url" className="block text-sm font-medium text-gray-300 mb-1">
                    Server Address
                </label>
                <input
                    id="server-url"
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="e.g., ws://localhost:8080 or wss://my-server.com"
                    className="w-full bg-gray-700 border border-gray-600 text-white font-mono rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    onKeyUp={(e) => e.key === 'Enter' && handleSave()}
                />
                 <p className="text-xs text-gray-500 mt-1">
                    Enter the full WebSocket address for the server. Leave blank to use the default.
                </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                    <h3 className="text-white font-bold">List Mode Interface</h3>
                    <p className="text-xs text-gray-400">
                        In List Mode, your panel occupies the full left side of the screen, and your hand is displayed as a detailed list.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isListMode}
                        onChange={(e) => setIsListMode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
        </div>

        <div className="flex justify-end mt-8 space-x-3">
          <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Cancel
          </button>
           <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Save & Apply
            </button>
        </div>
      </div>
    </div>
  );
};