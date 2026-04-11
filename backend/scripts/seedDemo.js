const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Event = require('../src/models/Event').default || require('../src/models/Event');
const Startup = require('../src/models/Startup').default || require('../src/models/Startup');
const Challenge = require('../src/models/Challenge').default || require('../src/models/Challenge');
const User = require('../src/models/User');

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in .env');
    process.exit(1);
  }
  
  console.log('⏳ Connecting to MongoDB...');
  
  try {
    // Try connecting to Atlas with a shorter timeout so it doesn't hang forever if IP is blocked
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ MongoDB connected (Atlas)');
  } catch (err) {
    console.warn('⚠️  Atlas connection failed. Trying local MongoDB...');
    try {
      // Fallback to local MongoDB
      await mongoose.connect('mongodb://127.0.0.1:27017/alumni', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('✓ MongoDB connected (Local)');
    } catch (localErr) {
      console.error('✗ Failed to connect to both Atlas and Local MongoDB.');
      console.error('Atlas Error:', err.message);
      console.error('Local Error:', localErr.message);
      console.log('\n💡 Tip: If you are using MongoDB Atlas, make sure your IP is whitelisted at:');
      console.log('   https://www.mongodb.com/docs/atlas/security-whitelist/');
      process.exit(1);
    }
  }
}

const bcrypt = require('bcrypt');

async function pickOrganizer() {
  let user = await User.findOne({ role: 'admin' });
  if (!user) user = await User.findOne({ email: 'admin@aluverse.com' });
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    user = new User({
      name: 'Admin User',
      email: 'admin@aluverse.com',
      role: 'admin',
      isActive: true,
      isProfileComplete: true,
      passwordHash: passwordHash,
    });
    await user.save();
    console.log('✓ Created Admin User: admin@aluverse.com / admin123');
  }
  return user;
}

async function seedEvents(organizer) {
  const samples = [
    { title: 'Alumni Tech Talk: AI in 2026', description: 'Practical AI deployments in modern industry.', location: 'Auditorium A', mode: 'offline', coverImage: 'https://picsum.photos/seed/ev1/900/400' },
    { title: 'Remote Webinar: Data Science Careers', description: 'Breaking into data roles with guidance from experts.', location: 'Zoom', mode: 'online', meetingLink: 'https://meet.google.com/abc-defg-hij', coverImage: 'https://picsum.photos/seed/ev2/900/400' },
    { title: 'Global Alumni Meetup 2026', description: 'The biggest networking event of the year.', location: 'Mumbai, MH', mode: 'offline', coverImage: 'https://picsum.photos/seed/ev3/900/400' },
    { title: 'Cloud Computing Workshop', description: 'Hands-on session on AWS and Azure.', location: 'Google Meet', mode: 'online', meetingLink: 'https://meet.google.com/cloud-demo', coverImage: 'https://picsum.photos/seed/ev4/900/400' },
    { title: 'Startup Pitch Night', description: 'Watch students pitch to alumni investors.', location: 'Incubation Center', mode: 'offline', coverImage: 'https://picsum.photos/seed/ev5/900/400' },
    { title: 'Cybersecurity Essentials', description: 'Protecting your digital assets in 2026.', location: 'Virtual Hall 1', mode: 'online', meetingLink: 'https://zoom.us/j/cyber-talk', coverImage: 'https://picsum.photos/seed/ev6/900/400' },
    { title: 'Soft Skills for Engineers', description: 'Mastering communication and leadership.', location: 'Seminar Hall B', mode: 'offline', coverImage: 'https://picsum.photos/seed/ev7/900/400' },
    { title: 'UI/UX Design Trends', description: 'Exploring the future of digital interfaces.', location: 'Figma Live', mode: 'online', meetingLink: 'https://figma.com/live/design', coverImage: 'https://picsum.photos/seed/ev8/900/400' },
    { title: 'Batch of 2015 Reunion', description: 'Celebrating 11 years of excellence.', location: 'City Club', mode: 'offline', coverImage: 'https://picsum.photos/seed/ev9/900/400' },
    { title: 'Open Source Contribution Day', description: 'Learn how to contribute to major projects.', location: 'GitHub Classroom', mode: 'online', meetingLink: 'https://meet.google.com/oss-day', coverImage: 'https://picsum.photos/seed/ev10/900/400' },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const exists = await Event.findOne({ title: s.title });
    if (!exists) {
      await Event.create({
        ...s,
        organizerId: organizer._id,
        date: new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000)
      });
      console.log('✓ Event:', s.title);
    }
  }
}

async function seedStartups(owner) {
  const samples = [
    { title: 'EcoTrack', tagline: 'Personal carbon footprint tracker' },
    { title: 'AluNet', tagline: 'Exclusive professional networking for alumni' },
    { title: 'HealthSync', tagline: 'Real-time patient monitoring via IoT' },
    { title: 'FinFlow', tagline: 'Simplified crypto accounting for SMEs' },
    { title: 'EduBridge', tagline: 'Bridging the gap between theory and industry' },
    { title: 'SolarPulse', tagline: 'Smart grid management for solar farms' },
    { title: 'FoodieQuest', tagline: 'Discovery platform for local hidden gems' },
    { title: 'CodeAssist', tagline: 'AI-powered pair programmer for students' },
    { title: 'AutoGuard', tagline: 'Automated security auditing for web apps' },
    { title: 'QuickShip', tagline: 'Last-mile logistics optimized by AI' },
  ];

  for (const s of samples) {
    const exists = await Startup.findOne({ title: s.title });
    if (!exists) {
      await Startup.create({ ownerId: owner._id, title: s.title, tagline: s.tagline });
      console.log('✓ Startup:', s.title);
    }
  }
}

async function seedChallenges(author) {
  const samples = [
    { title: 'Resume Parser Challenge', description: 'Build an NLP tool to extract info from PDFs.', domain: 'AI/ML', difficulty: 'intermediate', duration: '2weeks', cashReward: '₹15000' },
    { title: 'E-commerce UI Overhaul', description: 'Redesign the checkout flow for a major retailer.', domain: 'Design', difficulty: 'beginner', duration: '1week', cashReward: '₹5000' },
    { title: 'Secure Chat Protocol', description: 'Implement end-to-end encryption for a web app.', domain: 'Security', difficulty: 'advanced', duration: '3weeks', cashReward: '₹25000' },
    { title: 'IoT Greenhouse Monitor', description: 'Hardware + Software challenge for smart farming.', domain: 'IoT', difficulty: 'intermediate', duration: '1month', cashReward: '₹20000' },
    { title: 'Algo Trading Bot', description: 'Create a strategy that beats the market benchmark.', domain: 'Finance', difficulty: 'advanced', duration: '2weeks', cashReward: '₹30000' },
    { title: 'Waste Management App', description: 'App to connect households with recycling units.', domain: 'Sustainability', difficulty: 'beginner', duration: '2weeks', cashReward: '₹8000' },
    { title: 'Real-time Video Editor', description: 'Web-based video processing using WebGL.', domain: 'Web Tech', difficulty: 'advanced', duration: '3weeks', cashReward: '₹40000' },
    { title: 'Health & Fitness Tracker', description: 'Gamified app to encourage daily exercise.', domain: 'Mobile', difficulty: 'intermediate', duration: '2weeks', cashReward: '₹12000' },
    { title: 'Blockchain Voting System', description: 'Transparent and tamper-proof voting for clubs.', domain: 'Web3', difficulty: 'intermediate', duration: '1month', cashReward: '₹18000' },
    { title: 'AR Campus Tour', description: 'Augmented reality experience for new students.', domain: 'AR/VR', difficulty: 'advanced', duration: '1month', cashReward: '₹50000' },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const exists = await Challenge.findOne({ title: s.title });
    if (!exists) {
      await Challenge.create({
        ...s,
        authorId: author._id,
        companyName: 'AluVerse Partner',
        skillsRequired: 'JavaScript, Node.js, Python',
        deadline: new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000)
      });
      console.log('✓ Challenge:', s.title);
    }
  }
}

async function main() {
  await connect();
  const organizer = await pickOrganizer();
  await seedEvents(organizer);
  await seedStartups(organizer);
  await seedChallenges(organizer);
  await mongoose.disconnect();
  console.log('\n🏁 Seed complete! You now have 10 items in each category.');
}

main().catch(async (e) => {
  console.error('Seed failed:', e);
  await mongoose.disconnect();
  process.exit(1);
});
