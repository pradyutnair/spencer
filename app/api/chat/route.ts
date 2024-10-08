import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  findSpecificTransaction,
  getCategoryTotalWithinTimeFrame,
  getExpenseRate,
  getPredictedExpenditureUsingRegression,
  summarizeTransactions
} from '@/lib/chat-functions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
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
          required: ['category', 'startDate', 'endDate'],
        },
      },
      {
        name: 'findSpecificTransaction',
        description: `Find a specific transaction by payee and booking date. Call it if asked for details of a particular transaction or if the user asks what they have spent on a particular date (without any payee information). Remember that if the user provides relative dates like "yesterday", "two days ago", "last Monday", etc., 
        you must first convert that to an exact date relative to ${currentDateTime} and then pass that as an argument. If the user mentions relative time periods such as 'last month', 'last week', 'this month' etc., then you must convert that to a startDate and endDate relative to ${currentDateTime} and then pass them as an arguments.
        If the user does not provide a clear date range, set the startDate to '2021-07-01' and endDate to the current date.`,
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
        description: 'Predict the total expenditure. Call this function if the user asks for the predicted expenditure for the current month.',
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
        name: 'getExpenseRate',
        description: `Calculate the expense (average daily spend) rate for a given date range. Call this if the user asks for expense rate. The current date is ${currentDateTime}. If no date range is provided, set the startDate to the first of the current month and endDate to the last day of the current month. `,
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
            startDate: {
              type: 'string',
              description: 'The start date of the date range (in YYYY-MM-DD format). Optional; defaults to the start of the current month.',
              nullable: true,
            },
            endDate: {
              type: 'string',
              description: 'The end date of the date range (in YYYY-MM-DD format). Optional; defaults to the end of the current month.',
              nullable: true,
            },
          },
          required: ['transactions'],
        },
      },
      {
        name: 'summarizeTransactions',
        description: `Summarize transaction data based on various filters and options. Call this function if the user asks for a summary, total, or list information about transactions. If the user asks for recent transactions, use the past week as the date range. The current date is ${currentDateTime}`,
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
        },
      }
    ];

    // Initial AI call to determine which function to use
    const initialResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a helpful assistant named Nexpass that answers questions about financial transactions. The current date is ${currentDateTime}. Do not answer questions about anything else apart from transaction data. Be friendly and respond to greetings but if the question is not about personal finances, reply "I am a personal finance assistant, I cannot help you with your query."` },
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
        case 'getExpenseRate':
          result = getExpenseRate(transactions, parameters.startDate, parameters.endDate);
          break;
      }

      // Create a human-like response
      const humanLikeResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a helpful assistant that provides conversational responses based on transaction data.` },
          { role: 'user', content: `Here is the information: ${result}. Generate a summarised concise human-like non-verbose response based on this information. ` },
        ],
      });

      return NextResponse.json({ message: humanLikeResponse.choices[0]?.message?.content || 'Sorry, I could not generate an answer.' });
    }

    // Otherwise, return the initial response
    return NextResponse.json({ message: initialResponse.choices[0]?.message?.content || 'Sorry, I could not generate an answer.' });

  } catch (error) {
    console.error('Error getting response from OpenAI:', error);
    return NextResponse.json({ message: 'Sorry, I encountered an error while processing your request.' });
  }
}
