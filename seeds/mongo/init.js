// Initialisation MongoDB pour BookHub.
// MongoDB stocke les donnees flexibles: details enrichis, tags, metadonnees et avis.

const dbName = process.env.MONGO_INITDB_DATABASE || "bookhub";

db = db.getSiblingDB(dbName);

db.book_details.drop();
db.reviews.drop();

db.book_details.insertMany([
  {
    bookId: "book_001",
    title: "Dune",
    summary:
      "Roman de science-fiction centre sur Arrakis, une planete desertique au coeur d'enjeux politiques, religieux et ecologiques.",
    tags: ["science-fiction", "politique", "ecologie", "saga"],
    metadata: {
      language: "fr",
      pages: 688,
      publisher: "Robert Laffont",
      targetAudience: "adultes"
    }
  },
  {
    bookId: "book_002",
    title: "1984",
    summary:
      "Roman dystopique qui decrit une societe totalitaire fondee sur la surveillance, la propagande et le controle du langage.",
    tags: ["dystopie", "politique", "surveillance", "classique"],
    metadata: {
      language: "fr",
      pages: 376,
      publisher: "Gallimard",
      targetAudience: "lycee"
    }
  },
  {
    bookId: "book_003",
    title: "Le Petit Prince",
    summary:
      "Conte poetique dans lequel un jeune prince voyage de planete en planete et questionne les relations humaines.",
    tags: ["conte", "poesie", "voyage", "classique"],
    metadata: {
      language: "fr",
      pages: 96,
      publisher: "Gallimard",
      targetAudience: "tout public"
    }
  },
  {
    bookId: "book_004",
    title: "L'Etranger",
    summary:
      "Roman court et philosophique autour de Meursault, personnage confronte a l'absurde et au jugement social.",
    tags: ["roman", "philosophie", "absurde", "classique"],
    metadata: {
      language: "fr",
      pages: 184,
      publisher: "Gallimard",
      targetAudience: "lycee"
    }
  },
  {
    bookId: "book_005",
    title: "Harry Potter a l'ecole des sorciers",
    summary:
      "Premier tome de la saga fantasy dans lequel Harry Potter decouvre le monde des sorciers et l'ecole de Poudlard.",
    tags: ["fantasy", "jeunesse", "magie", "saga"],
    metadata: {
      language: "fr",
      pages: 320,
      publisher: "Gallimard Jeunesse",
      targetAudience: "jeunesse"
    }
  },
  {
    bookId: "book_006",
    title: "Fondation",
    summary:
      "Cycle de science-fiction autour de la psychohistoire et de la preservation du savoir face a l'effondrement d'un empire galactique.",
    tags: ["science-fiction", "empire", "science", "saga"],
    metadata: {
      language: "fr",
      pages: 416,
      publisher: "Denoel",
      targetAudience: "adultes"
    }
  },
  {
    bookId: "book_007",
    title: "Les Miserables",
    summary:
      "Roman historique et social qui suit notamment Jean Valjean dans la France du XIXe siecle.",
    tags: ["classique", "roman", "histoire", "societe"],
    metadata: {
      language: "fr",
      pages: 1488,
      publisher: "Le Livre de Poche",
      targetAudience: "adultes"
    }
  },
  {
    bookId: "book_008",
    title: "Fahrenheit 451",
    summary:
      "Dystopie dans laquelle les livres sont interdits et brules par les pompiers, jusqu'a la remise en question du personnage principal.",
    tags: ["dystopie", "censure", "lecture", "classique"],
    metadata: {
      language: "fr",
      pages: 240,
      publisher: "Denoel",
      targetAudience: "lycee"
    }
  },
  {
    bookId: "book_009",
    title: "La Nuit des temps",
    summary:
      "Roman de science-fiction francais melant decouverte archeologique, amour et civilisation disparue.",
    tags: ["science-fiction", "amour", "archeologie", "francais"],
    metadata: {
      language: "fr",
      pages: 384,
      publisher: "Pocket",
      targetAudience: "adultes"
    }
  },
  {
    bookId: "book_010",
    title: "Le Seigneur des Anneaux",
    summary:
      "Grande fresque fantasy autour de la communaute de l'anneau et de la lutte contre Sauron.",
    tags: ["fantasy", "aventure", "saga", "epique"],
    metadata: {
      language: "fr",
      pages: 1216,
      publisher: "Christian Bourgois",
      targetAudience: "adultes"
    }
  }
]);

db.reviews.insertMany([
  {
    id: "review_001",
    userId: "user_001",
    bookId: "book_001",
    rating: 5,
    comment: "Un classique de la science-fiction.",
    createdAt: ISODate("2025-10-08T00:00:00Z")
  },
  {
    id: "review_002",
    userId: "user_002",
    bookId: "book_002",
    rating: 4,
    comment: "Tres marquant et toujours actuel.",
    createdAt: ISODate("2025-10-08T00:00:00Z")
  },
  {
    id: "review_003",
    userId: "user_003",
    bookId: "book_004",
    rating: 4,
    comment: "Court mais puissant.",
    createdAt: ISODate("2025-10-09T00:00:00Z")
  },
  {
    id: "review_004",
    userId: "user_006",
    bookId: "book_006",
    rating: 5,
    comment: "Tres bonne introduction aux grands cycles de science-fiction.",
    createdAt: ISODate("2025-10-10T00:00:00Z")
  },
  {
    id: "review_005",
    userId: "user_007",
    bookId: "book_010",
    rating: 5,
    comment: "Univers riche et tres immersif.",
    createdAt: ISODate("2025-10-11T00:00:00Z")
  },
  {
    id: "review_006",
    userId: "user_004",
    bookId: "book_008",
    rating: 4,
    comment: "Une reflexion forte sur la censure et la place des livres.",
    createdAt: ISODate("2025-10-12T00:00:00Z")
  }
]);

db.book_details.createIndex({ bookId: 1 }, { unique: true });
db.book_details.createIndex({ tags: 1 });
db.book_details.createIndex({ "metadata.targetAudience": 1 });

db.reviews.createIndex({ id: 1 }, { unique: true });
db.reviews.createIndex({ bookId: 1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ rating: -1 });
db.reviews.createIndex({ createdAt: -1 });

print("MongoDB BookHub initialise: book_details et reviews.");
