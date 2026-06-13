const { ObjectId } = require('mongodb');

const authorIds = Array.from({ length: 15 }, () => new ObjectId());

const authors = [
  { _id: authorIds[0],  name: 'George Orwell',        born: 1903, died: 1950, nationality: 'British',    bio: 'Known for dystopian fiction and sharp political commentary.' },
  { _id: authorIds[1],  name: 'Gabriel García Márquez', born: 1927, died: 2014, nationality: 'Colombian',  bio: 'Nobel laureate, pioneer of magical realism.' },
  { _id: authorIds[2],  name: 'Toni Morrison',         born: 1931, died: 2019, nationality: 'American',   bio: 'Nobel laureate known for powerful explorations of the African-American experience.' },
  { _id: authorIds[3],  name: 'Haruki Murakami',       born: 1949, died: null,  nationality: 'Japanese',   bio: 'Known for surreal, introspective novels blending Eastern and Western influences.' },
  { _id: authorIds[4],  name: 'Chimamanda Ngozi Adichie', born: 1977, died: null, nationality: 'Nigerian', bio: 'Award-winning author and essayist exploring identity, gender, and race.' },
  { _id: authorIds[5],  name: 'Fyodor Dostoevsky',    born: 1821, died: 1881, nationality: 'Russian',    bio: 'Existentialist pioneer known for psychological depth.' },
  { _id: authorIds[6],  name: 'Ursula K. Le Guin',    born: 1929, died: 2018, nationality: 'American',   bio: 'Science fiction and fantasy master known for rich world-building.' },
  { _id: authorIds[7],  name: 'Kazuo Ishiguro',        born: 1954, died: null,  nationality: 'British',    bio: 'Nobel laureate known for quiet, reflective narratives.' },
  { _id: authorIds[8],  name: 'Margaret Atwood',       born: 1939, died: null,  nationality: 'Canadian',   bio: 'Speculative fiction author and social commentator.' },
  { _id: authorIds[9],  name: 'Leo Tolstoy',           born: 1828, died: 1910, nationality: 'Russian',    bio: 'Master of realistic fiction and moral philosophy.' },
  { _id: authorIds[10], name: 'Virginia Woolf',        born: 1882, died: 1941, nationality: 'British',    bio: 'Modernist pioneer and stream-of-consciousness innovator.' },
  { _id: authorIds[11], name: 'Franz Kafka',           born: 1883, died: 1924, nationality: 'Czech',      bio: 'Known for absurdist, existential nightmares.' },
  { _id: authorIds[12], name: 'Isabel Allende',        born: 1942, died: null,  nationality: 'Chilean',    bio: 'Master storyteller of magical realism and family sagas.' },
  { _id: authorIds[13], name: 'Cormac McCarthy',       born: 1933, died: 2023, nationality: 'American',   bio: 'Dark, lyrical prose exploring violence and the American West.' },
  { _id: authorIds[14], name: 'Zadie Smith',           born: 1975, died: null,  nationality: 'British',    bio: 'Contemporary novelist known for multicultural London narratives.' },
];

module.exports = { authors, authorIds };
