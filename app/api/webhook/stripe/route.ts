import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import {
  checkUserExists,
  updateUserSubscription,
  writeUserDB
} from '@/lib/user.actions';
import { Query } from 'appwrite';
import { createAdminClient } from '@/lib/appwrite';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleCheckoutSessionCompleted(data: Stripe.Event.Data.Object) {
  const session = await stripe.checkout.sessions.retrieve(data.id, {
    expand: ['line_items'],
  });
  const customerId = session.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const email = customer.email;
  const name = customer.name;

  if (!email || !name) {
    console.error('Customer email or name is missing');
  }

  const [firstName, lastName] = name.split(' ');
  const userExists = await checkUserExists(email);

  if (userExists) {
    await updateUserSubscription(email, true);
  } else {
    await writeUserDB(email, firstName, lastName, customerId);
    await updateUserSubscription(email, true);
  }
}

async function handleCustomerSubscriptionDeleted(data: Stripe.Event.Data.Object) {
  const subscription = await stripe.subscriptions.retrieve(data.id);
  const customerId = subscription.customer as string;

  const database = await createAdminClient();
  const userDocument = await database.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_USER_COLLECTION_ID!,
    [Query.equal('userId', customerId)]
  );

  if (userDocument.documents.length === 0) {
    console.error('User not found in database');
    return;
  }

  const email = userDocument.documents[0].email;
  await updateUserSubscription(email, false);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data.object);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(data.object);
        break;
      default:
        console.warn(`Unhandled event type: ${type}`);
    }
  } catch (err) {
    console.error(`Error handling event: ${err.message} | Event Type: ${type}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}