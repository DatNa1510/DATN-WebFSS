import { create } from 'zustand';

const useVisualSearchStore = create((set) => ({
  // Current search state
  preview: null,
  fileObj: null,
  results: null,
  error: null,
  
  // History of past searches
  // Array of { id, preview (blob URL), fileObj, results, timestamp }
  history: [],

  // Actions for current search
  setCurrentSearch: (preview, fileObj, results) => set((state) => {
    let newHistory = state.history;
    
    // Only add to history if we have valid results and preview
    if (results && results.length > 0 && preview) {
      // Check if this preview already exists in history to avoid duplicates
      const exists = state.history.some(h => h.preview === preview);
      if (!exists) {
        const newEntry = {
          id: Date.now().toString(),
          preview,
          fileObj,
          results,
          timestamp: new Date().toISOString()
        };
        // Keep the last 10 searches in memory
        newHistory = [newEntry, ...state.history].slice(0, 10);
      }
    }
    
    return {
      preview,
      fileObj,
      results,
      error: null,
      history: newHistory
    };
  }),

  // Restore a past search from history
  restoreFromHistory: (historyId) => set((state) => {
    const entry = state.history.find(h => h.id === historyId);
    if (entry) {
      return {
        preview: entry.preview,
        fileObj: entry.fileObj,
        results: entry.results,
        error: null
      };
    }
    return state;
  }),

  setError: (error) => set({ error }),
  
  resetCurrentSearch: () => set({
    preview: null,
    fileObj: null,
    results: null,
    error: null
  }),

  clearHistory: () => set({ history: [] })
}));

export default useVisualSearchStore;
