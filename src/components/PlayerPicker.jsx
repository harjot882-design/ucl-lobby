import { useState } from "react";

const DB = {
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League":{
    "Arsenal":["Thierry Henry","Patrick Vieira","Dennis Bergkamp","Robert Pires","Freddie Ljungberg","Cesc Fàbregas","Robin van Persie","Samir Nasri","Jack Wilshere","Mesut Özil","Alexis Sánchez","Aaron Ramsey","Olivier Giroud","Pierre-Emerick Aubameyang","Bukayo Saka","Martin Ødegaard","Declan Rice","Gabriel Magalhães","William Saliba","Gabriel Martinelli","Kai Havertz","David Raya","Jurriën Timber","Leandro Trossard","Thomas Partey"],
    "Chelsea":["Frank Lampard","Didier Drogba","John Terry","Claude Makélélé","Arjen Robben","Petr Čech","Michael Essien","Michael Ballack","Eden Hazard","N'Golo Kanté","Diego Costa","Thibaut Courtois","David Luiz","Juan Mata","Fernando Torres","Oscar","Willian","Raheem Sterling","Mason Mount","Kai Havertz","Cole Palmer","Enzo Fernández","Moisés Caicedo","Reece James","Christopher Nkunku","Nicolas Jackson","Wesley Fofana"],
    "Liverpool":["Steven Gerrard","Michael Owen","Robbie Fowler","Xabi Alonso","Jamie Carragher","Sami Hyypiä","Luis García","Fernando Torres","Pepe Reina","Luis Suárez","Philippe Coutinho","Jordan Henderson","Raheem Sterling","Roberto Firmino","Sadio Mané","Mohamed Salah","Virgil van Dijk","Alisson Becker","Trent Alexander-Arnold","Andrew Robertson","Fabinho","Thiago Alcântara","Luis Díaz","Darwin Núñez","Cody Gakpo","Dominik Szoboszlai","Ryan Gravenberch","Alexis Mac Allister","Diogo Jota","Ibrahima Konaté"],
    "Manchester City":["Kevin De Bruyne","Sergio Agüero","David Silva","Yaya Touré","Vincent Kompany","Joe Hart","Fernandinho","Leroy Sané","Raheem Sterling","Gabriel Jesus","Bernardo Silva","İlkay Gündoğan","Riyad Mahrez","Kyle Walker","Aymeric Laporte","John Stones","Rodri","Phil Foden","Jack Grealish","Erling Haaland","Ederson","Rúben Dias","Manuel Akanji","Joško Gvardiol","Jeremy Doku","Savinho"],
    "Manchester United":["David Beckham","Ryan Giggs","Roy Keane","Andy Cole","Dwight Yorke","Ole Gunnar Solskjær","Ruud van Nistelrooy","Cristiano Ronaldo","Wayne Rooney","Paul Scholes","Rio Ferdinand","Nemanja Vidić","Patrice Evra","Edwin van der Sar","Michael Carrick","Robin van Persie","Juan Mata","Angel Di María","Paul Pogba","Marcus Rashford","Bruno Fernandes","Harry Maguire","Raphaël Varane","Casemiro","Jadon Sancho","Lisandro Martínez","Rasmus Højlund","Alejandro Garnacho","Kobbie Mainoo","André Onana"],
    "Tottenham":["Gareth Bale","Luka Modrić","Hugo Lloris","Jan Vertonghen","Toby Alderweireld","Christian Eriksen","Dele Alli","Son Heung-min","Harry Kane","Moussa Dembélé","Victor Wanyama","Kieran Trippier","Serge Aurier","Guglielmo Vicario","Micky van de Ven","Cristian Romero","Pedro Porro","Destiny Udogie","James Maddison","Dejan Kulusevski","Brennan Johnson","Dominic Solanke"],
    "Leeds United":["Rio Ferdinand","Harry Kewell","Mark Viduka","Alan Smith","Robbie Keane","Olivier Dacourt","Lucas Radebe","Lee Bowyer","Nigel Martyn","Robbie Fowler"],
    "Newcastle United":["Alan Shearer","Michael Owen","Craig Bellamy","Shay Given","Kieron Dyer","Obafemi Martins","Nick Pope","Fabian Schär","Sven Botman","Kieran Trippier","Bruno Guimarães","Joelinton","Alexander Isak","Anthony Gordon","Harvey Barnes"],
    "Aston Villa":["Ollie Watkins","Emiliano Martínez","Pau Torres","Ezri Konsa","John McGinn","Matty Cash","Youri Tielemans","Leon Bailey","Moussa Diaby","Jhon Durán","Morgan Rogers","Douglas Luiz","Lucas Digne"]
  },
  "🇪🇸 La Liga":{
    "Real Madrid":["Zinedine Zidane","Luís Figo","Ronaldo","Raúl","Iker Casillas","Roberto Carlos","Fernando Hierro","Steve McManaman","Guti","Sergio Ramos","Marcelo","Pepe","Karim Benzema","Cristiano Ronaldo","Mesut Özil","Xabi Alonso","Sami Khedira","Gareth Bale","Luka Modrić","Toni Kroos","Casemiro","Raphaël Varane","Dani Carvajal","Isco","James Rodríguez","Vinícius Jr","Rodrygo","Jude Bellingham","Kylian Mbappé","Thibaut Courtois","Éder Militão","David Alaba","Antonio Rüdiger","Ferland Mendy","Federico Valverde","Eduardo Camavinga","Aurélien Tchouaméni","Brahim Díaz","Arda Güler"],
    "Barcelona":["Rivaldo","Ronaldinho","Samuel Eto'o","Deco","Andrés Iniesta","Xavi","Lionel Messi","Thierry Henry","Yaya Touré","Dani Alves","Piqué","Zlatan Ibrahimović","David Villa","Cesc Fàbregas","Alexis Sánchez","Pedro","Jordi Alba","Sergio Busquets","Neymar","Ivan Rakitić","Luis Suárez","Marc-André ter Stegen","Philippe Coutinho","Ousmane Dembélé","Frenkie de Jong","Antoine Griezmann","Pedri","Gavi","Ronald Araújo","Jules Koundé","Raphinha","Robert Lewandowski","Alejandro Balde","Lamine Yamal","Dani Olmo","Pau Cubarsí","Fermín López"],
    "Atlético Madrid":["Fernando Torres","Sergio Agüero","Diego Forlán","Diego Godín","Filipe Luís","Koke","Jan Oblak","Antoine Griezmann","Arda Turan","Saúl Ñíguez","Thomas Partey","Álvaro Morata","João Félix","Yannick Carrasco","Marcos Llorente","Stefan Savić","Axel Witsel","Nahuel Molina","José María Giménez","Reinildo","Pablo Barrios","Samuel Lino","Memphis Depay"],
    "Valencia":["Gaizka Mendieta","Roberto Ayala","John Carew","Claudio López","David Villa","David Silva","Pablo Aimar","Rubén Baraja","Vicente","Marco Di Vaio","Santiago Cañizares","Fernando Morientes","Patrick Kluivert"],
    "Sevilla":["Dani Alves","Frédéric Kanouté","Jesús Navas","Ivan Rakitić","Kevin Gameiro","Carlos Bacca","Éver Banega","Samir Nasri","Yassine Bounou","Jules Koundé","Lucas Ocampos","Youssef En-Nesyri","Fernando","Marcos Acuña","Loïc Badé"],
    "Villarreal":["Riquelme","Diego Forlán","Santi Cazorla","Giuseppe Rossi","Robert Pires","Gerard Moreno","Dani Parejo","Raúl Albiol","Juan Foyth","Arnaut Danjuma","Paco Alcácer","Alberto Moreno","Étienne Capoue"],
    "Deportivo La Coruña":["Roy Makaay","Valerón","Diego Tristán","Víctor","Emerson","Djalminha","Mauro Silva","Fran","Donato","Walter Pandiani"],
    "Real Sociedad":["Xabi Alonso","Nihat","Mikel Oyarzabal","David Silva","Martin Zubimendi","Takefusa Kubo","Alexander Sørloth","Brais Méndez","Mikel Merino","Robin Le Normand"],
    "Real Betis":["Joaquín","Nabil Fekir","Sergio Canales","William Carvalho","Borja Iglesias","Guido Rodríguez","Marc Bartra","Claudio Bravo","Andrés Guardado","Alex Moreno"]
  },
  "🇩🇪 Bundesliga":{
    "Bayern Munich":["Oliver Kahn","Stefan Effenberg","Giovane Élber","Roy Makaay","Owen Hargreaves","Bastian Schweinsteiger","Franck Ribéry","Luca Toni","Miroslav Klose","Manuel Neuer","Philipp Lahm","Thomas Müller","Arjen Robben","Robert Lewandowski","Xabi Alonso","Thiago Alcântara","Toni Kroos","James Rodríguez","Arturo Vidal","Serge Gnabry","Leon Goretzka","Leroy Sané","Alphonso Davies","Joshua Kimmich","Jamal Musiala","Harry Kane","Dayot Upamecano","Kim Min-jae","Noussair Mazraoui","Kingsley Coman","Michael Olise"],
    "Borussia Dortmund":["Lars Ricken","Tomáš Rosický","Jan Koller","Márcio Amoroso","Robert Lewandowski","Mario Götze","Marco Reus","Mats Hummels","İlkay Gündoğan","Pierre-Emerick Aubameyang","Henrikh Mkhitaryan","Ousmane Dembélé","Shinji Kagawa","Łukasz Piszczek","Marcel Schmelzer","Gregor Kobel","Nico Schlotterbeck","Niklas Süle","Julian Brandt","Emre Can","Marcel Sabitzer","Karim Adeyemi","Donyell Malen","Giovanni Reyna","Julien Duranville","Felix Nmecha","Jamie Gittens"],
    "Bayer Leverkusen":["Michael Ballack","Dimitar Berbatov","Zé Roberto","Bernd Schneider","Stefan Kießling","Son Heung-min","Hakan Çalhanoğlu","Lukáš Hrádecký","Granit Xhaka","Florian Wirtz","Victor Boniface","Patrik Schick","Jonathan Tah","Piero Hincapié","Alejandro Grimaldo","Exequiel Palacios","Jonas Hofmann","Edmond Tapsoba","Robert Andrich","Amine Adli","Ibrahim Maza"],
    "RB Leipzig":["Timo Werner","Emil Forsberg","Dominik Szoboszlai","Dayot Upamecano","Christopher Nkunku","Dani Olmo","Peter Gulácsi","Willi Orbán","Ibrahima Konaté","Kevin Kampl","Mohamed Simakan","Castello Lukeba","David Raum","Xavi Simons","Lois Openda","Benjamin Šeško","Nicolas Seiwald","Christoph Baumgartner"],
    "Schalke 04":["Manuel Neuer","Raúl","Klaas-Jan Huntelaar","Jefferson Farfán","Julian Draxler","Benedikt Höwedes","Kevin-Prince Boateng","Roman Neustädter","Christian Poulsen","Hamit Altıntop","Atsuto Uchida","Andreas Möller"],
    "Borussia M'gladbach":["Marcus Thuram","Alassane Pléa","Denis Zakaria","Florian Neuhaus","Ramy Bensebaini","Thorgan Hazard","Lars Stindl","Raffael","Patrick Herrmann"],
    "VfB Stuttgart":["Philipp Lahm","Mario Gomez","Cacau","Alexander Hleb","Serhou Guirassy","Deniz Undav","Alexander Nübel","Waldemar Anton","Hiroki Ito","Chris Führich","Angelo Stiller","Maximilian Mittelstädt"],
    "Eintracht Frankfurt":["Mario Götze","André Silva","Filip Kostić","Randal Kolo Muani","Luka Jović","Kevin Trapp","Omar Marmoush","Ansgar Knauff","Junior Dina Ebimbe","Hugo Larsson","Makoto Hasebe"],
    "Hamburg SV":["Rafael van der Vaart","Ivica Olić","Ze Roberto","Ruud van Nistelrooy","Daniel Van Buyten","Mladen Petric","Sergej Barbarez"]
  },
  "🇮🇹 Serie A":{
    "AC Milan":["Paolo Maldini","Alessandro Nesta","Cafu","Gennaro Gattuso","Andrea Pirlo","Clarence Seedorf","Kaká","Andriy Shevchenko","Filippo Inzaghi","Dida","Zlatan Ibrahimović","Alexandre Pasto","Robinho","Ronaldinho","Stephan El Shaarawy","Franck Kessié","Theo Hernández","Mike Maignan","Pierre Kalulu","Malick Thiaw","Fikayo Tomori","Davide Calabria","Sandro Tonali","Tijjani Reijnders","Rafael Leão","Christian Pulisic","Samuel Chukwueze","Olivier Giroud","Ruben Loftus-Cheek","Yunus Musah","Noah Okafor"],
    "Inter Milan":["Ronaldo","Roberto Baggio","Christian Vieri","Clarence Seedorf","Adriano","Zlatan Ibrahimović","Dejan Stanković","Wesley Sneijder","Diego Milito","Samuel Eto'o","Maicon","Walter Samuel","Javier Zanetti","Patrick Vieira","Luis Figo","Esteban Cambiasso","Samir Handanović","Mauro Icardi","Ivan Perišić","Achraf Hakimi","Romelu Lukaku","Lautaro Martínez","Nicolò Barella","Marcelo Brozović","Stefan de Vrij","Yann Sommer","Alessandro Bastoni","Federico Dimarco","Denzel Dumfries","Hakan Çalhanoğlu","Henrikh Mkhitaryan","Marcus Thuram","Francesco Acerbi"],
    "Juventus":["Zinedine Zidane","Alessandro Del Piero","David Trezeguet","Pavel Nedvěd","Gianluigi Buffon","Lilian Thuram","Fabio Cannavaro","Emerson","Zlatan Ibrahimović","Andrea Pirlo","Giorgio Chiellini","Leonardo Bonucci","Claudio Marchisio","Arturo Vidal","Paul Pogba","Carlos Tevez","Álvaro Morata","Gonzalo Higuaín","Cristiano Ronaldo","Aaron Ramsey","Adrien Rabiot","Matthijs de Ligt","Federico Chiesa","Dušan Vlahović","Manuel Locatelli","Bremer","Kenan Yıldız","Timothy Weah","Weston McKennie"],
    "Roma":["Francesco Totti","Gabriel Batistuta","Cafu","Walter Samuel","Emerson","Damiano Tommasi","Vincenzo Montella","Philippe Mexès","Mirko Vučinić","Mohamed Salah","Radja Nainggolan","Kevin Strootman","Edin Džeko","Chris Smalling","Bryan Cristante","Lorenzo Pellegrini","Paulo Dybala","Tammy Abraham","Romelu Lukaku","Stephan El Shaarawy","Gianluca Mancini"],
    "Napoli":["Edinson Cavani","Ezequiel Lavezzi","Marek Hamšík","Dries Mertens","José Callejón","Lorenzo Insigne","Jorginho","Kalidou Koulibaly","Fabian Ruiz","Hirving Lozano","Victor Osimhen","Khvicha Kvaratskhelia","Kim Min-jae","Stanislav Lobotka","Frank Zambo Anguissa","Giovanni Di Lorenzo","Alex Meret","Giacomo Raspadori","Giovanni Simeone"],
    "Atalanta":["Josip Iličić","Alejandro Gómez","Duván Zapata","Robin Gosens","Marten de Roon","Teun Koopmeiners","Ademola Lookman","Gianluca Scamacca","Charles De Ketelaere","Giorgio Scalvini","Mario Pašalić","Davide Zappacosta","Marco Carnesecchi","Lazar Samardžić"],
    "Lazio":["Alessandro Nesta","Hernán Crespo","Juan Sebastián Verón","Sinisa Mihajlović","Pavel Nedvěd","Dejan Stanković","Roberto Mancini","Ciro Immobile","Sergej Milinković-Savić","Luis Alberto","Felipe Anderson","Stefan de Vrij","Ivan Provedel","Alessio Romagnoli","Mattia Zaccagni","Taty Castellanos"],
    "Fiorentina":["Luca Toni","Stevan Jovetić","Adrian Mutu","Riccardo Montolivo","Alberto Gilardino","Nikola Milenković","Lucas Martínez Quarta","Sofyan Amrabat","Nicolas González","Jonathan Ikoné","Luca Jović","Moise Kean","Albert Guðmundsson","Cristiano Biraghi","Dodô"]
  },
  "🇫🇷 Ligue 1":{
    "Paris Saint-Germain":["Ronaldinho","Nicolas Anelka","Jay-Jay Okocha","Zlatan Ibrahimović","Ezequiel Lavezzi","Lucas Moura","David Luiz","Javier Pastore","Marquinhos","Marco Verratti","Ángel Di María","Edinson Cavani","Neymar","Kylian Mbappé","Thiago Silva","Mauro Icardi","Keylor Navas","Gianluigi Donnarumma","Achraf Hakimi","Sergio Ramos","Presnel Kimpembe","Lionel Messi","Nuno Mendes","Vitinha","Warren Zaïre-Emery","Fabian Ruiz","Ousmane Dembélé","Gonçalo Ramos","Lee Kang-in","Bradley Barcola","Randal Kolo Muani","Désiré Doué"],
    "Olympique Lyonnais":["Grégory Coupet","Juninho","Mahamadou Diarra","Michael Essien","Florent Malouda","Sonny Anderson","Karim Benzema","Hugo Lloris","Miralem Pjanić","Sidney Govou","Sylvain Wiltord","Edmilson","Kim Källström","Bafétimbi Gomis","Nabil Fekir","Memphis Depay","Moussa Dembélé","Houssem Aouar","Anthony Lopes","Corentin Tolisso","Rayan Cherki","Alexandre Lacazette","Ernest Nuamah"],
    "Olympique de Marseille":["Didier Drogba","Franck Ribéry","Hatem Ben Arfa","Samir Nasri","Steve Mandanda","André-Pierre Gignac","Loïc Rémy","Dimitri Payet","Florian Thauvin","Morgan Sanson","Luiz Gustavo","Gabriel Heinze","William Gallas","Pau López","Jonathan Clauss","Samuel Gigot","Leonardo Balerdi","Nuno Tavares","Mattéo Guendouzi","Pierre-Emerick Aubameyang","Iliman Ndiaye","Alexis Sánchez","Geoffrey Kondogbia","Mason Greenwood"],
    "Monaco":["Dado Pršo","Fernando Morientes","Ludovic Giuly","Patrice Evra","Radamel Falcao","James Rodríguez","Joao Moutinho","Bernardo Silva","Thomas Lemar","Kylian Mbappé","Tiémoué Bakayoko","Djibril Sidibé","Benjamin Mendy","Fabinho","Wissam Ben Yedder","Caio Henrique","Folarin Balogun","Aleksandr Golovin","Eliesse Ben Seghir"],
    "Lille":["Eden Hazard","Gervinho","Yohan Cabaye","Simon Mignolet","Kevin Mirallas","Moussa Sow","Éric Abidal","Mathieu Debuchy","Jonathan David","Angel Gomes","Lucas Chevalier","Leny Yoro","Edon Zhegrova","Adam Ounas","Benjamin André"],
    "Rennes":["Jérémy Doku","Benjamin Bourigeaud","Martin Terrier","Lovro Majer","Amine Gouiri","Arnaud Kalimuendo","Arthur Theate","Hamari Traoré","Adrien Truffert","Steve Mandanda","Asamoah Gyan"],
    "Nice":["Khéphren Thuram","Marcin Bułka","Jean-Clair Todibo","Dante","Jordan Lotomba","Gaëtan Laborde","Terem Moffi","Evann Guessand","Youcef Atal","Nicolas Pépé","Mohamed-Ali Cho","Ross Barkley"],
    "Lens":["Loïs Openda","Brice Samba","Jonathan Gradit","Kevin Danso","Salis Abdul Samed","Angelo Fulgini","Florian Sotoca","Neil El Aynaoui","Przemysław Frankowski"]
  }
};

const LEAGUES = Object.keys(DB);

export default function PlayerPicker({ onSelect }) {
  const [view, setView] = useState("leagues"); // leagues | teams | players
  const [selLeague, setSelLeague] = useState(null);
  const [selTeam, setSelTeam] = useState(null);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const searching = q.length > 1;

  const searchResults = searching
    ? LEAGUES.flatMap(league =>
        Object.entries(DB[league]).flatMap(([team, players]) =>
          players
            .filter(p => p.toLowerCase().includes(q))
            .map(p => ({ p, team, league }))
        )
      )
    : [];

  const goBack = () => {
    if (view === "players") { setView("teams"); setSelTeam(null); }
    else { setView("leagues"); setSelLeague(null); }
  };

  return (
    <div className="picker-wrap">
      {/* Search */}
      <div className="picker-search-bar">
        <span className="picker-search-icon">🔍</span>
        <input
          className="picker-search-input"
          placeholder="Search any player…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Search results */}
      {searching ? (
        <div>
          <div className="picker-label">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</div>
          {searchResults.length === 0
            ? <div className="picker-empty">No players found for "{search}"</div>
            : <div className="picker-player-list">
                {searchResults.map(({ p, team, league }) => (
                  <button key={p + team} className="picker-player-btn" onClick={() => onSelect(p)}>
                    <span className="picker-player-name">{p}</span>
                    <span className="picker-player-meta">{league.replace(/^\S+\s/, "")} · {team}</span>
                  </button>
                ))}
              </div>
          }
        </div>

      ) : view === "leagues" ? (
        <div>
          <div className="picker-label">Select a league</div>
          <div className="picker-league-list">
            {LEAGUES.map(league => {
              const clubCount = Object.keys(DB[league]).length;
              const playerCount = Object.values(DB[league]).flat().length;
              return (
                <button key={league} className="picker-league-btn" onClick={() => { setSelLeague(league); setView("teams"); }}>
                  <span className="picker-league-flag">{league.split(" ")[0]}</span>
                  <span className="picker-league-name">{league.replace(/^\S+\s/, "")}</span>
                  <span className="picker-league-count">{clubCount} clubs · {playerCount} players</span>
                </button>
              );
            })}
          </div>
        </div>

      ) : view === "teams" ? (
        <div>
          <button className="picker-back-btn" onClick={goBack}>← Back</button>
          <div className="picker-label">{selLeague.replace(/^\S+\s/, "")} — pick a club</div>
          <div className="picker-team-grid">
            {Object.keys(DB[selLeague]).map(team => (
              <button key={team} className="picker-team-btn" onClick={() => { setSelTeam(team); setView("players"); }}>
                {team}
              </button>
            ))}
          </div>
        </div>

      ) : (
        <div>
          <button className="picker-back-btn" onClick={goBack}>← Back to clubs</button>
          <div className="picker-label">{selTeam} — {DB[selLeague][selTeam].length} players</div>
          <div className="picker-player-list">
            {DB[selLeague][selTeam].map(p => (
              <button key={p} className="picker-player-btn" onClick={() => onSelect(p)}>
                <span className="picker-player-name">{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
