// lib/gocardless.ts

import NordigenClient from 'nordigen-node';

const { GOCARDLESS_SECRET_ID, GOCARDLESS_SECRET_KEY } = process.env;

export async function createGoCardlessClient() {
    try {
        return new NordigenClient({
            secretId: GOCARDLESS_SECRET_ID,
            secretKey: GOCARDLESS_SECRET_KEY
        });

    } catch (error) {
        console.error('Error:', error);
        throw error; // propagate the error to the caller
    }
}
