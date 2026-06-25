export function autoAnswer(q, p) {
  const nation = p.nation.toLowerCase()
  const pos = p.pos
  const clubs = p.clubs_history.map(c => c.toLowerCase())

  if (/french|from france/.test(q)) return nation === 'france'
  if (/spanish|from spain/.test(q)) return nation === 'spain'
  if (/portuguese|from portugal/.test(q)) return nation === 'portugal'
  if (/german|from germany/.test(q)) return nation === 'germany'
  if (/brazilian|from brazil/.test(q)) return nation === 'brazil'
  if (/argentin(e|ian)|from argentina/.test(q)) return nation === 'argentina'
  if (/english|from england/.test(q)) return nation === 'england'
  if (/italian|from italy/.test(q)) return nation === 'italy'
  if (/dutch|from (the )?netherlands/.test(q)) return nation === 'netherlands'
  if (/belgian|from belgium/.test(q)) return nation === 'belgium'
  if (/moroccan|from morocco/.test(q)) return nation === 'morocco'
  if (/senegalese|from senegal/.test(q)) return nation === 'senegal'
  if (/egyptian|from egypt/.test(q)) return nation === 'egypt'
  if (/croat(ian)?|from croatia/.test(q)) return nation === 'croatia'
  if (/norwegian|from norway/.test(q)) return nation === 'norway'
  if (/polish|from poland/.test(q)) return nation === 'poland'
  if (/swedish|from sweden/.test(q)) return nation === 'sweden'
  if (/welsh|from wales/.test(q)) return nation === 'wales'
  if (/uruguayan|from uruguay/.test(q)) return nation === 'uruguay'
  if (/chilean|from chile/.test(q)) return nation === 'chile'
  if (/south korean|from (south )?korea/.test(q)) return nation === 'south korea'
  if (/nigerian|from nigeria/.test(q)) return nation === 'nigeria'
  if (/algerian|from algeria/.test(q)) return nation === 'algeria'
  if (/ivory coast|ivorian/.test(q)) return nation === 'ivory coast'
  if (/european/.test(q)) return p.continent === 'European'
  if (/south american/.test(q)) return p.continent === 'South American'
  if (/african/.test(q)) return p.continent === 'African'
  if (/asian/.test(q)) return p.continent === 'Asian'
  if (/forward|striker/.test(q)) return pos === 'FW'
  if (/midfielder/.test(q)) return pos === 'MF'
  if (/defender/.test(q)) return pos === 'DF'
  if (/goalkeeper|goalie/.test(q)) return pos === 'GK'
  if (/left.foot/.test(q)) return p.foot === 'left'
  if (/right.foot/.test(q)) return p.foot === 'right'
  if (/never won|without winning|0 ucl/.test(q)) return p.ucl_wins === 0
  if (/won.*(ucl|champions league)/.test(q)) return p.ucl_wins > 0
  if (/more than once|multiple times|more than 1 ucl/.test(q)) return p.ucl_wins > 1
  if (/more than (twice|2)/.test(q)) return p.ucl_wins > 2
  if (/won it (3|three) times/.test(q)) return p.ucl_wins === 3
  if (/still (active|playing)|currently playing/.test(q)) return p.club !== 'Retired'
  if (/retired/.test(q)) return p.club === 'Retired'
  if (/real madrid/.test(q)) return clubs.some(c => c.includes('real madrid'))
  if (/barcelona/.test(q)) return clubs.some(c => c.includes('barcelona'))
  if (/manchester city/.test(q)) return clubs.some(c => c.includes('manchester city'))
  if (/manchester united/.test(q)) return clubs.some(c => c.includes('manchester united'))
  if (/liverpool/.test(q)) return clubs.some(c => c.includes('liverpool'))
  if (/psg|paris saint.germain/.test(q)) return clubs.some(c => c.includes('psg') || c.includes('paris'))
  if (/juventus/.test(q)) return clubs.some(c => c.includes('juventus'))
  if (/bayern/.test(q)) return clubs.some(c => c.includes('bayern'))
  if (/chelsea/.test(q)) return clubs.some(c => c.includes('chelsea'))
  if (/arsenal/.test(q)) return clubs.some(c => c.includes('arsenal'))
  if (/inter milan/.test(q)) return clubs.some(c => c.includes('inter milan'))
  if (/ac milan/.test(q)) return clubs.some(c => c.includes('ac milan'))
  if (/atletico/.test(q)) return clubs.some(c => c.includes('atletico'))
  if (/dortmund|bvb/.test(q)) return clubs.some(c => c.includes('dortmund'))
  if (/ajax/.test(q)) return clubs.some(c => c.includes('ajax'))
  if (/benfica/.test(q)) return clubs.some(c => c.includes('benfica'))
  if (/tottenham|spurs/.test(q)) return clubs.some(c => c.includes('tottenham'))
  if (/over 50 ucl goals/.test(q)) return p.ucl_goals > 50
  if (/over 100 ucl apps/.test(q)) return p.ucl_apps > 100
  if (/born.*(1990s|after 1989)/.test(q)) return p.born >= 1990 && p.born < 2000
  if (/born.*(2000s|after 1999)/.test(q)) return p.born >= 2000
  if (/born before 1990/.test(q)) return p.born < 1990
  if (/under 25/.test(q)) return (2025 - p.born) <= 25
  if (/over 30/.test(q)) return (2025 - p.born) >= 30
  return false
}
