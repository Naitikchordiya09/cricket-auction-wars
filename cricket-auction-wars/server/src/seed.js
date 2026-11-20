
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");
const Player = require("./models/Player");

// 100 real players from IPL 2025 franchise squads.
// Ratings and base prices are gameplay estimates, not official stats.
const playerData = [
  // Chennai Super Kings
  ["Ruturaj Gaikwad","Batter","India",88,20,82,2],
  ["MS Dhoni","Wicketkeeper","India",72,5,95,1],
  ["Shivam Dube","All-rounder","India",85,55,75,1.5],
  ["Ravindra Jadeja","All-rounder","India",78,88,94,2],
  ["Rachin Ravindra","All-rounder","New Zealand",82,72,83,1.5],
  ["Devon Conway","Wicketkeeper","New Zealand",86,5,82,1.5],
  ["Sam Curran","All-rounder","England",78,82,84,2],
  ["Matheesha Pathirana","Bowler","Sri Lanka",10,91,75,1.5],
  ["Noor Ahmad","Bowler","Afghanistan",15,89,78,1],
  ["Khaleel Ahmed","Bowler","India",8,82,75,1],

  // Mumbai Indians
  ["Rohit Sharma","Batter","India",91,10,80,2],
  ["Suryakumar Yadav","Batter","India",96,15,88,2],
  ["Hardik Pandya","All-rounder","India",85,78,84,2],
  ["Tilak Varma","Batter","India",87,20,85,1.5],
  ["Jasprit Bumrah","Bowler","India",8,99,92,2],
  ["Trent Boult","Bowler","New Zealand",10,91,85,1.5],
  ["Will Jacks","All-rounder","England",84,72,82,1.5],
  ["Ryan Rickelton","Wicketkeeper","South Africa",86,5,82,1],
  ["Deepak Chahar","Bowler","India",25,82,80,1],
  ["Mitchell Santner","All-rounder","New Zealand",65,85,91,1],

  // Royal Challengers Bengaluru
  ["Virat Kohli","Batter","India",97,10,91,2],
  ["Rajat Patidar","Batter","India",88,15,82,1.5],
  ["Phil Salt","Wicketkeeper","England",92,5,88,2],
  ["Jitesh Sharma","Wicketkeeper","India",84,5,86,1],
  ["Liam Livingstone","All-rounder","England",86,82,80,2],
  ["Tim David","Batter","Australia",88,20,83,1.5],
  ["Josh Hazlewood","Bowler","Australia",8,94,88,2],
  ["Bhuvneshwar Kumar","Bowler","India",20,89,90,1.5],
  ["Krunal Pandya","All-rounder","India",70,82,88,1.5],
  ["Yash Dayal","Bowler","India",10,78,75,1],

  // Kolkata Knight Riders
  ["Rinku Singh","Batter","India",89,15,88,1.5],
  ["Sunil Narine","All-rounder","West Indies",82,94,91,2],
  ["Andre Russell","All-rounder","West Indies",94,88,89,2],
  ["Venkatesh Iyer","All-rounder","India",83,65,80,1.5],
  ["Ajinkya Rahane","Batter","India",80,5,82,1],
  ["Quinton de Kock","Wicketkeeper","South Africa",90,5,84,2],
  ["Varun Chakravarthy","Bowler","India",10,92,82,1.5],
  ["Harshit Rana","Bowler","India",15,84,78,1],
  ["Angkrish Raghuvanshi","Batter","India",78,10,80,1],
  ["Vaibhav Arora","Bowler","India",10,79,75,1],

  // Sunrisers Hyderabad
  ["Travis Head","Batter","Australia",96,15,85,2],
  ["Abhishek Sharma","All-rounder","India",93,65,86,2],
  ["Heinrich Klaasen","Wicketkeeper","South Africa",95,5,88,2],
  ["Ishan Kishan","Wicketkeeper","India",88,5,84,1.5],
  ["Nitish Kumar Reddy","All-rounder","India",80,76,82,1],
  ["Pat Cummins","All-rounder","Australia",60,89,86,2],
  ["Mohammed Shami","Bowler","India",10,91,82,1.5],
  ["Harshal Patel","Bowler","India",15,87,78,1.5],
  ["Rahul Chahar","Bowler","India",10,83,80,1],
  ["Adam Zampa","Bowler","Australia",10,86,82,1],

  // Rajasthan Royals
  ["Yashasvi Jaiswal","Batter","India",94,10,85,2],
  ["Sanju Samson","Wicketkeeper","India",91,5,88,2],
  ["Riyan Parag","All-rounder","India",85,65,85,1.5],
  ["Dhruv Jurel","Wicketkeeper","India",83,5,85,1],
  ["Shimron Hetmyer","Batter","West Indies",87,10,82,1.5],
  ["Jofra Archer","Bowler","England",15,91,85,2],
  ["Wanindu Hasaranga","All-rounder","Sri Lanka",65,92,87,2],
  ["Maheesh Theekshana","Bowler","Sri Lanka",10,85,83,1],
  ["Nitish Rana","Batter","India",82,10,80,1],
  ["Sandeep Sharma","Bowler","India",8,85,86,1],

  // Delhi Capitals
  ["KL Rahul","Wicketkeeper","India",91,5,88,2],
  ["Axar Patel","All-rounder","India",75,89,94,2],
  ["Kuldeep Yadav","Bowler","India",10,93,85,2],
  ["Tristan Stubbs","Wicketkeeper","South Africa",90,15,87,2],
  ["Faf du Plessis","Batter","South Africa",88,10,91,1.5],
  ["Jake Fraser-McGurk","Batter","Australia",90,5,82,1.5],
  ["Mitchell Starc","Bowler","Australia",20,94,84,2],
  ["T Natarajan","Bowler","India",5,87,78,1.5],
  ["Mukesh Kumar","Bowler","India",10,80,76,1],
  ["Sameer Rizvi","Batter","India",77,10,78,1],

  // Lucknow Super Giants
  ["Rishabh Pant","Wicketkeeper","India",92,5,90,2],
  ["Nicholas Pooran","Wicketkeeper","West Indies",96,5,87,2],
  ["Mitchell Marsh","All-rounder","Australia",87,75,82,2],
  ["Aiden Markram","All-rounder","South Africa",83,65,88,1.5],
  ["David Miller","Batter","South Africa",89,5,85,1.5],
  ["Ayush Badoni","All-rounder","India",79,55,80,1],
  ["Abdul Samad","Batter","India",80,15,78,1],
  ["Ravi Bishnoi","Bowler","India",10,88,82,1.5],
  ["Avesh Khan","Bowler","India",10,84,78,1.5],
  ["Mayank Yadav","Bowler","India",5,91,75,1.5],

  // Gujarat Titans
  ["Shubman Gill","Batter","India",94,10,88,2],
  ["Sai Sudharsan","Batter","India",92,10,85,1.5],
  ["Jos Buttler","Wicketkeeper","England",95,5,86,2],
  ["Rashid Khan","All-rounder","Afghanistan",72,97,94,2],
  ["Rahul Tewatia","All-rounder","India",78,65,87,1],
  ["Shahrukh Khan","Batter","India",82,10,80,1],
  ["Kagiso Rabada","Bowler","South Africa",15,94,83,2],
  ["Mohammed Siraj","Bowler","India",10,89,80,2],
  ["Prasidh Krishna","Bowler","India",10,86,77,1.5],
  ["Washington Sundar","All-rounder","India",68,82,90,1.5],

  // Punjab Kings
  ["Shreyas Iyer","Batter","India",91,10,88,2],
  ["Arshdeep Singh","Bowler","India",10,91,83,2],
  ["Yuzvendra Chahal","Bowler","India",10,93,82,2],
  ["Marcus Stoinis","All-rounder","Australia",86,78,85,2],
  ["Glenn Maxwell","All-rounder","Australia",88,80,82,1.5],
  ["Shashank Singh","Batter","India",84,30,82,1],
  ["Prabhsimran Singh","Wicketkeeper","India",86,5,82,1],
  ["Nehal Wadhera","Batter","India",82,10,83,1],
  ["Marco Jansen","All-rounder","South Africa",65,87,84,1.5],
  ["Josh Inglis","Wicketkeeper","Australia",87,5,84,1.5]
];

const players = playerData.map(
  ([name, role, nationality, batting, bowling, fielding, basePrice]) => ({
    name,
    role,
    nationality,
    isOverseas: nationality !== "India",
    batting,
    bowling,
    fielding,
    basePrice
  })
);

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Player.deleteMany({});

    await Player.insertMany(players);

    console.log(`Successfully seeded ${players.length} real IPL 2025 squad players.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
