export default function UCLHeader() {
  return (
    <div className="ucl-hdr">
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" style={{filter:'drop-shadow(0 0 13px rgba(77,166,255,.6))'}}>
          <defs><radialGradient id="bg2" cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#1a6fd4"/><stop offset="100%" stopColor="#020b18"/></radialGradient></defs>
          <circle cx="32" cy="32" r="31" fill="url(#bg2)" stroke="rgba(255,255,255,.11)" strokeWidth="1"/>
          <polygon points="32,6 34.5,13.5 42.5,13.5 36.2,18.2 38.5,25.5 32,21 25.5,25.5 27.8,18.2 21.5,13.5 29.5,13.5" fill="white" opacity=".94"/>
          {[0,45,90,135,180,225,270,315].map(r=>(
            <polygon key={r} points="32,13 33,16 36,16 33.8,17.6 34.6,20.5 32,18.8 29.4,20.5 30.2,17.6 28,16 31,16" fill="white" opacity=".55" transform={`rotate(${r},32,32) translate(0,-8.5)`}/>
          ))}
          <circle cx="32" cy="32" r="6.5" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".7"/>
          <circle cx="32" cy="32" r="1.6" fill="white" opacity=".45"/>
          <line x1="32" y1="1" x2="32" y2="63" stroke="rgba(255,255,255,.07)" strokeWidth=".5"/>
          <line x1="1" y1="32" x2="63" y2="32" stroke="rgba(255,255,255,.07)" strokeWidth=".5"/>
        </svg>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:'.26em',color:'var(--silver)',textTransform:'uppercase',marginTop:2}}>UEFA</div>
        <div style={{fontSize:19,fontWeight:900,letterSpacing:'.12em',color:'#fff',textTransform:'uppercase',textShadow:'0 0 18px rgba(77,166,255,.55)'}}>Champions</div>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:'.22em',color:'var(--silver)',textTransform:'uppercase'}}>League</div>
      </div>
      <div className="hdr-div"/>
      <div style={{fontSize:9,fontWeight:600,letterSpacing:'.2em',color:'rgba(168,196,224,.35)',textTransform:'uppercase',marginTop:6,marginBottom:3}}>Lobby Guesser</div>
    </div>
  )
}
