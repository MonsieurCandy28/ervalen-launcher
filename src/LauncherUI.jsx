import React from "react"

export default function LauncherUI(){
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(60%_80%_at_50%_0%,#1b2a44_0%,#0d1220_55%,#070b14_100%)] text-white antialiased select-none">
      <Background />

      <TopBar />

      <main className="max-w-7xl mx-auto px-6 pb-16 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 relative overflow-hidden">
            <HeroBlock />
          </GlassCard>

            <RightPanel />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <LinkTile title="Discord" desc="Rejoins la commu" href={`https://${window.__cfg?.discordInvite||'discord.gg/ervalenrp'}`} />
          <LinkTile title="Règlement" desc="RP & server rules" href="#" />
          <LinkTile title="Changelog" desc="Toutes les MAJ" href="#" />
        </div>
      </main>

      <FooterBar />
    </div>
  )
}

/* — BG carousel (placeholders) — */
import bg1 from "./assets/bg1.png"
import bg2 from "./assets/bg2.png"
import logo from "./assets/logo.png"

function Background(){
  const [i,setI] = React.useState(0)
  const images = [bg1,bg2]
  React.useEffect(()=>{ const t = setInterval(()=>setI(v=>(v+1)%images.length), 6000); return ()=>clearInterval(t) },[])
  return (
    <div className="fixed inset-0 -z-10">
      {images.map((src,idx)=>(
        <div key={idx} className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ${idx===i?'opacity-100':'opacity-0'}`} style={{ backgroundImage:`url(${src})`}} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
    </div>
  )
}

/* — TopBar (logo + CTAs) — */
function TopBar(){
  const [cfg,setCfg] = React.useState(null)
  React.useEffect(()=>{ window.launcherAPI?.getConfig?.().then(c => { window.__cfg=c; setCfg(c) })},[])
  return (
    <header className="max-w-7xl mx-auto px-6 pt-10 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ErvalenRP" className="h-9 w-auto object-contain rounded" />
          <div className="hidden sm:flex items-center gap-2">
            <GlowBadge label="Qualité UI" color="blue" />
            <GlowBadge label="Toujours dispo" color="green" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GhostButton as="a" href={`https://${cfg?.discordInvite||'discord.gg/ervalenrp'}`} target="_blank" rel="noreferrer">Discord</GhostButton>
          <PrimaryButton as="a" href={cfg?.fivemJoin||'#'}>Jouer maintenant</PrimaryButton>
        </div>
      </div>
    </header>
  )
}

/* — Hero block (players, version, updates) — */
function HeroBlock(){
  const [cfg,setCfg] = React.useState(null)
  const [version,setVersion] = React.useState("")
  const [players,setPlayers] = React.useState({ count:0, max:0, ping:0, up:false })
  const [updateMsg,setUpdateMsg] = React.useState("")

  React.useEffect(()=>{
    window.launcherAPI?.getConfig?.().then(setCfg)
    window.launcherAPI?.getAppVersion?.().then(v=>setVersion("v"+v))
    const tick = async ()=>{ const r = await window.launcherAPI?.getPlayerStats?.(); if (r?.ok) setPlayers(r) }
    tick(); const t=setInterval(tick,5000); return ()=>clearInterval(t)
  },[])
  React.useEffect(()=>{
    window.launcherAPI?.onUpdateStatus?.((m)=>setUpdateMsg(m))
    window.launcherAPI?.onUpdateProgress?.((p)=>setUpdateMsg(`Téléchargement MAJ: ${p}%`))
  },[])

  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest opacity-60">Bienvenue sur ErvalenRP</div>
      <p className="mt-2 text-sm leading-6 opacity-90 max-w-2xl">
        Launcher optimisé : auto-update, RPC Discord, compteur joueurs live. Clique sur <span className="font-semibold">Jouer maintenant</span> pour rejoindre.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <PrimaryButton as="a" href={cfg?.fivemJoin||'#'}>Jouer maintenant</PrimaryButton>
        <GhostButton onClick={()=>window.launcherAPI?.checkUpdates?.()}>Rechercher des mises à jour</GhostButton>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <StatusTile title="Serveur" value={players.up?'En ligne':'Hors ligne'} sub={`Ping ~${players.ping||0}ms`} dot={players.up?'green':'amber'} />
        <StatusTile title="Joueurs" value={`${players.count}/${players.max||cfg?.maxPlayers||'?'}`} sub="En temps réel" dot="blue" />
        <StatusTile title="Version" value={version||'v6'} sub={updateMsg||'Auto-update actif'} dot="amber" />
      </div>
    </div>
  )
}

/* — Right Panel (changelog GitHub) — */
function RightPanel(){
  const [items,setItems] = React.useState([])
  const [loading,setLoading] = React.useState(true)
  React.useEffect(()=>{
    (async ()=>{
      const r = await window.launcherAPI?.getChangelog?.()
      if (r?.ok) setItems(r.items||[])
      setLoading(false)
    })()
  },[])
  return (
    <GlassCard className="p-0 flex flex-col">
      <div className="p-5 pb-0">
        <div className="opacity-70 text-sm">Changelog (GitHub Releases)</div>
      </div>
      <div className="p-5 space-y-3">
        {loading && <div className="text-sm opacity-70">Chargement…</div>}
        {!loading && !items.length && <div className="text-sm opacity-70">Aucune release trouvée.</div>}
        {items.map((c,idx)=>(
          <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold">{c.name || c.tag}</div>
            <div className="text-[11px] opacity-60">{new Date(c.published).toLocaleString()}</div>
            <div className="mt-2 text-sm whitespace-pre-wrap opacity-85">
              {(c.body||'').slice(0,400)}{(c.body||'').length>400?'…':''}
            </div>
            <a className="text-[12px] underline opacity-80 mt-2 inline-block" href={c.url} target="_blank" rel="noreferrer">Voir sur GitHub</a>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-white/10 text-xs opacity-70">
        Releases gérées via ton repo.
      </div>
    </GlassCard>
  )
}

/* — Building blocks — */
function GlassCard({ className="", children }){ return <section className={"rounded-3xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl "+className}>{children}</section> }
function GlowBadge({ label, color="blue" }){
  const colors = { orange:"from-orange-400/40 to-amber-300/30 ring-orange-400/40", blue:"from-sky-400/40 to-indigo-300/30 ring-sky-400/40", green:"from-emerald-400/40 to-lime-300/30 ring-emerald-400/40" }
  return <span className={`px-3 py-2 text-xs rounded-2xl bg-gradient-to-br ${colors[color]} ring-1 inline-flex items-center gap-2`} style={{ boxShadow:"0 0 30px rgba(99,102,241,.35) inset, 0 0 30px rgba(99,102,241,.15)" }}><span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" />{label}</span>
}
function PrimaryButton({ children, as="button", href, target, rel, onClick }){ const Comp=as; return <Comp {...(href?{href, target:target||"_self", rel}:{})} onClick={onClick} className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 transition shadow-lg border border-white/10">{children}</Comp> }
function GhostButton({ children, onClick, as="button", href, target, rel }){ const Comp=as; return <Comp {...(href?{href, target, rel}:{})} onClick={onClick} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">{children}</Comp> }
function StatusTile({ title, value, sub, dot="blue" }){ const dots={ green:"bg-emerald-400", blue:"bg-sky-400", amber:"bg-amber-400" }; return (<div className="rounded-2xl p-4 bg-white/5 border border-white/10"><div className="flex items-center justify-between text-xs opacity-70"><span>{title}</span><span className={`h-2 w-2 rounded-full ${dots[dot]}`} /></div><div className="mt-1 text-lg font-semibold">{value}</div><div className="text-xs opacity-60">{sub}</div></div>) }
function LinkTile({ title, desc, href="#" }){ return (<a href={href} className="group rounded-2xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition block"><div className="text-sm opacity-70">{desc}</div><div className="mt-1 text-xl font-semibold">{title}</div><div className="mt-4 text-xs opacity-60 group-hover:opacity-100">En savoir plus →</div></a>) }
function FooterBar(){ return (<footer className="border-t border-white/10 mt-6"><div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-70"><div className="flex items-center gap-2"><span>© {new Date().getFullYear()} Ervalen RP</span><span className="hidden sm:inline">•</span><span>Build Electron + React</span></div><div className="flex items-center gap-4"><span id="ver"></span></div></div></footer>) }
