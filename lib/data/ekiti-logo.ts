import type { Monument } from './monuments'

export const ekitiLogoMonument: Monument = {
  id: 'ekiti-logo',
  slug: 'ekiti-logo',
  name: 'The Ekiti Emblem Challenge',
  subject: 'Ekiti State Official Emblem',
  office: 'State Symbol · Ekiti State, Nigeria',
  scope: 'Identity · Launched 6 March 2011 · Current law: 2019',
  accent: 'green',
  image: '/ekiti-logo.jfif',
  portraitFit: 'contain',
  intro:
    'The Ekiti State emblem is a circular landscape-based visual identity built around six meaning-bearing elements. Each symbol carries the history, values, and aspirations of the Land of Honour. Explore every element and discover what makes Ekiti truly unique.',

  hotspots: [
    { id: 'ekiti-h1', label: 'The Woven Cord',   metaphor: 'Outer Border',    chapter: 'Chapter 01', x: 50, y: 6,  displayOrder: 1 },
    { id: 'ekiti-h2', label: 'The New Dawn',      metaphor: 'Rising Sun',      chapter: 'Chapter 02', x: 50, y: 20, displayOrder: 2 },
    { id: 'ekiti-h3', label: 'The Rolling Hills', metaphor: 'Hills/Landscape', chapter: 'Chapter 03', x: 20, y: 42, displayOrder: 3 },
    { id: 'ekiti-h4', label: 'The Vegetation',    metaphor: 'Green Trees',     chapter: 'Chapter 04', x: 80, y: 42, displayOrder: 4 },
    { id: 'ekiti-h5', label: 'The Water',         metaphor: 'Ikogosi Spring',  chapter: 'Chapter 05', x: 50, y: 60, displayOrder: 5 },
    { id: 'ekiti-h6', label: 'The Open Book',     metaphor: 'Book at Base',    chapter: 'Chapter 06', x: 50, y: 85, displayOrder: 6 },
  ],

  stories: [
    {
      id: 'ekiti-s1',
      hotspotId: 'ekiti-h1',
      title: 'The Woven Cord',
      headline: 'Shared identity and the cultural bond across Ekiti communities',
      body: 'The outer border of the Ekiti State emblem is a woven, rope-like cord — one of the six official meaning-bearing elements identified by the State Government. It is not an incidental decoration. The state\'s published explanation describes it as depicting the culturally homogeneous nature of the Ekiti people.\n\nThe woven cord points specifically to the "-Ekiti" suffix used in the names of towns and villages across the state — Ado-Ekiti, Ikogosi-Ekiti, Efon-Alaaye-Ekiti, and many more. This shared suffix, embedded in place names, is the state\'s visual metaphor for community connection and cultural cohesion.\n\nThe emblem\'s legal framework — the Ekiti State Change of Government Official Logo Law, 2019 — recognises the cord alongside the other five elements as constitutive of the official identity. In any reproduction, the cord should remain intact and in its correct relationship to the circular landscape it surrounds.',
      dateLabel: 'Symbol launched 6 March 2011',
      sources: [
        { title: '10th Anniversary of the Creation of Ekiti State — Official Logo Explanation', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
        { title: 'Ekiti State Change of Government Official Logo Law, 2019 (No. 4 of 2019)', publisher: 'Ekiti State House of Assembly', url: 'https://ekitistate.gov.ng/' },
      ],
      editorialNote: 'The woven cord\'s meaning is taken directly from the State Government\'s published explanation. Do not claim it represents political unity in a partisan sense.',
    },

    {
      id: 'ekiti-s2',
      hotspotId: 'ekiti-h2',
      title: 'The New Dawn',
      headline: 'Hope, optimism, and an emerging land of opportunity',
      body: 'At the top of the emblem\'s central landscape sits a yellow-gold rising sun — The New Dawn. The State Government\'s published explanation describes it as symbolising Ekiti as an emerging land of opportunity, associated with the hope and optimism of the Ekiti people: their ability to rise above challenges toward peace and progress.\n\nThe sun is a forward-looking symbol. It does not make a factual claim that all development goals have been achieved; it represents aspiration and renewal. For a state whose official motto is "Land of Honour," The New Dawn is an expression of the character its people aspire to embody.\n\nThe Branding and Communications Strategy Committee that created the logo in 2011 was led by then Deputy Governor Mrs Funmi Olayinka, with Akin Rotimi as creative lead and Dr Dele Olukayode and Dr Bakare Lawal as collaborators. The State Government says the logo was publicly launched on 6 March 2011.',
      dateLabel: 'Symbol launched 6 March 2011',
      sources: [
        { title: '10th Anniversary of the Creation of Ekiti State — Official Logo Explanation', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
      ],
      editorialNote: 'The New Dawn is an aspirational symbol, not a factual claim about development outcomes. Present it as stated symbolism.',
    },

    {
      id: 'ekiti-s3',
      hotspotId: 'ekiti-h3',
      title: 'The Rolling Hills',
      headline: 'The land that gave Ekiti its name — Ile Olokiti',
      body: 'The rolling hills depicted in the emblem are both landscape and etymology. The State Government\'s explanation links them directly to the name "Ile Olokiti" — the hilly land — the origin of the name Ekiti itself.\n\nEkiti occupies the southwestern highland zone of Nigeria, characterised by granite inselbergs, undulating terrain, and rocky outcrops. These are not incidental features; they shaped the settlement patterns, farming methods, and cultural identity of the people. When you see the hills in the emblem, you are seeing the reason Ekiti exists as a distinct geographic and cultural entity.\n\nThe statutory specimen places the hills as the central feature of the circular landscape, with the sun rising behind them and vegetation and water in the foreground. The hills are brown/earth in tone in official reproductions — connecting the central scene to landform and terrain.',
      dateLabel: 'Symbol launched 6 March 2011',
      sources: [
        { title: '10th Anniversary of the Creation of Ekiti State — Official Logo Explanation', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
        { title: 'Ekiti State Change of Government Official Logo Law, 2019 (No. 4 of 2019)', publisher: 'Ekiti State House of Assembly', url: 'https://ekitistate.gov.ng/' },
      ],
      editorialNote: 'Keep the official "Ile Olokiti" wording when quoting the state explanation. The name meaning is state-published; it is not independently contested in the sources reviewed.',
    },

    {
      id: 'ekiti-s4',
      hotspotId: 'ekiti-h4',
      title: 'The Vegetation',
      headline: 'Fertile land, natural resources, and agriculture as livelihood',
      body: 'The lush green vegetation in the emblem\'s landscape represents the fruitfulness of Ekiti\'s land. The State Government\'s published explanation describes it as depicting the abundance of natural resources and agriculture as the mainstay of livelihood.\n\nEkiti\'s ecology supports cocoa, cassava, yam, timber, and a range of food crops. Agriculture is not simply an economic sector in the state — it is woven into the daily lives of a predominantly rural population across 16 local government areas.\n\nIn the official emblem, vegetation appears in the foreground of the landscape in green tones — a prominent identity colour alongside the gold of the cord and sun. The state emblem\'s visual palette connects green to nature, fertility, and the land that sustains the people. Avoid implying that every household depends on agriculture; the vegetation symbol represents natural abundance as a collective identity, not a universal household circumstance.',
      dateLabel: 'Symbol launched 6 March 2011',
      sources: [
        { title: '10th Anniversary of the Creation of Ekiti State — Official Logo Explanation', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
      ],
      editorialNote: 'The vegetation symbol represents collective natural identity. Avoid making specific agricultural output claims on its basis.',
    },

    {
      id: 'ekiti-s5',
      hotspotId: 'ekiti-h5',
      title: 'The Water',
      headline: 'Ikogosi Spring — where hot and cold meet without mixing',
      body: 'Of all six elements in the Ekiti emblem, The Water carries perhaps the most extraordinary story. The State Government\'s explanation specifically names Ikogosi Spring — the place where hot and cold springs naturally occur side by side. The warm water and cold water meet at a confluence point, but do not mix.\n\nThe Ikogosi Warm Spring is in Ikogosi-Ekiti — also the birthplace of Governor Biodun Oyebanji. It is the only place of its kind in the world and has drawn scientists and visitors from across the globe. For the Ekiti people, it is not merely a tourist attraction: it is a point of pride, a natural wonder that belongs to Ekiti and to Ekiti alone.\n\nIn the emblem, water appears as a blue watercourse in the foreground of the circular landscape, distinct from the green vegetation. The Ekiti State emblem research notes that the blue should remain visually distinct from green vegetation in any reproduction to preserve the integrity of the two separate symbols.',
      dateLabel: 'Symbol launched 6 March 2011',
      sources: [
        { title: '10th Anniversary of the Creation of Ekiti State — Official Logo Explanation', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
        { title: 'Ekiti State Change of Government Official Logo Law, 2019 (No. 4 of 2019)', publisher: 'Ekiti State House of Assembly', url: 'https://ekitistate.gov.ng/' },
      ],
      editorialNote: 'The Ikogosi reference is explicit in the state\'s published explanation. Do not generalise it to claim that every water body in Ekiti has the same properties.',
    },

    {
      id: 'ekiti-s6',
      hotspotId: 'ekiti-h6',
      title: 'The Open Book',
      headline: 'The Fountain of Knowledge — enlightenment as identity',
      body: 'At the base of the Ekiti emblem sits an open book — the sixth and final meaning-bearing element. The State Government\'s published explanation describes it as depicting the enlightenment of the Ekiti people and the value they place on knowledge and wisdom.\n\nEkiti is known throughout Nigeria as the "Fountain of Knowledge." This is not just a slogan; it reflects a historical reality in which Ekiti has produced a disproportionate number of professors, scholars, teachers, doctors, and lawyers relative to its population. Education has long been a core value woven into Ekiti culture across generations.\n\nThe open book and the red ribbon carrying "LAND OF HONOUR" are both elements that should remain intact in any reproduction — they are not separable from the circular landscape above. The book is a declaration: Ekiti is a people who value the mind. The 2019 Official Logo Law makes clear that any entity using the emblem on a document purporting to be an official state document requires formal written authorisation from the Governor.',
      dateLabel: 'Symbol launched 6 March 2011',
      sources: [
        { title: '10th Anniversary of the Creation of Ekiti State — Official Logo Explanation', publisher: 'Ekiti State Government', url: 'https://ekitistate.gov.ng/' },
        { title: 'Ekiti State Change of Government Official Logo Law, 2019 (No. 4 of 2019)', publisher: 'Ekiti State House of Assembly', url: 'https://ekitistate.gov.ng/' },
      ],
      editorialNote: 'The book symbol is aspirational. Do not convert it into an unsupported statistical ranking of educational attainment or a claim about individual residents.',
    },
  ],

  questions: [
    // Easy — The Woven Cord
    {
      id: 'elq1',
      questionText: 'What does the Woven Cord in the Ekiti State emblem represent, according to the State Government\'s published explanation?',
      options: [
        'The strength of Ekiti\'s military history',
        'The culturally homogeneous nature of the Ekiti people',
        'The borders shared with neighbouring states',
        'The ropes used in traditional Ekiti farming',
      ],
      correctIndex: 1,
      explanation: 'The State Government\'s published explanation describes the Woven Cord as depicting the culturally homogeneous nature of the Ekiti people, pointing to the "-Ekiti" suffix shared in the names of towns and villages.',
      difficulty: 'easy',
    },
    {
      id: 'elq2',
      questionText: 'The Woven Cord\'s symbolism points to which shared feature of Ekiti town and village names?',
      options: [
        'All towns begin with "Ado"',
        'All towns contain the word "Ile"',
        'The "-Ekiti" suffix used across towns and villages',
        'All towns are named after rivers',
      ],
      correctIndex: 2,
      explanation: 'The state\'s explanation specifically points to the "-Ekiti" suffix used in the names of towns and villages as the basis for the Woven Cord\'s symbolism of shared cultural identity.',
      difficulty: 'easy',
    },
    // Easy — The New Dawn
    {
      id: 'elq3',
      questionText: 'What does The New Dawn symbol in the Ekiti emblem represent?',
      options: [
        'The oil and gas resources of the state',
        'The founding of Ekiti State in 1996',
        'An emerging land of opportunity, and the hope and optimism of the Ekiti people',
        'The agricultural harvest season',
      ],
      correctIndex: 2,
      explanation: 'The State Government\'s explanation describes The New Dawn as symbolising Ekiti as an emerging land of opportunity and the hope and optimism associated with rising above challenges toward peace and progress.',
      difficulty: 'easy',
    },
    {
      id: 'elq4',
      questionText: 'On what date did the Ekiti State Government publicly launch the official emblem?',
      options: ['1 October 1996', '6 March 2011', '1 March 2019', '16 October 2022'],
      correctIndex: 1,
      explanation: 'The State Government says the logo was launched on 6 March 2011, with a Branding and Communications Strategy Committee led by then Deputy Governor Mrs Funmi Olayinka.',
      difficulty: 'easy',
    },
    // Easy — Rolling Hills
    {
      id: 'elq5',
      questionText: 'What is the meaning of "Ile Olokiti" as described in the Ekiti emblem\'s Rolling Hills element?',
      options: [
        'The land of springs and water',
        'The land full of hillocks, or the hilly land',
        'The land of knowledge and wisdom',
        'The land of honour and peace',
      ],
      correctIndex: 1,
      explanation: 'The state\'s explanation links the Rolling Hills to "Ile Olokiti" — meaning the hilly land or the land full of hillocks — the origin of the name Ekiti itself.',
      difficulty: 'easy',
    },
    // Easy — Vegetation
    {
      id: 'elq6',
      questionText: 'According to the Ekiti emblem\'s symbolism, what does The Vegetation represent?',
      options: [
        'Ekiti\'s rainforest conservation programme',
        'The fruitfulness of the land — natural resources and agriculture as the mainstay of livelihood',
        'The state\'s reforestation targets',
        'The tourism industry',
      ],
      correctIndex: 1,
      explanation: 'The State Government\'s explanation describes Vegetation as depicting the fruitfulness of the land, natural resources, and agriculture as the mainstay of Ekiti livelihood.',
      difficulty: 'easy',
    },
    // Easy — The Water
    {
      id: 'elq7',
      questionText: 'Which specific site does The Water element in the Ekiti emblem represent?',
      options: [
        'The River Niger at Lokoja',
        'The Osun River at Osogbo',
        'Ikogosi Spring, where hot and cold springs naturally occur side by side',
        'The Ose River waterfalls',
      ],
      correctIndex: 2,
      explanation: 'The State Government\'s explanation specifically names Ikogosi Spring — the only place in the world where hot and cold water springs naturally occur side by side.',
      difficulty: 'easy',
    },
    // Easy — The Book
    {
      id: 'elq8',
      questionText: 'What does The Open Book at the base of the Ekiti emblem represent?',
      options: [
        'The state library system',
        'The constitution of Ekiti State',
        'The enlightenment of the Ekiti people and their love of knowledge and wisdom',
        'Ekiti\'s legal traditions',
      ],
      correctIndex: 2,
      explanation: 'The State Government\'s published explanation describes The Book as depicting the enlightenment of the Ekiti people and the value they place on knowledge and wisdom.',
      difficulty: 'easy',
    },
    // Medium
    {
      id: 'elq9',
      questionText: 'How many meaning-bearing elements does the Ekiti State emblem officially contain?',
      options: ['4', '5', '6', '7'],
      correctIndex: 2,
      explanation: 'The State Government\'s published explanation assigns six meanings: Woven Cord, New Dawn, Rolling Hills, Vegetation, Water, and Open Book.',
      difficulty: 'medium',
    },
    {
      id: 'elq10',
      questionText: 'What is Ekiti State\'s official motto, carried on the red ribbon in the emblem?',
      options: ['Fountain of Knowledge', 'Centre of Excellence', 'Land of Honour', 'Gateway to the Hills'],
      correctIndex: 2,
      explanation: 'The red ribbon on the emblem carries the English phrase "LAND OF HONOUR." The Yoruba expression commonly used alongside it is "Ilẹ̀ Ìyì, Ilẹ̀ Ẹye."',
      difficulty: 'medium',
    },
    {
      id: 'elq11',
      questionText: 'What is Ekiti State\'s well-known identity tagline, connected to The Book symbol?',
      options: ['Centre of Excellence', 'Land of Promise', 'Gateway State', 'Fountain of Knowledge'],
      correctIndex: 3,
      explanation: 'Ekiti is known as the "Fountain of Knowledge" — a tagline directly connected to the Book symbol and the deep cultural value the Ekiti people place on education and wisdom.',
      difficulty: 'medium',
    },
    {
      id: 'elq12',
      questionText: 'Which statute currently governs the official use and legal status of the Ekiti State emblem?',
      options: [
        'Ekiti State Emblem Act, 1996',
        'Ekiti State Official Logo Law, 2011',
        'Ekiti State Change of Government Official Logo Law, 2019 (No. 4 of 2019)',
        'Ekiti State Branding Act, 2014',
      ],
      correctIndex: 2,
      explanation: 'The current statutory reference is the Ekiti State Change of Government Official Logo Law, 2019 (No. 4 of 2019), which repealed the 2011 law and 2014 amendment and established a new set of official logo statuses.',
      difficulty: 'medium',
    },
    {
      id: 'elq13',
      questionText: 'Who led the Branding and Communications Strategy Committee that designed the Ekiti emblem in 2011?',
      options: [
        'Governor Kayode Fayemi',
        'Then Deputy Governor Mrs Funmi Olayinka',
        'Dr Dele Olukayode',
        'Akin Rotimi',
      ],
      correctIndex: 1,
      explanation: 'The State Government credits a Branding and Communications Strategy Committee led by then Deputy Governor Mrs Funmi Olayinka, with Akin Rotimi as creative lead and Dr Dele Olukayode and Dr Bakare Lawal as collaborators.',
      difficulty: 'medium',
    },
    {
      id: 'elq14',
      questionText: 'In which town is the Ikogosi Spring — the natural wonder represented by The Water symbol — located?',
      options: ['Ado-Ekiti', 'Efon-Alaaye', 'Ikogosi-Ekiti', 'Aramoko-Ekiti'],
      correctIndex: 2,
      explanation: 'The Ikogosi Warm Spring is located in Ikogosi-Ekiti — also the birthplace of Governor Biodun Oyebanji.',
      difficulty: 'medium',
    },
    // Hard
    {
      id: 'elq15',
      questionText: 'The 2019 Official Logo Law recognises how many distinct official identity versions of the Ekiti emblem?',
      options: ['Two', 'Three', 'Four', 'Six'],
      correctIndex: 2,
      explanation: 'The 2019 law names four statuses/offices: Ekiti State Nigeria (general state identity), Government of Ekiti State Nigeria, Deputy Governor of Ekiti State Nigeria, and the Seal of the Governor of Ekiti State Nigeria.',
      difficulty: 'hard',
    },
    {
      id: 'elq16',
      questionText: 'Under the 2019 Official Logo Law, what penalty is stated for unauthorised use of the emblem on a document purporting to be an official state document?',
      options: [
        'A fine of ₦100,000',
        'Imprisonment for two years or a fine of ₦200,000',
        'Imprisonment for five years or a fine of ₦500,000, or both',
        'Community service and a formal apology',
      ],
      correctIndex: 2,
      explanation: 'Section 7(2) of the Ekiti State Change of Government Official Logo Law, 2019 states that upon conviction, the penalty is imprisonment for five years or a fine of five hundred thousand naira, or both.',
      difficulty: 'hard',
    },
    {
      id: 'elq17',
      questionText: 'Which of the six emblem elements should NOT be described as a factual claim that all development goals have been achieved?',
      options: ['The Woven Cord', 'The Rolling Hills', 'The New Dawn', 'The Open Book'],
      correctIndex: 2,
      explanation: 'The New Dawn is explicitly a forward-looking aspirational symbol. The state\'s own explanation presents it as representing hope and optimism — not as confirmation that all development goals have been achieved.',
      difficulty: 'hard',
    },
    {
      id: 'elq18',
      questionText: 'What is the correct Yoruba expression used alongside "Land of Honour" in Ekiti State\'s identity?',
      options: [
        'Ile Ife, Ile Eye',
        'Ile Iyi, Ile Eye (Ilẹ̀ Ìyì, Ilẹ̀ Ẹye)',
        'Ile Olokiti, Ile Eko',
        'Ile Ogun, Ile Aye',
      ],
      correctIndex: 1,
      explanation: 'The Yoruba expression commonly used alongside "LAND OF HONOUR" is "Ilẹ̀ Ìyì, Ilẹ̀ Ẹye" (often written without diacritics as "Ile Iyi, Ile Eye"). The Ekiti State Government has described this as "Land of Honour."',
      difficulty: 'hard',
    },
    {
      id: 'elq19',
      questionText: 'Which version of the Ekiti emblem carries the highest risk of implying formal government authorisation, according to the 2019 law?',
      options: [
        'The general Ekiti State, Nigeria identity version',
        'The Government of Ekiti State, Nigeria version',
        'The Deputy Governor of Ekiti State version',
        'The Seal of the Governor of Ekiti State, Nigeria',
      ],
      correctIndex: 3,
      explanation: 'The Seal of the Governor carries the highest risk of implying formal authorisation. The 2019 law distinguishes it from the general state identity; it should not be substituted for a general emblem.',
      difficulty: 'hard',
    },
    {
      id: 'elq20',
      questionText: 'Which design element of the Ekiti emblem should remain intact and in correct relationship to the circular landscape in any reproduction, according to the research?',
      options: [
        'Only the rising sun',
        'The book, the ribbon, and the outer cord',
        'Only the hills and vegetation',
        'Only the water element',
      ],
      correctIndex: 1,
      explanation: 'The Ekiti State emblem research notes that the book, ribbon ("LAND OF HONOUR"), and outer woven cord should remain intact and in their correct relationship to the circular landscape in any reproduction.',
      difficulty: 'hard',
    },
  ],
}
