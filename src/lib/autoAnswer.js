export function autoAnswer(q, p) {
  const ql = q.toLowerCase()
  const nation = p.nation.toLowerCase()
  const pos = p.pos
  const clubs = p.clubs_history.map(c => c.toLowerCase())
  const curClub = p.club.toLowerCase()

  // Nationality
  const nationMap = {
    'french|from france': 'france',
    'spanish|from spain': 'spain',
    'portuguese|from portugal': 'portugal',
    'german|from germany': 'germany',
    'brazilian|from brazil': 'brazil',
    'argentin': 'argentina',
    'english|from england': 'england',
    'italian|from italy': 'italy',
    'dutch|from netherlands|from the netherlands': 'netherlands',
    'belgian|from belgium': 'belgium',
    'moroccan|from morocco': 'morocco',
    'senegalese|from senegal': 'senegal',
    'egyptian|from egypt': 'egypt',
    'croatian|from croatia': 'croatia',
    'norwegian|from norway': 'norway',
    'polish|from poland': 'poland',
    'swedish|from sweden': 'sweden',
    'welsh|from wales': 'wales',
    'uruguayan|from uruguay': 'uruguay',
    'chilean|from chile': 'chile',
    'south korean|from south korea|from korea': 'south korea',
    'nigerian|from nigeria': 'nigeria',
    'algerian|from algeria': 'algeria',
    'ivorian|from ivory coast|from cote d': 'ivory coast',
    'scottish|from scotland': 'scotland',
    'austrian|from austria': 'austria',
    'swiss|from switzerland': 'switzerland',
  }
  for (const [pattern, nat] of Object.entries(nationMap)) {
    if (new RegExp(pattern).test(ql)) return nation === nat
  }

  // Continent
  if (/european/.test(ql)) return p.continent === 'European'
  if (/south american|latin american/.test(ql)) return p.continent === 'South American'
  if (/african/.test(ql)) return p.continent === 'African'
  if (/asian/.test(ql)) return p.continent === 'Asian'

  // Position
  if (/\b(forward|striker|centre.forward|center.forward|cf|st)\b/.test(ql)) return pos === 'FW'
  if (/\b(midfielder|mid|cm|cam|cdm|central mid|attacking mid|defensive mid)\b/.test(ql)) return pos === 'MF'
  if (/\b(defender|centre.back|center.back|cb|full.back|fullback|right.back|left.back|rb|lb)\b/.test(ql)) return pos === 'DF'
  if (/\b(goalkeeper|goalie|keeper|gk)\b/.test(ql)) return pos === 'GK'
  if (/plays (in )?attack|attacking player/.test(ql)) return pos === 'FW'
  if (/plays (in )?midfield/.test(ql)) return pos === 'MF'
  if (/plays (in )?defence|plays (in )?defense/.test(ql)) return pos === 'DF'

  // Foot
  if (/left.foot(ed)?|prefers? left|stronger left/.test(ql)) return p.foot === 'left'
  if (/right.foot(ed)?|prefers? right|stronger right/.test(ql)) return p.foot === 'right'

  // UCL wins
  if (/never won|0 (ucl|champions league) win|hasn.t won|without winning/.test(ql)) return p.ucl_wins === 0
  if (/won.*(ucl|champions league)|ucl winner|champions league winner/.test(ql)) return p.ucl_wins > 0
  if (/won it once|won (it|the ucl|the champions league) (once|1 time|one time)/.test(ql)) return p.ucl_wins === 1
  if (/won it twice|won (it|the ucl|the champions league) (twice|2 times|two times)/.test(ql)) return p.ucl_wins === 2
  if (/won it (3|three) times/.test(ql)) return p.ucl_wins === 3
  if (/won it (4|four) times/.test(ql)) return p.ucl_wins === 4
  if (/won it (5|five) times/.test(ql)) return p.ucl_wins === 5
  if (/more than (once|1|one) ucl|multiple ucl|more than 1 champions/.test(ql)) return p.ucl_wins > 1
  if (/more than (twice|2|two) ucl|more than 2 champions/.test(ql)) return p.ucl_wins > 2
  if (/more than (3|three) ucl/.test(ql)) return p.ucl_wins > 3
  if (/at least (2|two) ucl/.test(ql)) return p.ucl_wins >= 2
  if (/at least (3|three) ucl/.test(ql)) return p.ucl_wins >= 3

  // UCL goals
  if (/over 50 ucl goals|more than 50 (ucl|champions league) goals/.test(ql)) return p.ucl_goals > 50
  if (/over 100 ucl goals|more than 100 (ucl|champions league) goals/.test(ql)) return p.ucl_goals > 100
  if (/over 20 ucl goals|more than 20 (ucl|champions league) goals/.test(ql)) return p.ucl_goals > 20
  if (/scored in (the )?ucl|has ucl goals|ucl goal scorer/.test(ql)) return p.ucl_goals > 0

  // UCL appearances
  if (/over 100 ucl (apps|appearances)|more than 100/.test(ql)) return p.ucl_apps > 100
  if (/over 150 ucl (apps|appearances)|more than 150/.test(ql)) return p.ucl_apps > 150
  if (/over 50 ucl (apps|appearances)|more than 50/.test(ql)) return p.ucl_apps > 50

  // Current status
  if (/still (active|playing|in football)|currently playing|not retired/.test(ql)) return p.club !== 'Retired'
  if (/retired|no longer playing/.test(ql)) return p.club === 'Retired'
  if (/plays in (saudi|saudi arabia|saudi league)/.test(ql)) return ['al nassr','al ittihad','al hilal','al ahli'].some(c => curClub.includes(c))
  if (/plays in (the )?(premier league|england|epl)/.test(ql)) return ['manchester city','manchester united','liverpool','arsenal','chelsea','tottenham'].some(c => curClub.includes(c))
  if (/plays in (la liga|spain|spanish league)/.test(ql)) return ['real madrid','barcelona','atletico'].some(c => curClub.includes(c))
  if (/plays in (ligue 1|france|french league)/.test(ql)) return ['psg','paris'].some(c => curClub.includes(c))
  if (/plays in (serie a|italy|italian league)/.test(ql)) return ['juventus','ac milan','inter milan','roma','napoli'].some(c => curClub.includes(c))
  if (/plays in (bundesliga|germany|german league)/.test(ql)) return ['bayern','dortmund'].some(c => curClub.includes(c))

  // Specific clubs (career history)
  const clubMap = {
    'real madrid': 'real madrid',
    'barcelona|barca': 'barcelona',
    'manchester city|man city': 'manchester city',
    'manchester united|man united|man utd': 'manchester united',
    'liverpool': 'liverpool',
    'psg|paris saint.germain|paris sg': 'psg',
    'juventus|juve': 'juventus',
    'bayern|fc bayern': 'bayern munich',
    'chelsea': 'chelsea',
    'arsenal': 'arsenal',
    'inter milan|inter fc|internazionale': 'inter milan',
    'ac milan|milan(?! city)': 'ac milan',
    'atletico madrid|atletico': 'atletico',
    'dortmund|bvb|borussia dortmund': 'dortmund',
    'ajax': 'ajax',
    'benfica': 'benfica',
    'tottenham|spurs': 'tottenham',
    'porto': 'porto',
    'monaco': 'monaco',
    'sevilla': 'sevilla',
    'napoli': 'napoli',
    'roma': 'roma',
  }
  for (const [pattern, clubKey] of Object.entries(clubMap)) {
    if (new RegExp(`(ever played for|played at|been at|at|for) (${pattern})|${pattern} (player|career)`).test(ql)) {
      return clubs.some(c => c.includes(clubKey))
    }
  }

  // Age
  const currentYear = 2025
  if (/under 25|younger than 25|25 or under/.test(ql)) return (currentYear - p.born) < 25
  if (/under 30|younger than 30|30 or under/.test(ql)) return (currentYear - p.born) < 30
  if (/over 30|older than 30|30 or older/.test(ql)) return (currentYear - p.born) >= 30
  if (/over 35|older than 35|35 or older/.test(ql)) return (currentYear - p.born) >= 35
  if (/born (in the )?1980s/.test(ql)) return p.born >= 1980 && p.born < 1990
  if (/born (in the )?1990s/.test(ql)) return p.born >= 1990 && p.born < 2000
  if (/born (in the )?2000s/.test(ql)) return p.born >= 2000
  if (/born before 1985/.test(ql)) return p.born < 1985
  if (/born before 1990/.test(ql)) return p.born < 1990
  if (/born before 1995/.test(ql)) return p.born < 1995
  if (/born after 1995/.test(ql)) return p.born > 1995
  if (/born after 2000/.test(ql)) return p.born > 2000

  // Fallback: unknown question
  return false
}
