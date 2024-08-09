'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLoggedInUser, getUserDetails } from '@/lib/user.actions';
import { generateGradient } from '@/lib/colourUtils';
import AsyncMyBanks from '@/components/AsyncBankDetails';
import { format } from 'date-fns';


export default function ProfilePage() {
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "", avatarUrl: "", $id: "", $createdAt: "" });
  const [userId, setUserId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getLoggedInUser(); // Pulls the user from the session
      const userData = await getUserDetails(user.$id); // Pulls the user details from the database
      setUser(userData);
      setUserId(userData.userId);
      setEditedUser({ firstName: userData.firstName, lastName: userData.lastName, email: userData.email });
    };
    fetchUser();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Update the user name in the database only if editerUser is different from the current user
    if (editedUser.firstName === user.firstName && editedUser.lastName === user.lastName) {
      setIsEditing(false);
      return;
    }
    try {
      const response = await fetch('/api/editUserName', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          newUserName: `${editedUser.firstName} ${editedUser.lastName}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user name');
      }

      setUser({ ...user, ...editedUser });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUser({ ...editedUser, [e.target.id]: e.target.value });
  };

  const gradientBackground = generateGradient(user.firstName, user.lastName);

  // Inside the ProfilePage component
  const defaultDate = '01 Jan, 1970'; // Default date
  let memberSinceDate;

  try {
    memberSinceDate = format(new Date(user.$createdAt), 'dd MMM, yyyy');
  } catch (error) {
    memberSinceDate = defaultDate;
  }

  return (
    <div className="max-h-screen w-full flex flex-col bg-background mt-4">
      <div className="flex-grow w-full p-4 sm:p-6 lg:p-8 overflow-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20" style={{ background: gradientBackground }}>
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-transparent text-2xl" style={{ background: gradientBackground }}>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl ml-4">{`${user.firstName} ${user.lastName}`}</CardTitle>
                <CardDescription className="ml-4 mt-2 opacity-65">{`Member since: ${memberSinceDate}`}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>

          </CardContent>
        </Card>

        {/*<Tabs defaultValue="personal" className="w-full flex-grow flex flex-col max-h-full h-24">*/}
        <Tabs defaultValue="personal" className="w-full flex-grow flex flex-col max-h-full">
          <TabsList className="flex w-full overflow-x-auto mb-8 h-12">
            <TabsTrigger value="personal" className="flex-1 min-w-max rounded-sm h-10">Personal Information</TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 min-w-max rounded-sm h-10">Billing Information</TabsTrigger>
            <TabsTrigger value="bank" className="flex-1 min-w-max rounded-sm h-10">Bank Information</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="flex-grow">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription className="flex justify-start mt-2 opacity-75">
                        {isEditing ? 'Update your personal information below. Click save when you\'re done.' : 'View your details.'}
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button onClick={handleEdit}>Edit Profile</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={isEditing ? editedUser.firstName : user.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={isEditing ? editedUser.lastName : user.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                    />
                  </div>
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button onClick={handleSave}>Save changes</Button>
                  </CardFooter>
                )}
              </Card>
          </TabsContent>
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  {/* Add billing information description here */}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Add billing information fields here */}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>Bank Information</CardTitle>
                <CardDescription>
                  View your connected bank accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="-mt-2">
                <AsyncMyBanks />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}