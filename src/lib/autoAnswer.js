export function autoAnswer(question, player) {
  const q = question.toLowerCase().trim()
  const p = player
  const uclWon = p.ucl.toLowerCase().startsWith('won')

  if (/\b(gk|goalkeeper|keeper|goalie)\b/.test(q)) return p.pos === 'GK'
  if (/\b(defender|centre.?back|center.?back|fullback|right.?back|left.?back)\b/.test(q)) return p.pos === 'DF'
  if (/\b(midfielder|midfield|cdm|cam|box.to.box)\b/.test(q)) return p.pos === 'MF'
  if (/\b(forward|striker|attacker|winger)\b/.test(q)) return p.pos === 'FW'
  if (/left.?foot(ed)?/.test(q)) return p.foot === 'Left'
  if (/right.?foot(ed)?/.test(q)) return p.foot === 'Right'
  if (/won.*ucl|ucl.*winner|win.*ucl|won.*champions league|champions league winner/i.test(q)) return uclWon
  if (/(never|not|didn.t).*won.*ucl|never won.*champions/i.test(q)) return !uclWon
  if (/ucl.*finalist|reached.*final/i.test(q)) return p.ucl.toLowerCase().includes('final')
  if (/won.*ucl.*more than once|multiple.*ucl|won.*ucl.*twice/i.test(q)) return (p.ucl.match(/\d{4}/g)||[]).length >= 2

  const bornAfter = q.match(/born after (\d{4})/i)
  if (bornAfter) return p.born > parseInt(bornAfter[1])
  const bornBefore = q.match(/born before (\d{4})/i)
  if (bornBefore) return p.born < parseInt(bornBefore[1])
  if (/\b(90s|1990s)\b/.test(q)) return p.born >= 1990 && p.born < 2000
  if (/\b(80s|1980s)\b/.test(q)) return p.born >= 1980 && p.born < 1990
  if (/\b(2000s)\b/.test(q)) return p.born >= 2000 && p.born < 2010
  if (/still (active|playing)|currently playing|active player/i.test(q)) return p.club !== 'Retired'
  if (/\bretired\b/.test(q)) return p.club === 'Retired'

  const tallerMatch = q.match(/taller than (\d{3})|over (\d{3})\s*cm/i)
  if (tallerMatch) return p.height > parseInt(tallerMatch[1] || tallerMatch[2])
  const shorterMatch = q.match(/shorter than (\d{3})|under (\d{3})\s*cm/i)
  if (shorterMatch) return p.height < parseInt(shorterMatch[1] || shorterMatch[2])

  const goalsMore = q.match(/more than (\d+) goals|(\d+)\+ goals|over (\d+) goals/i)
  if (goalsMore) return p.goals > parseInt(goalsMore[1]||goalsMore[2]||goalsMore[3])
  if (/scored.{0,15}goal|any goals?/i.test(q)) return p.goals > 0

  const clubMap = {
    'real madrid':'Real Madrid','barcelona':'Barcelona','barça':'Barcelona',
    'bayern':'Bayern Munich','liverpool':'Liverpool',
    'man city':'Man City','manchester city':'Man City',
    'man utd':'Man Utd','manchester united':'Man Utd','man united':'Man Utd',
    'chelsea':'Chelsea','ac milan':'AC Milan','milan':'AC Milan',
    'psg':'PSG','paris':'PSG','juventus':'Juventus','juve':'Juventus',
    'arsenal':'Arsenal','atletico':'Atlético Madrid','dortmund':'Dortmund',
    'inter milan':'Inter Milan','inter':'Inter Milan','tottenham':'Tottenham',
    'al nassr':'Al Nassr','al hilal':'Al-Hilal','al ittihad':'Al-Ittihad',
    'inter miami':'Inter Miami',
  }
  const everPlayed = /ever (played|been)|played for|been at|career at/i.test(q)
  for (const [key, val] of Object.entries(clubMap)) {
    if (q.includes(key)) {
      if (everPlayed) return (p.clubs_history||[p.club]).some(c => c.toLowerCase().includes(key) || c === val)
      return p.club === val
    }
  }

  const natMap = {
    'portuguese':'Portugal','spanish':'Spain','french':'France','german':'Germany',
    'brazilian':'Brazil','argentinian':'Argentina','english':'England','italian':'Italy',
    'dutch':'Netherlands','belgian':'Belgium','croatian':'Croatia','senegalese':'Senegal',
    'egyptian':'Egypt','moroccan':'Morocco','polish':'Poland','norwegian':'Norway',
    'swedish':'Sweden','ukrainian':'Ukraine','cameroonian':'Cameroon',
    'scottish':'Scotland','welsh':'Wales','canadian':'Canada',
    'slovenian':'Slovenia','austrian':'Austria','ivorian':'Ivory Coast',
  }
  for (const [key, val] of Object.entries(natMap)) {
    if (q.includes(key)) return p.nat === val
  }

  const leagueMap = {
    'premier league':'Premier League','la liga':'La Liga',
    'bundesliga':'Bundesliga','serie a':'Serie A','ligue 1':'Ligue 1',
    'saudi':'Saudi Pro','mls':'MLS',
  }
  for (const [key, val] of Object.entries(leagueMap)) {
    if (q.includes(key)) return p.league === val
  }

  return null
}
