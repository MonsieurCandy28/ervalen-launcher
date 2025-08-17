const { app, BrowserWindow, ipcMain, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const { autoUpdater } = require("electron-updater")
const RPC = require("discord-rpc")

const isDev = !app.isPackaged
const cfgPath = path.join(process.cwd(), "config.json")
const loadCfg = () => JSON.parse(fs.readFileSync(cfgPath, "utf8"))

let win
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0b0f1a",
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" } })
  win.webContents.on("will-navigate", (e,url) => {
    if (!url.startsWith("http://localhost:5173") && !url.startsWith("file://")) { e.preventDefault(); shell.openExternal(url) }
  })

  const devURL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173"
  if (isDev) { win.loadURL(devURL); win.webContents.openDevTools({ mode: "detach" }) }
  else { win.loadFile(path.join(process.cwd(), "dist", "index.html")) }

  setupAutoUpdater()
  if (!isDev) autoUpdater.checkForUpdatesAndNotify()
  startRPC()
}

function setupAutoUpdater(){
  try {
    const { githubRepo } = loadCfg()
    if (githubRepo && githubRepo.includes("/")) {
      const [owner, repo] = githubRepo.split("/")
      autoUpdater.setFeedURL({ provider: "github", owner, repo })
    }
  } catch {}
  autoUpdater.autoDownload = true
  autoUpdater.on("checking-for-update", () => win?.webContents.send("update:status","Vérification des mises à jour…"))
  autoUpdater.on("update-available", () => win?.webContents.send("update:status","Mise à jour disponible…"))
  autoUpdater.on("update-not-available", () => win?.webContents.send("update:status","À jour"))
  autoUpdater.on("download-progress", p => win?.webContents.send("update:progress", Math.floor(p.percent||0)))
  autoUpdater.on("update-downloaded", i => win?.webContents.send("update:status", "Mise à jour téléchargée — redémarrer pour installer"))
}

let rpc
function startRPC(){
  const { discordAppId, discordInvite } = loadCfg()
  if (!discordAppId || discordAppId === "YOUR_DISCORD_APP_ID") { console.log("[RPC] disabled"); return }
  RPC.register(discordAppId)
  rpc = new RPC.Client({ transport: "ipc" })
  rpc.on("ready", () => {
    console.log("[RPC] connected")
    rpc.setActivity({
      details: "Ervalen RP",
      state: "Prêt à rejoindre",
      largeImageKey: "logo",
      largeImageText: "ErvalenRP",
      buttons: [
        { label: "Rejoindre", url: "https://cfx.re/join/mr7mbq" },
        { label: "Discord", url: "https://" + (discordInvite||"discord.gg/ervalenrp") }
      ]
    })
  })
  rpc.login({ clientId: discordAppId }).catch(e => console.log("[RPC] error", e))
}

app.whenReady().then(() => {
  createWindow()
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length===0) createWindow() })
})
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit() })
app.on("before-quit", () => { try { rpc?.destroy() } catch {} })

// IPC
ipcMain.handle("check-updates", async () => { try { const r = await autoUpdater.checkForUpdates(); return { ok:true, r } } catch(e){ return { ok:false, error:String(e) } } })
ipcMain.handle("get-app-version", () => app.getVersion())
ipcMain.handle("get-config", () => loadCfg())

async function fetchJSON(url){ const t0=Date.now(); const r = await fetch(url); const j = await r.json().catch(()=>null); const ping=Date.now()-t0; return { json:j, ping } }

ipcMain.handle("get-player-stats", async () => {
  try{
    const c = loadCfg()
    const base = `http://${c.serverIp||"127.0.0.1"}:${c.serverPort||30120}`
    const [{ json:players, ping }, { json:info }] = await Promise.all([
      fetchJSON(`${base}/players.json`),
      fetchJSON(`${base}/info.json`)
    ])
    const count = Array.isArray(players) ? players.length : 0
    const max = c.maxPlayers || info?.vars?.sv_maxClients || info?.vars?.sv_maxclients || 0
    return { ok:true, count, max, ping, up: !!info }
  } catch(e){ return { ok:false, error:String(e) } }
})

ipcMain.handle("get-changelog", async () => {
  try{
    const { githubRepo } = loadCfg()
    if (!githubRepo) return { ok:false, error:"githubRepo manquant" }
    const res = await fetch(`https://api.github.com/repos/${githubRepo}/releases?per_page=3`, { headers:{ "Accept":"application/vnd.github+json" } })
    const data = await res.json()
    const items = Array.isArray(data) ? data.map(r=>({ tag:r.tag_name, name:r.name, body:r.body, url:r.html_url, published:r.published_at })) : []
    return { ok:true, items }
  } catch(e){ return { ok:false, error:String(e) } }
})
