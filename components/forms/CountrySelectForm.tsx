"use client"

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import europeanCountries from '@/lib/europeanCountries'

const FormSchema = {
    country: "",
}

export function SelectCountryForm() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState(FormSchema)
    const router = useRouter()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const form = new FormData(event.currentTarget as HTMLFormElement)
        form.append("country", formData.country)
        const jsonData = Object.fromEntries(form.entries())

        try {
            const response = await fetch('/api/getInstitutions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            })

            if (!response.ok) {
                throw new Error('Network response was not ok')
            }

            const data = await response.json()

            // Store the data in localStorage
            localStorage.setItem('institutions', JSON.stringify(data))

            // Redirect to the select-bank page
            router.push('/select-bank')

        } catch (err) {
            setError('Submission failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCountryChange = (value: string) => {
        setFormData({ ...formData, country: value })
    }

    return (
        <Card className="mx-auto w-[350px]">
            <CardHeader>
                <CardTitle className="text-lg">Select Country</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Select onValueChange={handleCountryChange} defaultValue={formData.country}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your bank's country" className="opacity-75" />
                                </SelectTrigger>
                                <SelectContent className="shadow-lg border border-gray-200 rounded-md divide-y
                                 divide-gray-200 w-full overflow-y-auto p-2 space-y-4 max-h-72">
                                    {europeanCountries.map((country) => (
                                        <SelectItem value={country.code} key={country.code}>
                                            <div className="flex items-center">
                                                <img
                                                    src={country.flag}
                                                    alt={country.name}
                                                    className="inline-block w-7 h-5 mr-2"
                                                />
                                                <span className="font-inter px-6 text-sm">{country.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {error && <p className="text-red-500">{error}</p>}
                        <div className="mb-4"> </div>

                        <Button
                            type="submit"
                            className="w-full text-zinc-950  hover:bg-zinc-900 hover:text-white disabled:opacity-50 bg-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                'Submit'
                            )}
                        </Button>
                        <Button
                          type="button" // Add this line
                          onClick={() => router.push('/my-banks')}
                          className="w-full text-zinc-950 hover:text-red-500 hover:border-2 hover:bg-white disabled:opacity-50 bg-white mt-2 mb-8"
                        >
                            Back
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}