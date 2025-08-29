import mongoose from 'mongoose';
import { Event } from '../src/models/Event.js';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testEvents = [
  {
    title: "Tech Meetup 2024",
    description: "Join us for an amazing tech meetup with industry experts. Learn about the latest trends in technology and network with professionals.",
    date: new Date('2024-12-15T18:00:00.000Z'),
    location: "Mumbai Tech Hub",
    coordinates: { lat: 19.0760, lng: 72.8777 },
    category: "Technology",
    maxParticipants: 50,
    teamRequirements: { girlsRequired: 2, boysRequired: 2 },
    price: 500,
    prizePool: {
      totalAmount: 10000,
      firstPlace: 5000,
      secondPlace: 3000,
      thirdPlace: 2000,
      currency: "INR"
    },
    currency: "INR",
    eventType: "in-person",
    contactEmail: "tech@example.com",
    contactPhone: "+91-9876543210",
    status: "approved"
  },
  {
    title: "Food Festival 2024",
    description: "Experience the best of Indian cuisine with top chefs from around the country. Taste, learn, and celebrate food culture.",
    date: new Date('2024-12-20T12:00:00.000Z'),
    location: "Delhi Food Court",
    coordinates: { lat: 28.7041, lng: 77.1025 },
    category: "Food",
    maxParticipants: 100,
    teamRequirements: { girlsRequired: 1, boysRequired: 1 },
    price: 300,
    prizePool: {
      totalAmount: 5000,
      firstPlace: 2500,
      secondPlace: 1500,
      thirdPlace: 1000,
      currency: "INR"
    },
    currency: "INR",
    eventType: "in-person",
    contactEmail: "food@example.com",
    contactPhone: "+91-9876543211",
    status: "approved"
  },
  {
    title: "Sports Championship",
    description: "Annual sports championship featuring cricket, football, and basketball tournaments. Great prizes and networking opportunities.",
    date: new Date('2024-12-25T09:00:00.000Z'),
    location: "Bangalore Sports Complex",
    coordinates: { lat: 12.9716, lng: 77.5946 },
    category: "Sports",
    maxParticipants: 200,
    teamRequirements: { girlsRequired: 3, boysRequired: 3 },
    price: 800,
    prizePool: {
      totalAmount: 25000,
      firstPlace: 12000,
      secondPlace: 8000,
      thirdPlace: 5000,
      currency: "INR"
    },
    currency: "INR",
    eventType: "in-person",
    contactEmail: "sports@example.com",
    contactPhone: "+91-9876543212",
    status: "approved"
  },
  {
    title: "Business Networking Event",
    description: "Connect with entrepreneurs, investors, and business leaders. Share ideas and explore collaboration opportunities.",
    date: new Date('2024-12-30T19:00:00.000Z'),
    location: "Chennai Business Center",
    coordinates: { lat: 13.0827, lng: 80.2707 },
    category: "Business",
    maxParticipants: 75,
    teamRequirements: { girlsRequired: 0, boysRequired: 0 },
    price: 1000,
    prizePool: {
      totalAmount: 0,
      firstPlace: 0,
      secondPlace: 0,
      thirdPlace: 0,
      currency: "INR"
    },
    currency: "INR",
    eventType: "in-person",
    contactEmail: "business@example.com",
    contactPhone: "+91-9876543213",
    status: "approved"
  },
  {
    title: "Music Concert",
    description: "An evening of live music featuring local and national artists. Rock, pop, and classical performances.",
    date: new Date('2025-01-05T20:00:00.000Z'),
    location: "Hyderabad Music Hall",
    coordinates: { lat: 17.3850, lng: 78.4867 },
    category: "Entertainment",
    maxParticipants: 150,
    teamRequirements: { girlsRequired: 0, boysRequired: 0 },
    price: 600,
    prizePool: {
      totalAmount: 0,
      firstPlace: 0,
      secondPlace: 0,
      thirdPlace: 0,
      currency: "INR"
    },
    currency: "INR",
    eventType: "in-person",
    contactEmail: "music@example.com",
    contactPhone: "+91-9876543214",
    status: "approved"
  }
];

async function createTestEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user to set as organizer
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found, creating events without organizer');
    }

    // Create events
    for (const eventData of testEvents) {
      const event = new Event({
        ...eventData,
        organizer: adminUser?._id || null
      });
      
      await event.save();
      console.log(`Created event: ${event.title}`);
    }

    console.log('All test events created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test events:', error);
    process.exit(1);
  }
}

createTestEvents();
