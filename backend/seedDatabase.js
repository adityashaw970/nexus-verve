// seedDatabase.js - Run this once to populate your database
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Question = require("./models/question");
const RoundConfig = require("./models/roundConfig");

dotenv.config();

const ROUND_CONFIGS = [
  {
    round: 1,
    name: "Round 1",
    scoreMultiplier: 1,
    questionTime: 30000,
    startTime: "10 18 * * *",
    totalQuestions: 15,
  },
  {
    round: 2,
    name: "Round 2",
    scoreMultiplier: 2,
    questionTime: 40000,
    startTime: "30 18 * * *",
    totalQuestions: 15,
  },
  {
    round: 3,
    name: "Round 3",
    scoreMultiplier: 3,
    questionTime: 60000,
    startTime: "45 10 * * *",
    totalQuestions: 15,
  },
  {
    round: 4,
    name: "Bonus Round",
    scoreMultiplier: 5,
    questionTime: 60000,
    startTime: "00 11 * * *",
    totalQuestions: 10,
  },
];

const QUESTIONS = [
  // Round 1 - Set 1
  { day: "Day 1", round: 1, set: 1, order: 0, question: "What is the Japanese term for animation, often characterized by colorful artwork, fantastical themes, and vibrant characters?", answer: "Anime" },
  { day: "Day 1", round: 1, set: 1, order: 1, question: "In which popular Nintendo franchise do players battle in various arenas using characters like Mario, Link, and Pikachu?", answer: "Super Smash Bros" },
  { day: "Day 1", round: 1, set: 1, order: 2, question: "What is the name of the iconic Japanese media franchise created by Satoshi Tajiri in 1996, featuring special creatures that can be tamed and trained?", answer: "Pokemon" },
  { day: "Day 1", round: 1, set: 1, order: 3, question: "This device used in the Pokémon series is an electronic encyclopedia of all types of Pokémon, vital for new trainers.", answer: "Pokedex" },
  { day: "Day 1", round: 1, set: 1, order: 4, question: "Who is the iconic protagonist of the Pokémon anime series, known for his dream of becoming a Pokémon Master and his bond with his partner Pikachu?", answer: "Ash Ketchum" },
  
  // Round 1 - Set 2
  { day: "Day 1", round: 1, set: 2, order: 5, question: "What is the term for a player who is primarily responsible for scoring runs and defending the wicket in the game of cricket?", answer: "Batsman" },
  { day: "Day 1", round: 1, set: 2, order: 6, question: "What is the prestigious annual cricket event, where the best players from various franchises compete, and has become immensely popular in India since its inception in 2008?", answer: "IPL / Indian Premier League" },
  { day: "Day 1", round: 1, set: 2, order: 7, question: "Which Indian city, known for its vibrant culture and as a major IT hub, is home to a top IPL team and has a significant cricket following?", answer: "Bangalore" },
  { day: "Day 1", round: 1, set: 2, order: 8, question: "This person got married to a famous celebrity in December of 2017. Which famous celebrity did he get married to from the world of Bollywood?", answer: "Anushka Sharma" },
  { day: "Day 1", round: 1, set: 2, order: 9, question: "Who is this prolific Indian cricketer, renowned for his batting prowess, passionate playing style, and arguably the best test captain India has ever produced?", answer: "Virat Kohli" },
  
  // Round 1 - Set 3
  { day: "Day 1", round: 1, set: 3, order: 10, question: "It is a majestic marble building built between 1906 and 1921. It was dedicated to the memory of the Empress of England of that time. It is also a symbol of love and culture.", answer: "Victoria Memorial" },
  { day: "Day 1", round: 1, set: 3, order: 11, question: "It is an iconic cantilever bridge connecting two cities. It is also named to honor the famous Bengali poet. It is one of the busiest bridges in the world standing on two main pillars.", answer: "Howrah Bridge" },
  { day: "Day 1", round: 1, set: 3, order: 12, question: "The oldest and the largest museum in India and Asia, housing an extensive collection of art, archeology and natural history exhibits. It was founded in 1814 at the cradle of the Asiatic Society of Bengal.", answer: "Indian Museum" },
  { day: "Day 1", round: 1, set: 3, order: 13, question: "A vibrant street known for its restaurants, cafes, and nightlife offering a mix of colonial-era buildings and modern establishments. In some specific festive seasons it transforms into a dazzling spectacle with vibrant decorations.", answer: "Park Street" },
  { day: "Day 1", round: 1, set: 3, order: 14, question: "Which city was the capital of British India before Delhi?", answer: "Kolkata" },

  // Round 2 - Set 1
  { day: "Day 2", round: 2, set: 1, order: 0, question: "In the UK, the book is known as 'Harry Potter and the Philosopher's Stone.' What was the U.S. title?", answer: "Harry Potter and the Sorcerer's Stone" },
  { day: "Day 2", round: 2, set: 1, order: 1, question: "J.K. Rowling conceived the idea for a famous character while on a delayed train in 1990. Who was that character?", answer: "Harry Potter" },
  { day: "Day 2", round: 2, set: 1, order: 2, question: "The original UK cover art was illustrated by a 23-year-old English artist. Who was he?", answer: "Thomas Taylor" },
  { day: "Day 2", round: 2, set: 1, order: 3, question: "Which real historical figure, known for alchemy, appears as a character in the book?", answer: "Nicolas Flamel" },
  { day: "Day 2", round: 2, set: 1, order: 4, question: "This book sold over 120 million copies worldwide — what is its title?", answer: "Harry Potter and the Sorcerer's Stone" },

  // Round 2 - Set 2
  { day: "Day 2", round: 2, set: 2, order: 5, question: "What is the term for a genre of ancient Indian texts that contain myths, legends, and historical narratives?", answer: "Purana" },
  { day: "Day 2", round: 2, set: 2, order: 6, question: "A thief who became a sage through chanting god's name — who is he?", answer: "Valmiki" },
  { day: "Day 2", round: 2, set: 2, order: 7, question: "Who is the greatest devotee of Lord Shiva known for intelligence and cunning?", answer: "Ravan" },
  { day: "Day 2", round: 2, set: 2, order: 8, question: "What is the tear-shaped island nation located south of India?", answer: "Sri Lanka" },
  { day: "Day 2", round: 2, set: 2, order: 9, question: "Which epic tells the story of Lord Rama and teaches duty and devotion?", answer: "Ramayan" },

  // Round 2 - Set 3
  { day: "Day 2", round: 2, set: 3, order: 10, question: "They work with fabrics and garments using sewing machines. Who are they?", answer: "Tailor" },
  { day: "Day 2", round: 2, set: 3, order: 11, question: "This car was first introduced in India in 2005 and became a bestseller. Name it.", answer: "Swift" },
  { day: "Day 2", round: 2, set: 3, order: 12, question: "This area often refers to intergalactic or interstellar emptiness. What is it called?", answer: "Blank Space" },
  { day: "Day 2", round: 2, set: 3, order: 13, question: "The country bordered by Canada and Mexico, consisting of 50 states and Washington, D.C.?", answer: "United States of America" },
  { day: "Day 2", round: 2, set: 3, order: 14, question: "American singer-songwriter born in 1989, known for country and pop hits. Who is she?", answer: "Taylor Swift" },

  // Round 3 - Set 1
  { day: "Day 3", round: 3, set: 1, order: 0, question: "Which country is known as 'The Land of the Rising Sun'?", answer: "Japan" },
  { day: "Day 3", round: 3, set: 1, order: 1, question: "An American singer, songwriter, dancer, and cultural icon who debuted at age six in 1964. Who is he?", answer: "Michael Jackson" },
  { day: "Day 3", round: 3, set: 1, order: 2, question: "A large fortified building serving as a royal residence in medieval times. What is it?", answer: "Castle" },
  { day: "Day 3", round: 3, set: 1, order: 3, question: "A supernatural malevolent being believed to influence humans — what is it called?", answer: "Demon" },
  { day: "Day 3", round: 3, set: 1, order: 4, question: "A warrior group from an anime hunting demons to avenge their family — name the anime.", answer: "Demon Slayer" },

  // Round 3 - Set 2
  { day: "Day 3", round: 3, set: 2, order: 5, question: "What is the common nickname for a device used to lift heavy objects, especially vehicles?", answer: "Jack" },
  { day: "Day 3", round: 3, set: 2, order: 6, question: "What is the term for a large watercraft designed to transport people or goods?", answer: "Ship" },
  { day: "Day 3", round: 3, set: 2, order: 7, question: "What term describes a state of armed conflict between countries or groups?", answer: "War" },
  { day: "Day 3", round: 3, set: 2, order: 8, question: "What small, common bird known for chirping belongs to the family Passeridae?", answer: "Sparrow" },
  { day: "Day 3", round: 3, set: 2, order: 9, question: "Who is the witty pirate known for saying 'Why is the rum always gone?'", answer: "Jack Sparrow" },

  // Round 3 - Set 3
  { day: "Day 3", round: 3, set: 3, order: 10, question: "An affectionate term for a rabbit, especially a young or cute one.", answer: "Bunny" },
  { day: "Day 3", round: 3, set: 3, order: 11, question: "The fibrous material that makes up tree trunks and branches.", answer: "Wood" },
  { day: "Day 3", round: 3, set: 3, order: 12, question: "The reproductive structure of flowering plants.", answer: "Flower" },
  { day: "Day 3", round: 3, set: 3, order: 13, question: "A central character in the Mahabharata known for his archery skills and bravery.", answer: "Arjun" },
  { day: "Day 3", round: 3, set: 3, order: 14, question: "Which 2021 Telugu action-drama film revolves around red sandalwood smuggling?", answer: "Pushpa" },

  // Bonus Round - Set 1
  { day: "Day 4", round: 4, set: 1, order: 0, question: "I can recognize faces in your phone's photo, and tell who is who wherever you go.", answer: "Face Recognition" },
  { day: "Day 4", round: 4, set: 1, order: 1, question: "I can translate words from one language to another, helping people understand one another.", answer: "Translator" },
  { day: "Day 4", round: 4, set: 1, order: 2, question: "I learn from data and get smarter each day, predicting things in a clever way.", answer: "Machine Learning" },
  { day: "Day 4", round: 4, set: 1, order: 3, question: "I can chat, answer questions, or tell you a joke — sometimes my answers make humans go 'whoa!'", answer: "Chatbot" },
  { day: "Day 4", round: 4, set: 1, order: 4, question: "I am the technology behind all these things, learning, predicting, and making life zing. What am I?", answer: "AI" },

  // Bonus Round - Set 2
  { day: "Day 4", round: 4, set: 2, order: 5, question: "I am a delicious dish with cheese and tomato, everyone loves me, even the bravest bravado.", answer: "Pizza" },
  { day: "Day 4", round: 4, set: 2, order: 6, question: "I am a famous tower that leans to one side, tourists take photos here with pride.", answer: "Leaning Tower of Pisa" },
  { day: "Day 4", round: 4, set: 2, order: 7, question: "I am a city of canals and gondolas too, a romantic place where you can float through.", answer: "Venice" },
  { day: "Day 4", round: 4, set: 2, order: 8, question: "I am a city with the Colosseum tall, gladiators once fought within my walls.", answer: "Rome" },
  { day: "Day 4", round: 4, set: 2, order: 9, question: "I'm the country of pizza, towers, and art, with canals and ruins that capture the heart. Which country am I?", answer: "Italy" },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });


    // Clear existing data
    await RoundConfig.deleteMany({});
    await Question.deleteMany({});

    // Insert round configs
    await RoundConfig.insertMany(ROUND_CONFIGS);

    // Insert questions
    await Question.insertMany(QUESTIONS);

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();