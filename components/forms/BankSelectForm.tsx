"use client"

import {FormEvent, useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {Loader2} from "lucide-react";

export default function SelectBankForm() {
    const [institutions, setInstitutions] = useState([])
    const [selectedInstitution, setSelectedInstitution] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Retrieve institutions from localStorage
        const institutionsData = localStorage.getItem('institutions')
        if (institutionsData) {
            const parsedInstitutions = JSON.parse(institutionsData)
            parsedInstitutions.sort((a: any, b: any) => a.name.localeCompare(b.name))
            setInstitutions(parsedInstitutions)
        } else {
            // If institutions are not available in localStorage, redirect to the select country page
            router.push('/select-country')
        }
    }, [])

    const handleInstitutionChange = (value: string) => {
        const institution = institutions.find((inst: any) => inst.id === value)
        setSelectedInstitution(institution)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!selectedInstitution) {
            setError("Please select a bank.")
            return
        }
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/endUserAgreement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    institutionId: selectedInstitution.id,
                    logo: selectedInstitution.logo
                })
            })

            if (!response.ok) {
                throw new Error('Network response was not ok')
            }

            const data = await response.json()
            console.log('Initialization data:', data)

            // Redirect to the agreement link
            if (data.link) router.push(data.link)


        } catch (error) {
            console.error('Initialization error:', error)
            setError('Failed to initialize session. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    return (
      <div>
        <Card className="mx-auto w-[350px]">
            <CardHeader>
                <CardTitle className="text-lg text-center">Select Bank</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Select onValueChange={handleInstitutionChange} defaultValue={selectedInstitution?.id}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select your bank" />
                                </SelectTrigger>
                                <SelectContent className="shadow-lg border border-gray-200 rounded-md bg-white divide-y divide-gray-200 w-full
                                overflow-y-auto p-2 max-h-72">
                                    {institutions.map((institution: any) => (
                                        <SelectItem value={institution.id} key={institution.id} className="py-2 px-4">
                                            <div className="flex items-center">
                                                <img
                                                    src={institution.logo}
                                                    alt={institution.name}
                                                    className="inline-block w-7 h-7 mr-2"
                                                />
                                                <span className="font-inter text-sm px-4">{institution.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mb-4"></div>
                        {error && <div className="text-red-600 text-center">{error}</div>}
                        <Button
                            type="submit"
                            className="w-full text-zinc-950  hover:bg-zinc-950 hover:text-white disabled:opacity-50 bg-white mt-6"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                'Submit'
                            )}
                        </Button>
                        {/*Create a button that redirects the user to the /select-country page*/}
                        <Button
                          onClick={() => router.push('/select-country')}
                          className="w-full text-zinc-950 hover:text-red-500 hover:border-2 hover:bg-white disabled:opacity-50 bg-white mt-2 mb-8"
                        >
                            Back
                        </Button>
                    </div>
                </form>
            </CardContent>


        </Card>

      </div>
    )
}
