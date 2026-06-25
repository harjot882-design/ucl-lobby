import { useMemo } from 'react'
export default function Background() {
  const stars = useMemo(() => Array.from({length:48},(_,i)=>({id:i,size:Math.random()*2.4+.4,top:Math.random()*100,left:Math.random()*100,dur:2+Math.random()*5,delay:-Math.random()*5})),[])
  return (
    <div className="bg">
      <div className="bg-grad"/>
      <svg className="hex" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="hx" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
          <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke="rgba(77,166,255,1)" strokeWidth=".45"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#hx)"/>
      </svg>
      {stars.map(s=><div key={s.id} className="star" style={{width:s.size,height:s.size,top:`${s.top}%`,left:`${s.left}%`,'--dur':`${s.dur}s`,animationDelay:`${s.delay}s`}}/>)}
      <div className="glow-line" style={{top:'31%',width:'100%',left:0}}/>
      <div className="glow-line" style={{top:'66%',width:'72%',left:'14%'}}/>
    </div>
  )
}
