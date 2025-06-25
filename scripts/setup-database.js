#!/usr/bin/env node

const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

// Collection schemas
const COLLECTIONS = {
    transactions: {
        id: process.env.APPWRITE_TRANSACTION_COLLECTION_ID || 'transactions',
        name: 'Transactions',
        attributes: [
            { key: 'requisitionId', type: 'string', size: 255, required: true },
            { key: 'amount', type: 'double', required: true },
            { key: 'currency', type: 'string', size: 10, required: true },
            { key: 'bookingDate', type: 'string', size: 50, required: true },
            { key: 'bookingDateTime', type: 'string', size: 50, required: true },
            { key: 'Payee', type: 'string', size: 500, required: false },
            { key: 'Bank', type: 'string', size: 255, required: false },
            { key: 'Year', type: 'integer', required: false },
            { key: 'Month', type: 'integer', required: false },
            { key: 'Week', type: 'integer', required: false },
            { key: 'Day', type: 'integer', required: false },
            { key: 'DayOfWeek', type: 'integer', required: false },
            { key: 'Description', type: 'string', size: 1000, required: false },
            { key: 'category', type: 'string', size: 100, required: false },
            { key: 'exclude', type: 'boolean', required: false, default: false }
        ],
        indexes: [
            { key: 'requisitionId_idx', type: 'key', attributes: ['requisitionId'] },
            { key: 'bank_idx', type: 'key', attributes: ['Bank'] },
            { key: 'booking_date_idx', type: 'key', attributes: ['bookingDate'] },
            { key: 'exclude_idx', type: 'key', attributes: ['exclude'] }
        ]
    },
    requisitions: {
        id: process.env.APPWRITE_REQ_COLLECTION_ID || 'requisitions',
        name: 'Requisitions',
        attributes: [
            { key: 'requisitionId', type: 'string', size: 255, required: true },
            { key: 'bankName', type: 'string', size: 255, required: true },
            { key: 'bankLogo', type: 'string', size: 500, required: false },
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'status', type: 'string', size: 50, required: false },
            { key: 'createdAt', type: 'string', size: 50, required: false }
        ],
        indexes: [
            { key: 'user_idx', type: 'key', attributes: ['userId'] },
            { key: 'requisition_idx', type: 'key', attributes: ['requisitionId'] },
            { key: 'status_idx', type: 'key', attributes: ['status'] }
        ]
    },
    users: {
        id: process.env.APPWRITE_USER_COLLECTION_ID || 'users',
        name: 'Users',
        attributes: [
            { key: 'firstName', type: 'string', size: 255, required: false },
            { key: 'lastName', type: 'string', size: 255, required: false },
            { key: 'email', type: 'string', size: 255, required: true },
            { key: 'address1', type: 'string', size: 255, required: false },
            { key: 'city', type: 'string', size: 255, required: false },
            { key: 'state', type: 'string', size: 255, required: false },
            { key: 'postalCode', type: 'string', size: 50, required: false },
            { key: 'dateOfBirth', type: 'string', size: 50, required: false },
            { key: 'ssn', type: 'string', size: 50, required: false }
        ],
        indexes: [
            { key: 'email_idx', type: 'key', attributes: ['email'] }
        ]
    },
    syncSchedule: {
        id: process.env.APPWRITE_SYNC_COLLECTION_ID || 'sync_schedule',
        name: 'Sync Schedule',
        attributes: [
            { key: 'syncType', type: 'string', size: 50, required: true },
            { key: 'timestamp', type: 'string', size: 50, required: true }
        ],
        indexes: [
            { key: 'sync_type_idx', type: 'key', attributes: ['syncType'] },
            { key: 'created_at_idx', type: 'key', attributes: ['$createdAt'] }
        ]
    },
    rateLimits: {
        id: process.env.APPWRITE_RATE_LIMIT_COLLECTION_ID || 'rate_limits',
        name: 'Rate Limits',
        attributes: [
            { key: 'service', type: 'string', size: 50, required: true },
            { key: 'hitAt', type: 'string', size: 50, required: true },
            { key: 'expiresAt', type: 'string', size: 50, required: true },
            { key: 'resetSeconds', type: 'integer', required: true }
        ],
        indexes: [
            { key: 'service_idx', type: 'key', attributes: ['service'] },
            { key: 'expires_at_idx', type: 'key', attributes: ['expiresAt'] }
        ]
    }
};

async function createAttribute(collectionId, attribute) {
    try {
        switch (attribute.type) {
            case 'string':
                await databases.createStringAttribute(
                    DATABASE_ID,
                    collectionId,
                    attribute.key,
                    attribute.size,
                    attribute.required,
                    attribute.default,
                    attribute.array || false
                );
                break;
            case 'integer':
                await databases.createIntegerAttribute(
                    DATABASE_ID,
                    collectionId,
                    attribute.key,
                    attribute.required,
                    attribute.min,
                    attribute.max,
                    attribute.default,
                    attribute.array || false
                );
                break;
            case 'double':
                await databases.createFloatAttribute(
                    DATABASE_ID,
                    collectionId,
                    attribute.key,
                    attribute.required,
                    attribute.min,
                    attribute.max,
                    attribute.default,
                    attribute.array || false
                );
                break;
            case 'boolean':
                await databases.createBooleanAttribute(
                    DATABASE_ID,
                    collectionId,
                    attribute.key,
                    attribute.required,
                    attribute.default,
                    attribute.array || false
                );
                break;
            default:
                console.warn(`Unknown attribute type: ${attribute.type}`);
        }
        console.log(`✓ Created attribute: ${attribute.key} (${attribute.type})`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`⚠ Attribute ${attribute.key} already exists`);
        } else {
            console.error(`✗ Failed to create attribute ${attribute.key}:`, error.message);
        }
    }
}

async function createIndex(collectionId, index) {
    try {
        await databases.createIndex(
            DATABASE_ID,
            collectionId,
            index.key,
            index.type,
            index.attributes,
            index.orders
        );
        console.log(`✓ Created index: ${index.key}`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`⚠ Index ${index.key} already exists`);
        } else {
            console.error(`✗ Failed to create index ${index.key}:`, error.message);
        }
    }
}

async function createCollection(collectionInfo) {
    try {
        // Try to create the collection
        const collection = await databases.createCollection(
            DATABASE_ID,
            collectionInfo.id,
            collectionInfo.name
        );
        console.log(`✓ Created collection: ${collectionInfo.name} (${collectionInfo.id})`);

        // Wait a bit for collection to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create attributes
        for (const attribute of collectionInfo.attributes) {
            await createAttribute(collectionInfo.id, attribute);
            // Wait between attribute creation
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Wait for attributes to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create indexes
        if (collectionInfo.indexes) {
            for (const index of collectionInfo.indexes) {
                await createIndex(collectionInfo.id, index);
                // Wait between index creation
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return collection;
    } catch (error) {
        if (error.code === 409) {
            console.log(`⚠ Collection ${collectionInfo.name} already exists`);
            
            // Check if we need to add missing attributes or indexes
            try {
                const existingCollection = await databases.getCollection(DATABASE_ID, collectionInfo.id);
                console.log(`📋 Checking attributes for existing collection: ${collectionInfo.name}`);
                
                // Add missing attributes
                for (const attribute of collectionInfo.attributes) {
                    const attributeExists = existingCollection.attributes.some(attr => attr.key === attribute.key);
                    if (!attributeExists) {
                        console.log(`➕ Adding missing attribute: ${attribute.key}`);
                        await createAttribute(collectionInfo.id, attribute);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                // Note: Index checking is more complex and might require listing all indexes
                console.log(`📋 Collection ${collectionInfo.name} verified`);
            } catch (checkError) {
                console.error(`✗ Error checking collection ${collectionInfo.name}:`, checkError.message);
            }
        } else {
            console.error(`✗ Failed to create collection ${collectionInfo.name}:`, error.message);
            throw error;
        }
    }
}

async function verifyDatabase() {
    try {
        await databases.get(DATABASE_ID);
        console.log(`✓ Database ${DATABASE_ID} exists`);
        return true;
    } catch (error) {
        console.error(`✗ Database ${DATABASE_ID} not found:`, error.message);
        console.log('Please create the database in your Appwrite console first.');
        return false;
    }
}

async function main() {
    console.log('🚀 Starting database setup...\n');

    // Verify environment variables
    const requiredEnvVars = [
        'NEXT_PUBLIC_APPWRITE_ENDPOINT',
        'NEXT_PUBLIC_APPWRITE_PROJECT',
        'NEXT_APPWRITE_KEY',
        'APPWRITE_DATABASE_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('✗ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`  - ${varName}`));
        process.exit(1);
    }

    // Verify database exists
    const databaseExists = await verifyDatabase();
    if (!databaseExists) {
        process.exit(1);
    }

    console.log('\n📦 Setting up collections...\n');

    // Create collections
    for (const [name, collectionInfo] of Object.entries(COLLECTIONS)) {
        console.log(`\n--- Setting up ${collectionInfo.name} ---`);
        try {
            await createCollection(collectionInfo);
        } catch (error) {
            console.error(`Failed to setup collection ${collectionInfo.name}:`, error.message);
            // Continue with other collections
        }
    }

    console.log('\n✅ Database setup completed!');
    console.log('\nCollection IDs for your .env.local file:');
    Object.entries(COLLECTIONS).forEach(([name, info]) => {
        const envVar = name === 'transactions' ? 'APPWRITE_TRANSACTION_COLLECTION_ID' :
                      name === 'requisitions' ? 'APPWRITE_REQ_COLLECTION_ID' :
                      name === 'users' ? 'APPWRITE_USER_COLLECTION_ID' :
                      name === 'syncSchedule' ? 'APPWRITE_SYNC_COLLECTION_ID' :
                      name === 'rateLimits' ? 'APPWRITE_RATE_LIMIT_COLLECTION_ID' : '';
        
        if (envVar) {
            console.log(`${envVar}=${info.id}`);
        }
    });

    console.log('\n🎉 Your Spencer finance app database is ready!');
}

// Run the setup
main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
}); 