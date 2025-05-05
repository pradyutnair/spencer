import { Client, Databases, ID } from "node-appwrite";
import * as dotenv from "dotenv";

// Initialize environment variables
dotenv.config();

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID
} = process.env;

const RATE_LIMIT_COLLECTION_ID = "rate_limits"; // You can add this to your .env file later

async function createRateLimitCollection() {
  console.log("Setting up rate limit collection in Appwrite...");

  // Check required environment variables
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
    console.error("Missing required Appwrite environment variables");
    process.exit(1);
  }

  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Check if the collection already exists
    try {
      await databases.getCollection(APPWRITE_DATABASE_ID, RATE_LIMIT_COLLECTION_ID);
      console.log("Rate limit collection already exists");
    } catch (error) {
      // Collection doesn't exist, create it
      console.log("Creating rate limit collection...");
      
      await databases.createCollection(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "Rate Limits"
      );

      // Create necessary attributes
      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "service",
        255,
        true, // required
        "gocardless" // default value
      );

      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "hitAt",
        255,
        true
      );

      await databases.createStringAttribute(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "expiresAt",
        255,
        true
      );

      await databases.createIntegerAttribute(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "resetSeconds",
        true, // required
        0, // min
        172800 // max (48 hours)
      );

      // Create an index on expiresAt for efficient querying
      await databases.createIndex(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "expiresAt_index",
        "asc", // Use "asc" instead of "key"
        ["expiresAt"]
      );

      // Create an index on service for efficient querying
      await databases.createIndex(
        APPWRITE_DATABASE_ID,
        RATE_LIMIT_COLLECTION_ID,
        "service_index",
        "asc", // Use "asc" instead of "key"
        ["service"]
      );

      console.log("Rate limit collection created successfully");
    }

    // Add rate_limits collection ID to current environment
    console.log("\nAdd this to your .env file:");
    console.log(`APPWRITE_RATE_LIMIT_COLLECTION_ID="${RATE_LIMIT_COLLECTION_ID}"`);

  } catch (error) {
    console.error("Error setting up rate limit collection:", error);
  }
}

// Run the setup
createRateLimitCollection().catch(console.error);

export {};