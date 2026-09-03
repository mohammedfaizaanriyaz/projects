const eventsData = [
  { id: 1, title: "Intro to Web Development", category: "Web", date: "2025-03-15", capacity: 50, registered: 38, description: "Learn the fundamentals of modern web development." },
  { id: 2, title: "AI & Machine Learning Workshop", category: "AI", date: "2025-04-01", capacity: 30, registered: 22, description: "Explore the basics of AI and ML with hands-on projects." },
  { id: 3, title: "Cybersecurity Fundamentals", category: "Security", date: "2025-04-12", capacity: 40, registered: 35, description: "Essential cybersecurity concepts for beginners." },
  { id: 4, title: "Data Science Bootcamp", category: "Data", date: "2025-04-26", capacity: 25, registered: 19, description: "Immersive bootcamp covering data analysis and visualization." },
  { id: 5, title: "Game Dev Challenge", category: "Gaming", date: "2025-05-10", capacity: 20, registered: 15, description: "Build a simple game in 24 hours." },
  { id: 6, title: "Cloud Computing Meetup", category: "Cloud", date: "2025-05-20", capacity: 35, registered: 30, description: "Introduction to cloud platforms and services." },
  { id: 7, title: "Full Stack Hackathon", category: "Competition", date: "2025-06-01", capacity: 40, registered: 40, description: "Build the best full-stack application." },
  { id: 8, title: "React & Beyond", category: "Web", date: "2025-06-15", capacity: 30, registered: 25, description: "Advanced React patterns and best practices." },
];

const membersData = [
  { id: 1, name: "Alice Johnson", role: "President", points: 1250, image: "https://via.placeholder.com/80" },
  { id: 2, name: "Bob Smith", role: "Vice President", points: 980, image: "https://via.placeholder.com/80" },
  { id: 3, name: "Carol Davis", role: "Secretary", points: 870, image: "https://via.placeholder.com/80" },
  { id: 4, name: "David Wilson", role: "Treasurer", points: 730, image: "https://via.placeholder.com/80" },
  { id: 5, name: "Emma Brown", role: "Event Coordinator", points: 650, image: "https://via.placeholder.com/80" },
  { id: 6, name: "Frank Miller", role: "Web Lead", points: 520, image: "https://via.placeholder.com/80" },
  { id: 7, name: "Grace Taylor", role: "AI Lead", points: 480, image: "https://via.placeholder.com/80" },
  { id: 8, name: "Henry Anderson", role: "Security Lead", points: 410, image: "https://via.placeholder.com/80" },
  { id: 9, name: "Ivy Martinez", role: "Data Lead", points: 380, image: "https://via.placeholder.com/80" },
  { id: 10, name: "Jack Thompson", role: "Gaming Lead", points: 350, image: "https://via.placeholder.com/80" },
];

const leaderboardData = [
  { rank: 1, name: "Alice Johnson", points: 1250 },
  { rank: 2, name: "Bob Smith", points: 980 },
  { rank: 3, name: "Carol Davis", points: 870 },
  { rank: 4, name: "David Wilson", points: 730 },
  { rank: 5, name: "Emma Brown", points: 650 },
  { rank: 6, name: "Frank Miller", points: 520 },
  { rank: 7, name: "Grace Taylor", points: 480 },
  { rank: 8, name: "Henry Anderson", points: 410 },
  { rank: 9, name: "Ivy Martinez", points: 380 },
  { rank: 10, name: "Jack Thompson", points: 350 },
];

export { eventsData, membersData, leaderboardData };