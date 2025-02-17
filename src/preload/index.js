import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onWindowStateChanged: (callback) => {
    ipcRenderer.on('window-state-changed', (_, state) => callback(state))
  },
  windowControl: (action) => ipcRenderer.invoke('window:control', action),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  updateDbPath: (path) => ipcRenderer.invoke('update-db-path', path)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
