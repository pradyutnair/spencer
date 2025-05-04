import { createAdminClient } from '../lib/appwrite';
import { ID } from 'node-appwrite';

// Function to ensure collections exist in the database
async function setupCollections() {
  try {
    console.log('Starting Appwrite collections setup...');
    const { database } = await createAdminClient();
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    
    if (!databaseId) {
      throw new Error('APPWRITE_DATABASE_ID is not set in environment variables.');
    }
    
    // Define collections that need to be created if they don't exist
    const collections = [
      {
        id: 'sync_schedule',
        name: 'Sync Schedule',
        attributes: [
          { key: 'syncType', type: 'string', required: true, array: false },
          { key: 'timestamp', type: 'string', required: true, array: false },
        ],
      },
      {
        id: 'balance_cache',
        name: 'Balance Cache',
        attributes: [
          { key: 'requisitionId', type: 'string', required: true, array: false },
          { key: 'balances', type: 'string', required: true, array: false },
          { key: 'timestamp', type: 'string', required: true, array: false },
        ],
      }
    ];
    
    // Create collections if they don't exist
    for (const collection of collections) {
      try {
        // Check if collection exists first
        await database.getCollection(databaseId, collection.id);
        console.log(`Collection ${collection.name} already exists.`);
      } catch (error) {
        // Collection doesn't exist, create it
        console.log(`Creating collection ${collection.name}...`);
        await database.createCollection(databaseId, collection.id, collection.name);
        
        // Create attributes for the collection
        for (const attribute of collection.attributes) {
          console.log(`Creating attribute ${attribute.key} in ${collection.name}...`);
          await database.createStringAttribute(
            databaseId,
            collection.id,
            attribute.key,
            attribute.required,
            undefined, // Default value
            undefined, // Maximum length
            attribute.array
          );
        }
        
        console.log(`Collection ${collection.name} created successfully with all attributes.`);
      }
    }
    
    // Update your environment variables in the .env.local file
    console.log('\nAdd these lines to your .env.local file if they are not already there:');
    console.log('APPWRITE_SYNC_COLLECTION_ID=sync_schedule');
    console.log('APPWRITE_BALANCE_CACHE_COLLECTION_ID=balance_cache');
    
    console.log('\nSetup completed successfully!');
  } catch (error) {
    console.error('Error setting up Appwrite collections:', error);
  }
}

// Execute the setup function
setupCollections();