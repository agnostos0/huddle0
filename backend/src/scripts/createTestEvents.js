import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample event data with realistic content
const testEvents = [
  {
    title: "Tech Startup Meetup 2024",
    description: "Join us for an exciting evening of networking with tech entrepreneurs, investors, and innovators. Learn about the latest trends in startup ecosystem, share your ideas, and connect with like-minded professionals. Perfect for founders, developers, and anyone interested in the tech startup world.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    location: "Mumbai, Maharashtra",
    googleLocationLink: "https://maps.google.com/?q=Mumbai,Maharashtra",
    coordinates: { lat: 19.0760, lng: 72.8777 },
    category: "Technology",
    tags: ["startup", "networking", "entrepreneurship", "tech"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 100,
    price: 500,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "techmeetup@example.com",
    contactPhone: "+91-9876543210"
  },
  {
    title: "Yoga & Wellness Retreat",
    description: "Escape the hustle and bustle of city life with our rejuvenating yoga and wellness retreat. Experience guided meditation sessions, therapeutic yoga classes, healthy organic meals, and peaceful nature walks. Perfect for beginners and experienced practitioners alike.",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    location: "Rishikesh, Uttarakhand",
    googleLocationLink: "https://maps.google.com/?q=Rishikesh,Uttarakhand",
    coordinates: { lat: 30.0869, lng: 78.2676 },
    category: "Health",
    tags: ["yoga", "wellness", "meditation", "retreat", "nature"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 25,
    price: 15000,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "wellness@example.com",
    contactPhone: "+91-9876543211"
  },
  {
    title: "Food Festival - Street Food Extravaganza",
    description: "Indulge in the most delicious street food from across India! From spicy chaat to sweet jalebis, from Mumbai vada pav to Delhi golgappas, experience the authentic flavors of Indian street cuisine. Live cooking demonstrations, food competitions, and cultural performances included.",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    location: "Delhi, India",
    googleLocationLink: "https://maps.google.com/?q=Delhi,India",
    coordinates: { lat: 28.7041, lng: 77.1025 },
    category: "Food",
    tags: ["food", "street food", "festival", "culture", "delhi"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 200,
    price: 300,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "foodfest@example.com",
    contactPhone: "+91-9876543212"
  },
  {
    title: "Virtual Coding Bootcamp",
    description: "Learn web development from scratch in this intensive 8-week virtual bootcamp. Master HTML, CSS, JavaScript, React, and Node.js. Build real projects, work with industry mentors, and prepare for a career in tech. No prior experience required!",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    location: "Online",
    virtualMeetingLink: "https://zoom.us/j/123456789",
    category: "Education",
    tags: ["coding", "web development", "javascript", "react", "bootcamp"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 50,
    price: 25000,
    currency: "INR",
    eventType: "virtual",
    contactEmail: "bootcamp@example.com",
    contactPhone: "+91-9876543213"
  },
  {
    title: "Music Concert - Bollywood Night",
    description: "Experience the magic of Bollywood music live! Featuring popular singers performing hit songs from classic to contemporary Bollywood films. Dance to your favorite tunes, enjoy delicious food, and create unforgettable memories with friends and family.",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    location: "Bangalore, Karnataka",
    googleLocationLink: "https://maps.google.com/?q=Bangalore,Karnataka",
    coordinates: { lat: 12.9716, lng: 77.5946 },
    category: "Music",
    tags: ["music", "bollywood", "concert", "live", "entertainment"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 500,
    price: 1500,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "concert@example.com",
    contactPhone: "+91-9876543214"
  },
  {
    title: "Business Networking Mixer",
    description: "Connect with business professionals, entrepreneurs, and industry leaders in a relaxed networking environment. Share ideas, explore collaboration opportunities, and build valuable business relationships. Includes refreshments and structured networking activities.",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    location: "Chennai, Tamil Nadu",
    googleLocationLink: "https://maps.google.com/?q=Chennai,TamilNadu",
    coordinates: { lat: 13.0827, lng: 80.2707 },
    category: "Business",
    tags: ["networking", "business", "entrepreneurs", "professional"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 80,
    price: 800,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "networking@example.com",
    contactPhone: "+91-9876543215"
  },
  {
    title: "Art Exhibition - Contemporary Indian Artists",
    description: "Discover the vibrant world of contemporary Indian art through this curated exhibition featuring works from emerging and established artists. Experience diverse artistic expressions, attend artist talks, and participate in interactive art workshops.",
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    location: "Kolkata, West Bengal",
    googleLocationLink: "https://maps.google.com/?q=Kolkata,WestBengal",
    coordinates: { lat: 22.5726, lng: 88.3639 },
    category: "Art",
    tags: ["art", "exhibition", "contemporary", "indian artists", "culture"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 150,
    price: 200,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "artexhibition@example.com",
    contactPhone: "+91-9876543216"
  },
  {
    title: "Sports Tournament - Cricket Championship",
    description: "Join the ultimate cricket championship for amateur players! Teams of 11 players compete in a knockout tournament format. Trophies, medals, and cash prizes for winners. Professional umpires, live commentary, and refreshments provided. Register your team now!",
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
    location: "Hyderabad, Telangana",
    googleLocationLink: "https://maps.google.com/?q=Hyderabad,Telangana",
    coordinates: { lat: 17.3850, lng: 78.4867 },
    category: "Sports",
    tags: ["cricket", "tournament", "championship", "sports", "team"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 200,
    price: 2000,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "cricket@example.com",
    contactPhone: "+91-9876543217"
  },
  {
    title: "Social Impact Workshop",
    description: "Learn how to create positive social change through this interactive workshop. Topics include sustainable development, community engagement, social entrepreneurship, and volunteer management. Connect with NGOs, social workers, and change-makers.",
    date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
    location: "Pune, Maharashtra",
    googleLocationLink: "https://maps.google.com/?q=Pune,Maharashtra",
    coordinates: { lat: 18.5204, lng: 73.8567 },
    category: "Social",
    tags: ["social impact", "workshop", "sustainability", "community", "volunteer"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 60,
    price: 400,
    currency: "INR",
    eventType: "in-person",
    contactEmail: "socialimpact@example.com",
    contactPhone: "+91-9876543218"
  },
  {
    title: "Hybrid Conference - Future of AI",
    description: "Explore the cutting-edge developments in Artificial Intelligence at this hybrid conference. Attend in-person or join virtually. Keynote speakers from leading tech companies, panel discussions, hands-on workshops, and networking opportunities.",
    date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    location: "Ahmedabad, Gujarat",
    googleLocationLink: "https://maps.google.com/?q=Ahmedabad,Gujarat",
    coordinates: { lat: 23.0225, lng: 72.5714 },
    virtualMeetingLink: "https://teams.microsoft.com/l/meetup-join/123456789",
    category: "Technology",
    tags: ["AI", "artificial intelligence", "conference", "technology", "future"],
    photos: [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    maxParticipants: 300,
    price: 1500,
    currency: "INR",
    eventType: "hybrid",
    contactEmail: "aiconference@example.com",
    contactPhone: "+91-9876543219"
  }
];

async function createTestEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user to be the organizer
    const adminUser = await User.findOne({ email: 'admin@huddle.com' });
    if (!adminUser) {
      console.error('Admin user not found. Please ensure admin@huddle.com exists.');
      process.exit(1);
    }

    // Clear existing events
    console.log('Clearing existing events...');
    await Event.deleteMany({});
    console.log('All existing events deleted.');

    // Create test events
    console.log('Creating test events...');
    const createdEvents = [];
    
    for (const eventData of testEvents) {
      const event = new Event({
        ...eventData,
        organizer: adminUser._id,
        coverPhoto: eventData.photos[0] || null,
        teamRequirements: {
          teamSize: 0,
          girlsRequired: 0,
          boysRequired: 0
        },
        pricing: {
          individual: eventData.price,
          teamLeader: eventData.price,
          teamMember: eventData.price,
          malePrice: eventData.price,
          femalePrice: eventData.price
        }
      });
      
      const savedEvent = await event.save();
      createdEvents.push(savedEvent);
      console.log(`Created event: ${savedEvent.title}`);
    }

    console.log(`\n✅ Successfully created ${createdEvents.length} test events!`);
    console.log('\n📋 Event Summary:');
    createdEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.category} - ${event.location}`);
    });

  } catch (error) {
    console.error('Error creating test events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestEvents();
