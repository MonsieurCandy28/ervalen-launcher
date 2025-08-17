const { contextBridge, ipcRenderer } = require("electron")
contextBridge.exposeInMainWorld("launcherAPI", {
  checkUpdates: () => ipcRenderer.invoke("check-updates"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  getPlayerStats: () => ipcRenderer.invoke("get-player-stats"),
  getChangelog: () => ipcRenderer.invoke("get-changelog"),
  onUpdateStatus: (cb) => ipcRenderer.on("update:status", (_,m)=>cb(m)),
  onUpdateProgress: (cb) => ipcRenderer.on("update:progress", (_,p)=>cb(p))
})
