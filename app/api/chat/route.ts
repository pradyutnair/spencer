import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  findSpecificTransaction,
  getCategoryTotalWithinTimeFrame,
  getPredictedExpenditureUsingRegression,
  summarizeTransactions
} from '@/lib/chat-functions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { userInput, transactions } = await request.json();
    const currentDateTime = new Date().toISOString();

    // Define the function
    const functions = [
      {
        name: 'getCategoryTotalWithinTimeFrame',
        description: 'Get the total amount spent in a specific category within a given time frame. Call this function if the user asks for the total expenditure in a specific category over a period.',
        parameters: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              description: 'The list of transactions',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  bookingDate: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                },
              },
            },
            category: {
              type: 'string',
              description: 'The category to filter transactions by',
            },
            startDate: {
              type: 'string',
              description: 'The start date of the time frame (in YYYY-MM-DD format)',
            },
            endDate: {
              type: 'string',
              description: 'The end date of the time frame (in YYYY-MM-DD format)',
            },
          },
          required: ['transactions', 'category', 'startDate', 'endDate'],
        },
      },
      {
        name: 'findSpecificTransaction',
        description: `Find a specific transaction by payee and booking date. Call it if asked for details of a particular transaction or if the user asks what they have spent on a particular date (without any payee information). Remember that if the user provides relative dates like "yesterday", "two days ago", "last Monday", etc., 
        you must first convert that to an exact date relative to ${currentDateTime} and then pass that as an argument. If the user mentions relative time periods such as 'last month', 'last week', etc., then you must convert that to a startDate and endDate relative to ${currentDateTime} and then pass them as an arguments.`,
        parameters: {
          type: 'object',
          properties: {
            Payee: {
              type: 'string',
              description: 'The payee to filter transactions by'
            },
            bookingDate: {
              type: 'string',
              description: 'The booking date to filter transactions by (in YYYY-MM-DD format). Use this if you are looking for transactions on a specific date.'
            },
            startDate: {
              type: 'string',
              description: 'The start date of the range to filter transactions by (in YYYY-MM-DD format). Use this if you are looking for transactions within a date range.'
            },
            endDate: {
              type: 'string',
              description: 'The end date of the range to filter transactions by (in YYYY-MM-DD format). Use this if you are looking for transactions within a date range.'
            }
          },
          required: ['bookingDate'],
          optional: ['startDate', 'endDate', 'Payee']
        }
      },
      {
        name: 'getPredictedExpenditureUsingRegression',
        description: 'Predict the total expenditure for the current month using linear regression on daily spending data. Call this function if the user asks for the predicted expenditure for the current month.',
        parameters: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              description: 'The list of transactions',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  bookingDate: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                },
              },
            },
          },
        },
      },
      {
        name: 'summarizeTransactions',
        description: 'Summarize transaction data based on various filters and options. Call this function to get a summary, total, or detailed information about transactions.',
        parameters: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              description: 'The list of transactions to analyze.',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  transactionId: { type: 'string' },
                  amount: { type: 'number' },
                  bookingDate: { type: 'string' }, // Date in YYYY-MM-DD format
                  description: { type: 'string' },
                  category: { type: 'string' },
                  payee: { type: 'string' },
                },
              },
            },
            filterCategory: {
              type: 'string',
              description: 'Filter transactions by a specific category (optional).',
            },
            filterPayee: {
              type: 'string',
              description: 'Filter transactions by a specific payee (optional).',
            },
            filterStartDate: {
              type: 'string',
              description: 'Filter transactions by a start date (YYYY-MM-DD format, optional).',
            },
            filterEndDate: {
              type: 'string',
              description: 'Filter transactions by an end date (YYYY-MM-DD format, optional).',
            },
            minAmount: {
              type: 'number',
              description: 'Filter transactions with an amount greater than or equal to this value (optional).',
            },
            maxAmount: {
              type: 'number',
              description: 'Filter transactions with an amount less than or equal to this value (optional).',
            },
            summaryType: {
              type: 'string',
              enum: ['total', 'average', 'largest', 'smallest', 'count', 'detailed'],
              description: 'The type of summary or information requested: total, average, largest, smallest, count, or detailed.',
            },
          },
          required: ['transactions'],
        },
      }
    ];

    // Initial AI call to determine which function to use
    const initialResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a helpful assistant that answers questions about financial transactions. The current date is ${currentDateTime}.` },
        { role: 'user', content: userInput },
      ],
      functions,
      function_call: 'auto', // auto or explicitly call a function
    });

    const functionCall = initialResponse.choices[0]?.message?.function_call;

    let result;
    if (functionCall) {
      const parameters = JSON.parse(functionCall.arguments);
      console.log('Function call:', functionCall.name, 'with parameters:', parameters);

      // Execute the relevant function
      switch (functionCall.name) {
        case 'getCategoryTotalWithinTimeFrame':
          result = getCategoryTotalWithinTimeFrame(transactions, parameters.category, parameters.startDate, parameters.endDate);
          break;
        case 'findSpecificTransaction':
          result = findSpecificTransaction(transactions, parameters.bookingDate, parameters.startDate, parameters.endDate, parameters.Payee);
          break;
        case 'getPredictedExpenditureUsingRegression':
          result = getPredictedExpenditureUsingRegression(transactions);
          break;
        case 'summarizeTransactions':
          result = summarizeTransactions(transactions, parameters);
          break;
      }

      // Create a human-like response
      const humanLikeResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful assistant that provides detailed and conversational responses based on transaction data.` },
          { role: 'user', content: `Here is the information: ${result}. Generate a summarised concise human-like non-verbose response based on this information. ` },
        ],
      });

      return NextResponse.json({ message: humanLikeResponse.choices[0]?.message?.content || 'Sorry, I could not generate an answer.' });
    }

    // Fallback response if no function call was made
    return NextResponse.json({ message: 'Sorry, I could not determine the required information.' });

  } catch (error) {
    console.error('Error getting response from OpenAI:', error);
    return NextResponse.json({ error: 'Failed to get response from OpenAI' }, { status: 500 });
  }
}
