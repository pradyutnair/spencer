import React, { useState, useRef, useEffect } from 'react';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getLoggedInUser, getUserDetails } from '@/lib/user.actions';
import { generateGradient } from '@/lib/colourUtils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatComponent() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState({ name: '', email: '', image: '' });

  const { transactions } = useTransactionStore();

  const handleSubmit = async (input: string) => {
    if (!input.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', content: input };
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: input,
          transactions,
        }),
      });

      const data = await response.json();

      const aiMessage: ChatMessage = { role: 'assistant', content: data.message };
      setChatHistory(prevHistory => [...prevHistory, aiMessage]);
    } catch (error) {
      console.error('Error getting response from OpenAI:', error);
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error while processing your request.' };
      setChatHistory(prevHistory => [...prevHistory, errorMessage]);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getLoggedInUser();
      const userData = await getUserDetails(user.$id);
      const firstName = userData.firstName;
      const lastName = userData.lastName;
      setUser({
        name: `${firstName} ${lastName}`,
        email: userData.email,
        image: userData.avatarUrl,
      });
    };
    fetchUser();
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(userInput);
    setUserInput('');
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(question);
  };

  const handleReset = () => {
    setChatHistory([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e as unknown as React.FormEvent);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const gradientBackground = generateGradient(user.name.split(' ')[0], user.name.split(' ')[1]);

  return (
    <Card className="max-w-xl rounded-2xl w-full mx-auto flex flex-col h-96 relative bg-zinc-30 from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assistant</CardTitle>
        </div>
      </CardHeader>
      <div className="absolute top-3 right-3">
        <Button variant="ghost" onClick={handleReset} aria-label="Reset chat" className="p-1">
          <ResetIcon className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
      <CardContent className="p-4 flex-grow overflow-y-auto" ref={chatContainerRef}>
        {chatHistory.map((message, index) => (
          <div key={index} className="flex items-start gap-4 mb-4">
            <Avatar className={message.role === 'user' ? "h-9 w-9" : "w-9 h-9"} style={message.role === 'user' ? { background: gradientBackground } : {}}>
              {message.role === 'user' ? (
                <>
                  <AvatarImage src={user.image ?? ''} alt={user.name ?? ''} className="bg-transparent " />
                  <AvatarFallback className="bg-transparent" style={{ background: gradientBackground }}>
                    {user.name ? user.name.split(' ').map(n => n[0]).join('') : ''}
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src="/icons/logo-v1.svg" />
                  <AvatarFallback>AI</AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="grid gap-1 items-start text-sm">
              <div className={`prose ${message.role === 'user' ? 'text-muted-foreground' : ''}`}>
                <p>{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <form onSubmit={handleFormSubmit} className="p-4 border-gray-200 dark:border-gray-700">
        {chatHistory.length === 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap no-scrollbar" onMouseDown={handleMouseDown}>
            <Button
              variant="ghost"
              className="bg-muted/50 hover:bg-muted rounded-md px-4 py-2 shadow-sm"
              onClick={() => handleSuggestedQuestion("How much did I spend on Groceries between 1st and 7th of August 2024")}
            >
              How much did I spend on Groceries between 1st and 7th of August 2024?
            </Button>
            <Button
              variant="ghost"
              className="bg-muted/50 hover:bg-muted rounded-md px-4 py-2 shadow-sm"
              onClick={() => handleSuggestedQuestion("Find a transaction from Openai on the 2nd of August 2024")}
            >
              Find a transaction from Openai on the 2nd of August 2024
            </Button>
            <Button
              variant="ghost"
              className="bg-muted/50 hover:bg-muted rounded-md px-4 py-2 shadow-sm"
              onClick={() => handleSuggestedQuestion("List my recent transactions")}
            >
              List my recent transactions
            </Button>
          </div>
        )}
        <div className="relative">
          <Textarea
            placeholder="Ask Compass a question"
            name="message"
            id="message"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="min-h-[48px] rounded-2xl resize-none p-4 border border-neutral-400 shadow-sm pr-16"
          />
          <Button type="submit" size="icon" className="absolute w-8 h-8 top-3 right-3" disabled={!userInput.trim()}>
            <ArrowUpIcon className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </Card>
  );

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    let startX = e.pageX - container.offsetLeft;
    let scrollLeft = container.scrollLeft;

    const onMouseMove = (e: MouseEvent) => {
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // scroll-fast
      container.scrollLeft = scrollLeft - walk;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}

function ArrowUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function ResetIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}