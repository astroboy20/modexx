import type { Monument } from './monuments'

export const ekitiLogoMonument: Monument = {
  id: 'ekiti-logo',
  slug: 'ekiti-logo',
  name: 'The Ekiti State Logo Challenge',
  subject: 'Ekiti State Coat of Arms',
  office: 'State Symbol · Ekiti State, Nigeria',
  scope: 'Identity · Established 1996',
  accent: 'green',
  image: '/ekiti-logo.jfif',
  portraitFit: 'contain',
  intro:
    'The Ekiti State logo is not just a seal — it is a story told in symbols. Five elements, each carrying the identity, history, and values of the Fountain of Knowledge. Explore every symbol and discover what makes Ekiti truly unique.',
  hotspots: [
    {
      id: 'ekiti-h1',
      label: 'The New Dawn',
      metaphor: 'Rising Sun',
      chapter: 'Chapter 01',
      x: 50,
      y: 8,
      displayOrder: 1,
    },
    {
      id: 'ekiti-h2',
      label: 'The Rolling Hills',
      metaphor: 'Hills / Landscape',
      chapter: 'Chapter 02',
      x: 20,
      y: 42,
      displayOrder: 2,
    },
    {
      id: 'ekiti-h3',
      label: 'The Vegetation',
      metaphor: 'Green Trees',
      chapter: 'Chapter 03',
      x: 80,
      y: 42,
      displayOrder: 3,
    },
    {
      id: 'ekiti-h4',
      label: 'The Water',
      metaphor: 'Ikogosi Spring',
      chapter: 'Chapter 04',
      x: 50,
      y: 62,
      displayOrder: 4,
    },
    {
      id: 'ekiti-h5',
      label: 'The Book',
      metaphor: 'Open Book',
      chapter: 'Chapter 05',
      x: 50,
      y: 85,
      displayOrder: 5,
    },
  ],
  stories: [
    {
      id: 'ekiti-s1',
      hotspotId: 'ekiti-h1',
      title: 'The New Dawn',
      headline: 'Hope, optimism, and the emerging land of opportunities',
      body: "At the top of the Ekiti State logo sits the symbol of The New Dawn — a rising sun breaking over the horizon. It represents Ekiti's place as an emerging land of opportunity, a state on the rise.\n\nBut the symbolism goes deeper than aspiration. The New Dawn reflects the character of the Ekiti people themselves — their hope and optimism in the face of challenges. Time and again, Ekiti has shown the ability to rise above adversity, maintaining its path of peace and progress.\n\nThe sun rising is a daily reminder that no matter what the previous day brought, a new beginning is always available. For a state that prides itself on knowledge, resilience, and community, The New Dawn is not just a symbol — it is a philosophy.",
      dateLabel: 'Symbol of identity',
      sources: [
        { title: 'Ekiti State Government — State Symbols', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
      ],
    },
    {
      id: 'ekiti-s2',
      hotspotId: 'ekiti-h2',
      title: 'The Rolling Hills',
      headline: 'The land that gave Ekiti its name',
      body: "The Rolling Hills in the Ekiti State logo are more than a scenic backdrop — they are the very origin of the state's name. 'Ekiti' derives from 'Ile Olokiti', which translates to 'the land full of hillocks' or 'the hilly land.'\n\nEkiti occupies the southwestern highland zone of Nigeria, characterised by its granite inselbergs, undulating terrain, and rocky outcrops that define its distinctive landscape. These hills form the backdrop of the beautiful scenery that has shaped Ekiti's culture, its sense of place, and its agricultural practices.\n\nThe rolling topography is not incidental — it is foundational. It shaped the settlement patterns, the farming methods, and the identity of the people. When you see the hills in the logo, you are seeing the reason Ekiti exists as a distinct cultural and geographic entity.",
      dateLabel: 'Symbol of identity',
      sources: [
        { title: 'Ekiti State — Wikipedia', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ekiti_State' },
      ],
    },
    {
      id: 'ekiti-s3',
      hotspotId: 'ekiti-h3',
      title: 'The Vegetation',
      headline: 'Fruitfulness, natural resources, and the land of agriculture',
      body: "The lush green vegetation depicted in the Ekiti State logo speaks to the fruitfulness of the land. Ekiti is blessed with an abundance and wide variety of natural resources — fertile soil, forest cover, and a climate that supports diverse agricultural production.\n\nAgriculture is not just an economic activity in Ekiti — it is the mainstay of livelihood. Cocoa, yam, cassava, and timber have historically been central to the state's economy. The vegetation in the logo is a symbolic declaration that Ekiti is a land that provides.\n\nBeyond farming, the vegetation symbol connects to Ekiti's ecological identity. The state's forests and greenery are part of what makes Ile Olokiti beautiful. The green in the logo is both a statement of natural wealth and a commitment to the land that sustains the people.",
      dateLabel: 'Symbol of identity',
      sources: [
        { title: 'Ekiti State — Wikipedia', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ekiti_State' },
      ],
    },
    {
      id: 'ekiti-s4',
      hotspotId: 'ekiti-h4',
      title: 'The Water',
      headline: 'The Ikogosi Spring — a wonder to the world, a pride to Ekiti',
      body: "Of all the symbols in the Ekiti State logo, The Water carries perhaps the most extraordinary story. It represents the springs of Ekiti State — most specifically, the Ikogosi Warm Spring, located in Ikogosi-Ekiti.\n\nThe Ikogosi Warm Spring is the only place in the world where hot and cold water springs naturally occur side by side, meeting at a confluence point. Warm water flows from one source; cold water flows from another. They meet — but they do not mix. Scientists and visitors from around the world have studied and marvelled at this natural phenomenon.\n\nIkogosi is not just a tourist attraction — it is a point of pride for the Ekiti people. It is their statement to the world: our land holds wonders. The water flowing through the logo carries this remarkable story every time the emblem is seen.",
      dateLabel: 'Symbol of identity',
      sources: [
        { title: 'Ikogosi Warm Spring', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ikogosi_Warm_Spring' },
        { title: 'Ekiti State — Wikipedia', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ekiti_State' },
      ],
    },
    {
      id: 'ekiti-s5',
      hotspotId: 'ekiti-h5',
      title: 'The Book',
      headline: 'The Fountain of Knowledge — enlightenment as identity',
      body: "The open book at the base of the Ekiti State logo is perhaps its most powerful symbol. It represents the enlightenment of the Ekiti people — their deep love of knowledge and their culture of celebrating wisdom.\n\nEkiti State is known throughout Nigeria and beyond as the 'Fountain of Knowledge.' This is not just a slogan — it reflects a remarkable historical reality. Ekiti has produced a disproportionate number of professors, scholars, teachers, doctors, lawyers, and intellectuals relative to its population size. Education has long been a core value woven into Ekiti culture.\n\nThe book in the logo is a declaration of identity: we are a people who value the mind. It is also a challenge — a commitment to future generations that Ekiti will remain a place where knowledge is honoured, learning is celebrated, and wisdom is passed on.",
      dateLabel: 'Symbol of identity',
      sources: [
        { title: 'Ekiti State — Wikipedia', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ekiti_State' },
        { title: 'Ekiti State Education Achievements', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
      ],
    },
  ],
  questions: [
    // The New Dawn
    {
      id: 'elq1',
      questionText: 'What does The New Dawn symbol in the Ekiti State logo represent?',
      options: [
        "The state's oil and gas resources",
        "Ekiti's place as an emerging land of opportunities, and the hope and optimism of its people",
        'The founding of Ekiti State in 1996',
        'The agricultural harvest season',
      ],
      correctIndex: 1,
      explanation:
        "The New Dawn symbolises Ekiti's place as an emerging land of opportunities and the hope and optimism of its people — their ability to rise above challenges and remain on the path of peace and progress.",
      difficulty: 'easy',
    },
    {
      id: 'elq2',
      questionText: 'Which qualities of the Ekiti people does The New Dawn particularly reflect?',
      options: [
        'Wealth and industrial strength',
        'Military prowess and discipline',
        'Hope and optimism',
        'Political power and influence',
      ],
      correctIndex: 2,
      explanation:
        'The New Dawn symbolises the hope and optimism associated with the Ekiti people — the qualities that help them rise above challenges.',
      difficulty: 'easy',
    },
    // Rolling Hills
    {
      id: 'elq3',
      questionText: "What is the meaning of the name 'Ekiti' as reflected in the Rolling Hills symbol?",
      options: [
        "'Land of knowledge and wisdom'",
        "'The beautiful state'",
        "'Ile Olokiti' — the land full of hillocks or the hilly land",
        "'Land of springs and water'",
      ],
      correctIndex: 2,
      explanation:
        "The Rolling Hills represent the topography of Ekiti and are the origin of its name. 'Ekiti' derives from 'Ile Olokiti', meaning 'the land full of hillocks' or 'the hilly land'.",
      difficulty: 'easy',
    },
    {
      id: 'elq4',
      questionText: 'What do the Rolling Hills in the logo form for Ekiti State?',
      options: [
        'The barrier between Ekiti and neighbouring states',
        'The backdrop of the beautiful scenery and origin of the state name',
        'The symbol of Ekiti military history',
        'The boundary markers of the 16 local government areas',
      ],
      correctIndex: 1,
      explanation:
        "The Rolling Hills depict the topography of Ekiti's land, forming the backdrop of the beautiful scenery, and are the geographical origin of the state's name.",
      difficulty: 'medium',
    },
    // Vegetation
    {
      id: 'elq5',
      questionText: 'What does The Vegetation symbol in the Ekiti logo represent?',
      options: [
        'The tourism industry of the state',
        "The fruitfulness of the land — its natural resources and agricultural livelihood",
        "Ekiti's rainforest conservation programme",
        'The state tree, Obeche',
      ],
      correctIndex: 1,
      explanation:
        'The Vegetation depicts the fruitfulness of the land, symbolising its abundance of natural resources and representing the mainstay of Ekiti livelihood — Agriculture.',
      difficulty: 'easy',
    },
    {
      id: 'elq6',
      questionText: 'According to the logo symbolism, what is described as the mainstay of livelihood in Ekiti?',
      options: ['Mining', 'Oil and gas', 'Agriculture', 'Commerce and trade'],
      correctIndex: 2,
      explanation:
        "The Vegetation symbol in the Ekiti logo represents Agriculture as the mainstay of the people's livelihood.",
      difficulty: 'easy',
    },
    // The Water
    {
      id: 'elq7',
      questionText: 'What specific natural wonder does The Water symbol in the Ekiti logo represent?',
      options: [
        'The River Niger at Lokoja',
        'The Ikogosi Spring, where hot and cold water springs naturally occur side by side',
        'The Osun River at Osogbo',
        'The Ose River waterfalls',
      ],
      correctIndex: 1,
      explanation:
        'The Water represents the Ikogosi Spring — the only place in the whole world where hot and cold water springs naturally occur side by side.',
      difficulty: 'easy',
    },
    {
      id: 'elq8',
      questionText: 'What makes the Ikogosi Spring unique in the entire world?',
      options: [
        'It is the largest freshwater spring in Africa',
        'Hot and cold water springs naturally occur side by side',
        'It has healing properties recognised by the WHO',
        'It never dries up regardless of drought',
      ],
      correctIndex: 1,
      explanation:
        'The Ikogosi Warm Spring is the only place in the world where hot and cold water springs naturally occur side by side, meeting at a confluence but not mixing.',
      difficulty: 'medium',
    },
    {
      id: 'elq9',
      questionText: 'In which town is the famous Ekiti warm spring located?',
      options: ['Ado-Ekiti', 'Efon-Alaaye', 'Ikogosi', 'Aramoko'],
      correctIndex: 2,
      explanation:
        'The Ikogosi Warm Spring is located in Ikogosi-Ekiti — interestingly also the birthplace of Governor Biodun Oyebanji.',
      difficulty: 'medium',
    },
    // The Book
    {
      id: 'elq10',
      questionText: 'What does The Book symbol represent in the Ekiti State logo?',
      options: [
        'The state library system',
        'The constitution of Ekiti State',
        'The enlightenment of the Ekiti people and their love of knowledge and wisdom',
        'The legal traditions of Ekiti',
      ],
      correctIndex: 2,
      explanation:
        "The Book depicts the enlightenment of the Ekiti people. The Ekiti people love knowledge and celebrate wisdom — it's what makes them the Fountain of Knowledge.",
      difficulty: 'easy',
    },
    {
      id: 'elq11',
      questionText: "What is Ekiti State's famous identity tagline, reflected by The Book symbol?",
      options: [
        'Centre of Excellence',
        'Land of Promise',
        'Gateway State',
        'Fountain of Knowledge',
      ],
      correctIndex: 3,
      explanation:
        "Ekiti is known as the 'Fountain of Knowledge' — a tagline directly connected to the Book symbol and the Ekiti people's deep cultural value of education and wisdom.",
      difficulty: 'easy',
    },
    {
      id: 'elq12',
      questionText: 'How many symbols make up the Ekiti State logo?',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
      explanation:
        'The Ekiti State logo comprises five symbols: The New Dawn, The Rolling Hills, The Vegetation, The Water, and The Book.',
      difficulty: 'easy',
    },
    {
      id: 'elq13',
      questionText: 'Which symbol in the Ekiti logo is positioned at the very top?',
      options: ['The Book', 'The Vegetation', 'The New Dawn', 'The Rolling Hills'],
      correctIndex: 2,
      explanation:
        'The New Dawn — represented by the rising sun — sits at the top of the Ekiti State logo, symbolising hope, optimism, and emerging opportunity.',
      difficulty: 'medium',
    },
    {
      id: 'elq14',
      questionText: 'What dual quality does the Ikogosi Spring represent beyond its natural wonder?',
      options: [
        'Wealth and poverty in coexistence',
        'A wonder to the world and a pride to Ekiti',
        'The balance between tradition and modernity',
        'The unity of all 16 local government areas',
      ],
      correctIndex: 1,
      explanation:
        "The Ikogosi Spring is described as 'a wonder to the world, a pride to us' — it carries both international significance and deep local pride for the Ekiti people.",
      difficulty: 'medium',
    },
    {
      id: 'elq15',
      questionText: 'Which logo symbol connects most directly to Ekiti being a land that "rises above challenges"?',
      options: ['The Rolling Hills', 'The Book', 'The Vegetation', 'The New Dawn'],
      correctIndex: 3,
      explanation:
        "The New Dawn specifically symbolises the Ekiti people's ability to rise above challenges, maintaining their path of peace and progress — it is the symbol of resilience and hope.",
      difficulty: 'hard',
    },
  ],
}
