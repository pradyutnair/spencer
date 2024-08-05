// In `app/%28root%29/profile/page.tsx`
'use client';
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getLoggedInUser } from '@/lib/user.actions';

export default function ProfilePage() {
  const [user, setUser] = useState({ name: "", email: "", avatarUrl: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: "", email: "" });

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getLoggedInUser();
      setUser(userData);
      setEditedUser({ name: userData.name, email: userData.email });
    };
    fetchUser();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setUser({ ...user, ...editedUser });
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUser({ ...editedUser, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="w-full max-w-4xl p-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isEditing && (
              <Button onClick={handleEdit}>Edit Profile</Button>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="flex w-full overflow-x-auto mb-8">
            <TabsTrigger value="personal" className="flex-1 min-w-max rounded-sm">Personal Information</TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 min-w-max rounded-sm">Billing Information</TabsTrigger>
            <TabsTrigger value="bank" className="flex-1 min-w-max rounded-sm">Bank Information</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" >
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Update your personal information here. Click save when you're done." : "Your personal information."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={isEditing ? editedUser.name : user.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={isEditing ? editedUser.email : user.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
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
                  {/* Add bank information description here */}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Add bank information fields here */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}