import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpWithEmail } from '@/lib/user.actions';
import SignInWithGoogleButton from '@/components/buttons/SignInWithGoogleButton';

export function SignUpForm() {
    return (
        <Card className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
            <CardHeader>
                <CardTitle className="text-xl">Sign Up</CardTitle>
                <CardDescription>
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action="">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first-name">First name</Label>
                                <Input
                                    name="first-name"
                                    id="first-name"
                                    placeholder="Max"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last-name">Last name</Label>
                                <Input
                                    name="last-name"
                                    id="last-name"
                                    placeholder="Robinson"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                name="email"
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input name="password" id="password" type="password"/>
                        </div>
                        <Button formAction={signUpWithEmail} type="submit" className="w-full">
                            Create an account
                        </Button>
                        <SignInWithGoogleButton type="sign-up"/>
                    </div>
                </form>
                <div className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                        Sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}