// playerDatabase.js
// Organised by League → Team → Players
// Covers top 5 leagues with current squads (2024/25 season)
// Focus on UCL-participating clubs but includes all top flight players

export const PLAYER_DATABASE = {
  "Premier League": {
    "Arsenal": [
      "David Raya", "Aaron Ramsdale", "Ben White", "Jurriën Timber", "William Saliba",
      "Gabriel Magalhães", "Oleksandr Zinchenko", "Kieran Tierney", "Thomas Partey",
      "Jorginho", "Martin Ødegaard", "Declan Rice", "Bukayo Saka", "Leandro Trossard",
      "Gabriel Martinelli", "Kai Havertz", "Eddie Nketiah", "Raheem Sterling"
    ],
    "Liverpool": [
      "Alisson Becker", "Caoimhín Kelleher", "Trent Alexander-Arnold", "Andrew Robertson",
      "Virgil van Dijk", "Ibrahima Konaté", "Joe Gomez", "Alexis Mac Allister",
      "Dominik Szoboszlai", "Ryan Gravenberch", "Curtis Jones", "Mohamed Salah",
      "Luis Díaz", "Cody Gakpo", "Darwin Núñez", "Diogo Jota", "Harvey Elliott"
    ],
    "Manchester City": [
      "Ederson", "Stefan Ortega", "Rúben Dias", "John Stones", "Manuel Akanji",
      "Joško Gvardiol", "Kyle Walker", "Rodri", "Kevin De Bruyne", "Bernardo Silva",
      "İlkay Gündoğan", "Phil Foden", "Jack Grealish", "Jeremy Doku", "Erling Haaland",
      "Oscar Bobb", "Matheus Nunes", "Savinho"
    ],
    "Aston Villa": [
      "Emiliano Martínez", "Ezri Konsa", "Pau Torres", "Tyrone Mings", "Lucas Digne",
      "Matty Cash", "Youri Tielemans", "Douglas Luiz", "John McGinn", "Leon Bailey",
      "Moussa Diaby", "Ollie Watkins", "Jhon Durán", "Morgan Rogers", "Nicolò Zaniolo"
    ],
    "Chelsea": [
      "Robert Sánchez", "Filip Jörgensen", "Reece James", "Ben Chilwell", "Levi Colwill",
      "Wesley Fofana", "Trevoh Chalobah", "Moisés Caicedo", "Enzo Fernández",
      "Romeo Lavia", "Cole Palmer", "Christopher Nkunku", "Nicolas Jackson",
      "Pedro Neto", "Jadon Sancho", "Noni Madueke", "Marc Guiu"
    ],
    "Tottenham Hotspur": [
      "Guglielmo Vicario", "Pedro Porro", "Micky van de Ven", "Cristian Romero",
      "Destiny Udogie", "Yves Bissouma", "Pape Matar Sarr", "James Maddison",
      "Dejan Kulusevski", "Son Heung-min", "Dominic Solanke", "Brennan Johnson",
      "Timo Werner", "Manor Solomon"
    ],
    "Manchester United": [
      "André Onana", "Diogo Dalot", "Victor Lindelöf", "Harry Maguire", "Raphaël Varane",
      "Luke Shaw", "Lisandro Martínez", "Casemiro", "Bruno Fernandes", "Mason Mount",
      "Kobbie Mainoo", "Marcus Rashford", "Alejandro Garnacho", "Rasmus Højlund",
      "Antony", "Amad Diallo", "Christian Eriksen"
    ],
    "Newcastle United": [
      "Nick Pope", "Martin Dúbravka", "Kieran Trippier", "Sven Botman", "Fabian Schär",
      "Dan Burn", "Bruno Guimarães", "Joelinton", "Sean Longstaff", "Anthony Gordon",
      "Harvey Barnes", "Alexander Isak", "Callum Wilson", "Miguel Almirón"
    ],
    "West Ham United": [
      "Alphonse Aréola", "Ben Johnson", "Kurt Zouma", "Nayef Aguerd", "Aaron Cresswell",
      "Tomáš Souček", "Lucas Paquetá", "James Ward-Prowse", "Mohammed Kudus",
      "Jarrod Bowen", "Michail Antonio", "Edson Álvarez"
    ],
    "Brighton & Hove Albion": [
      "Bart Verbruggen", "Joel Veltman", "Lewis Dunk", "Igor", "Pervis Estupiñán",
      "Billy Gilmour", "Pascal Groß", "Adam Lallana", "Kaoru Mitoma", "Simon Adingra",
      "Evan Ferguson", "João Pedro", "Tariq Lamptey"
    ]
  },

  "La Liga": {
    "Real Madrid": [
      "Thibaut Courtois", "Andriy Lunin", "Dani Carvajal", "Éder Militão",
      "Antonio Rüdiger", "David Alaba", "Ferland Mendy", "Luca Modric",
      "Toni Kroos", "Eduardo Camavinga", "Aurélien Tchouaméni", "Federico Valverde",
      "Jude Bellingham", "Vinícius Jr", "Rodrygo", "Kylian Mbappé", "Brahim Díaz"
    ],
    "Barcelona": [
      "Marc-André ter Stegen", "Iñaki Peña", "Jules Koundé", "Ronald Araújo",
      "Pau Cubarsí", "Alejandro Balde", "Íñigo Martínez", "Frenkie de Jong",
      "Pedri", "Gavi", "Dani Olmo", "Fermin López", "Raphinha", "Lamine Yamal",
      "Robert Lewandowski", "Fermín López", "Eric García"
    ],
    "Atlético Madrid": [
      "Jan Oblak", "Nahuel Molina", "José María Giménez", "César Azpilicueta",
      "Reinildo", "Marcos Llorente", "Koke", "Pablo Barrios", "Saúl Ñíguez",
      "Ángel Correa", "Antoine Griezmann", "Álvaro Morata", "Memphis Depay",
      "Samuel Lino", "Rodrigo Riquelme"
    ],
    "Athletic Bilbao": [
      "Unai Simón", "Dani Vivian", "Yeray Álvarez", "Aitor Paredes", "Mikel Jauregizar",
      "Óscar de Marcos", "Dani García", "Mikel Vesga", "Oihan Sancet", "Iker Muniain",
      "Nico Williams", "Iñaki Williams", "Gorka Guruzeta", "Álex Berenguer"
    ],
    "Villarreal": [
      "Diego Conde", "Alfonso Pedraza", "Pau Torres", "Eric Bailly", "Yeremy Pino",
      "Étienne Capoue", "Dani Parejo", "Alex Baena", "Pepe Reina", "Gerard Moreno",
      "Arnaut Danjuma", "Nicolas Pépé"
    ],
    "Girona": [
      "Paulo Gazzaniga", "Miguel Gutiérrez", "Daley Blind", "Íñigo Martínez",
      "Yan Couto", "Aleix García", "Oriol Romeu", "Viktor Tsygankov",
      "Savinho", "Artem Dovbyk", "Taty Castellanos", "Bryan Gil"
    ],
    "Real Sociedad": [
      "Álex Remiro", "Álvaro Odriozola", "Aritz Elustondo", "Robin Le Normand",
      "Jon Pacheco", "Mikel Merino", "Martín Zubimendi", "David Silva",
      "Takefusa Kubo", "Mikel Oyarzabal", "Alexander Sørloth", "Brais Méndez"
    ],
    "Sevilla": [
      "Yassine Bounou", "Jesús Navas", "Loïc Badé", "Tanguy Nianzou", "Marcos Acuña",
      "Joan Jordán", "Fernando", "Nemanja Gudelj", "Lucas Ocampos", "Suso",
      "Youssef En-Nesyri", "Rafa Mir"
    ]
  },

  "Bundesliga": {
    "Bayern Munich": [
      "Manuel Neuer", "Sven Ulreich", "Noussair Mazraoui", "Dayot Upamecano",
      "Kim Min-jae", "Alphonso Davies", "Konrad Laimer", "Joshua Kimmich",
      "Leon Goretzka", "Jamal Musiala", "Leroy Sané", "Thomas Müller",
      "Serge Gnabry", "Harry Kane", "Eric Maxim Choupo-Moting", "Kingsley Coman"
    ],
    "Bayer Leverkusen": [
      "Lukáš Hrádecký", "Jonathan Tah", "Piero Hincapié", "Edmond Tapsoba",
      "Alejandro Grimaldo", "Granit Xhaka", "Exequiel Palacios", "Florian Wirtz",
      "Jonas Hofmann", "Victor Boniface", "Patrik Schick", "Adam Hlozek",
      "Robert Andrich", "Granit Xhaka", "Amine Adli"
    ],
    "Borussia Dortmund": [
      "Gregor Kobel", "Mats Hummels", "Nico Schlotterbeck", "Niklas Süle",
      "Julian Ryerson", "Marcel Sabitzer", "Emre Can", "Julien Duranville",
      "Marco Reus", "Julian Brandt", "Karim Adeyemi", "Sébastien Haller",
      "Donyell Malen", "Félix Nmecha", "Giovanni Reyna"
    ],
    "RB Leipzig": [
      "Peter Gulácsi", "Willi Orbán", "Mohamed Simakan", "Castello Lukeba",
      "David Raum", "Kevin Kampl", "Xaver Schlager", "Amadou Haidara",
      "Lois Openda", "Benjamin Šeško", "Xavi Simons", "Timo Werner",
      "Nicolas Seiwald", "Christoph Baumgartner"
    ],
    "VfB Stuttgart": [
      "Alexander Nübel", "Waldemar Anton", "Dan-Axel Zagadou", "Hiroki Ito",
      "Pascal Stenzel", "Atakan Karazor", "Angelo Stiller", "Chris Führich",
      "Enzo Millot", "Serhou Guirassy", "Deniz Undav", "Silas",
      "Maximilian Mittelstädt"
    ],
    "Borussia Mönchengladbach": [
      "Jonas Omlin", "Joe Scally", "Nico Elvedi", "Ko Itakura", "Ramy Bensebaini",
      "Manu Koné", "Julian Weigl", "Florian Neuhaus", "Alassane Pléa",
      "Marcus Thuram", "Franck Honorat"
    ],
    "Eintracht Frankfurt": [
      "Kevin Trapp", "Tuta", "Evan Ndicka", "Rasmus Kristensen", "Willian Pacho",
      "Sebastian Rode", "Djibril Sow", "Mario Götze", "Randal Kolo Muani",
      "Omar Marmoush", "Ansgar Knauff", "Junior Dina Ebimbe"
    ],
    "Wolfsburg": [
      "Koen Casteels", "Ridle Baku", "Sebastiaan Bornauw", "Maxence Lacroix",
      "Paulo Otávio", "Maximilian Arnold", "Xaver Schlager", "Yannick Gerhardt",
      "Lukas Nmecha", "Jonas Wind", "Tiago Tomás", "Kevin Paredes"
    ]
  },

  "Serie A": {
    "Inter Milan": [
      "Yann Sommer", "André Onana", "Matteo Darmian", "Francesco Acerbi",
      "Alessandro Bastoni", "Federico Dimarco", "Denzel Dumfries", "Nicolò Barella",
      "Hakan Çalhanoğlu", "Henrikh Mkhitaryan", "Lautaro Martínez", "Marcus Thuram",
      "Alexis Sánchez", "Stefan de Vrij", "Kristjan Asllani"
    ],
    "AC Milan": [
      "Mike Maignan", "Pierre Kalulu", "Malick Thiaw", "Fikayo Tomori", "Theo Hernández",
      "Davide Calabria", "Ismael Bennacer", "Tijjani Reijnders", "Ruben Loftus-Cheek",
      "Christian Pulisic", "Rafael Leão", "Olivier Giroud", "Luka Jović",
      "Noah Okafor", "Samuel Chukwueze", "Yunus Musah"
    ],
    "Juventus": [
      "Wojciech Szczęsny", "Mattia Perin", "Danilo", "Gleison Bremer",
      "Federico Gatti", "Alex Sandro", "Weston McKennie", "Manuel Locatelli",
      "Adrien Rabiot", "Federico Chiesa", "Filip Kostić", "Dušan Vlahović",
      "Kenan Yıldız", "Nicolò Fagioli", "Timothy Weah"
    ],
    "Napoli": [
      "Alex Meret", "Giovanni Di Lorenzo", "Amir Rrahmani", "Kim Min-jae",
      "Mario Rui", "Stanislav Lobotka", "Frank Zambo Anguissa", "Piotr Zieliński",
      "Khvicha Kvaratskhelia", "Victor Osimhen", "Giovanni Simeone",
      "Elif Elmas", "Matteo Politano", "Hirving Lozano"
    ],
    "Atalanta": [
      "Marco Carnesecchi", "Rafael Tolói", "Berat Djimsiti", "Giorgio Scalvini",
      "Hans Hateboer", "Davide Zappacosta", "Marten de Roon", "Teun Koopmeiners",
      "Mario Pašalić", "Ademola Lookman", "Gianluca Scamacca", "Charles De Ketelaere",
      "Josip Iličić", "El Bilal Touré"
    ],
    "Bologna": [
      "Łukasz Skorupski", "Jhon Lucumí", "Sam Beukema", "Stefan Posch",
      "Luca Pellegrini", "Remo Freuler", "Lewis Ferguson", "Nicolás Domínguez",
      "Dan Ndoye", "Joshua Zirkzee", "Riccardo Orsolini", "Alexis Saelemaekers"
    ],
    "Roma": [
      "Rui Patrício", "Rick Karsdorp", "Chris Smalling", "Gianluca Mancini",
      "Leonardo Spinazzola", "Bryan Cristante", "Leandro Paredes", "Lorenzo Pellegrini",
      "Paulo Dybala", "Romelu Lukaku", "Tammy Abraham", "Stephan El Shaarawy"
    ],
    "Lazio": [
      "Ivan Provedel", "Elseid Hysaj", "Alessio Romagnoli", "Patric", "Marusic",
      "Cataldi", "Mattia Zaccagni", "Luis Alberto", "Sergej Milinković-Savić",
      "Pedro", "Ciro Immobile", "Felipe Anderson", "Taty Castellanos"
    ],
    "Fiorentina": [
      "Pietro Terracciano", "Dodô", "Lucas Martínez Quarta", "Nikola Milenković",
      "Cristiano Biraghi", "Sofyan Amrabat", "Giacomo Bonaventura", "Roland Sallai",
      "Jonathan Ikoné", "Nicolas González", "Arthur Cabral", "Luca Jović"
    ]
  },

  "Ligue 1": {
    "Paris Saint-Germain": [
      "Gianluigi Donnarumma", "Keylor Navas", "Achraf Hakimi", "Marquinhos",
      "Presnel Kimpembe", "Lucas Hernández", "Nuno Mendes", "Marco Verratti",
      "Vitinha", "Warren Zaïre-Emery", "Fabian Ruiz", "Ousmane Dembélé",
      "Kylian Mbappé", "Gonçalo Ramos", "Lee Kang-in", "Bradley Barcola",
      "Randal Kolo Muani"
    ],
    "Marseille": [
      "Pau López", "Jonathan Clauss", "Samuel Gigot", "Leonardo Balerdi",
      "Nuno Tavares", "Jordan Veretout", "Valentin Rongier", "Amine Harit",
      "Mattéo Guendouzi", "Alexis Sánchez", "Vitinha", "Pierre-Emerick Aubameyang",
      "Iliman Ndiaye", "Ruslan Malinovskyi"
    ],
    "Monaco": [
      "Radosław Majecki", "Vanderson", "Axel Disasi", "Mohamed Camara",
      "Youssouf Fofana", "Wissam Ben Yedder", "Takumi Minamino", "Eliesse Ben Seghir",
      "Caio Henrique", "Folarin Balogun", "Aleksandr Golovin"
    ],
    "Lyon": [
      "Anthony Lopes", "Malo Gusto", "Jake O'Brien", "Nicolas Tagliafico",
      "Corentin Tolisso", "Johann Lepenant", "Rayan Cherki", "Ernest Nuamah",
      "Alexandre Lacazette", "Nicolas Orban", "Saël Kumbedi"
    ],
    "Lens": [
      "Brice Samba", "Jonathan Gradit", "Kevin Danso", "Przemysław Frankowski",
      "Salis Abdul Samed", "Angelo Fulgini", "Florian Sotoca", "Wesley Saïd",
      "Loïs Openda", "Adama Diaw", "Neil El Aynaoui"
    ],
    "Lille": [
      "Lucas Chevalier", "Tiago Djaló", "Alexsandro", "Reinildo",
      "Ismaily", "Benjamin André", "Angel Gomes", "Jonathan David",
      "Edon Zhegrova", "Mohamed Camara", "Adam Ounas"
    ],
    "Rennes": [
      "Steve Mandanda", "Hamari Traoré", "Arthur Theate", "Warrick Saïd",
      "Adrien Truffert", "Flavien Tait", "Benjamin Bourigeaud", "Martin Terrier",
      "Amine Gouiri", "Arnaud Kalimuendo", "Lovro Majer"
    ],
    "Nice": [
      "Marcin Bułka", "Youcef Atal", "Jean-Clair Todibo", "Dante",
      "Jordan Lotomba", "Hichem Boudaoui", "Khéphren Thuram", "Ross Barkley",
      "Gaëtan Laborde", "Terem Moffi", "Nicolas Pépé", "Evann Guessand"
    ]
  }
};

// Helper to get all players as a flat array
export const ALL_PLAYERS = Object.values(PLAYER_DATABASE)
  .flatMap(teams => Object.values(teams))
  .flat()
  .filter((v, i, a) => a.indexOf(v) === i) // dedupe
  .sort();

// Helper to get all leagues
export const LEAGUES = Object.keys(PLAYER_DATABASE);

// Helper to get teams for a league
export const getTeams = (league) => Object.keys(PLAYER_DATABASE[league] || {});

// Helper to get players for a team
export const getPlayers = (league, team) => PLAYER_DATABASE[league]?.[team] || [];
