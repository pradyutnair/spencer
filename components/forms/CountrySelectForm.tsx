"use client"

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import europeanCountries from '@/lib/europeanCountries'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const FormSchema = {
    country: "",
}

export function SelectCountryForm() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState(FormSchema)
    const router = useRouter()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const form = new FormData(event.currentTarget as HTMLFormElement)
        form.append("country", formData.country)

        // Save country to localStorage
        localStorage.setItem('country', formData.country)
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
            localStorage.setItem('institutions', JSON.stringify(data))
            router.push('/select-bank')

        } catch (err) {
            setError('Submission failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCountryChange = (value: string) => {
        setFormData({ ...formData, country: value })
        setOpen(false)  // Close the Popover after selection
    }

    return (
      <Card className="mx-auto w-[350px]">
          <CardHeader>
              <CardTitle className="text-lg text-center">Select Country</CardTitle>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4">
                      <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className={cn(
                                  "w-full justify-between",
                                  !formData.country && "text-muted-foreground"
                                )}
                              >
                                  {formData.country ? (
                                    <div className="flex items-center">
                                        <img
                                          src={europeanCountries.find(c => c.code === formData.country)?.flag}
                                          alt={europeanCountries.find(c => c.code === formData.country)?.name}
                                          className="inline-block w-7 h-5 mr-2"
                                        />
                                        <span>{europeanCountries.find(c => c.code === formData.country)?.name}</span>
                                    </div>
                                  ) : (
                                    "Select your bank's country"
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0 max-h-[300px] overflow-hidden">
                              <Command>
                                  <CommandInput placeholder="Search country..." />
                                  <CommandEmpty>No country found.</CommandEmpty>
                                  <CommandGroup className="overflow-auto max-h-[320px]" style={{ scrollbarWidth: 'thin' }}>
                                      {europeanCountries.map((country) => (
                                        <CommandItem
                                          key={country.code}
                                          value={country.name}
                                          onSelect={() => handleCountryChange(country.code)}
                                        >
                                            <div className="flex items-center">
                                                <img
                                                  src={country.flag}
                                                  alt={country.name}
                                                  className="inline-block w-7 h-5 mr-2"
                                                />
                                                <span>{country.name}</span>
                                            </div>
                                            <Check
                                              className={cn(
                                                "ml-auto h-4 w-4",
                                                country.code === formData.country ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                              </Command>
                          </PopoverContent>
                      </Popover>

                      {error && <p className="text-red-500">{error}</p>}
                      <div className="mb-4"> </div>

                      <Button
                        type="submit"
                        className="w-full text-zinc-950 hover:bg-zinc-900 hover:text-white disabled:opacity-50 bg-white"
                        disabled={loading}
                      >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            'Submit'
                          )}
                      </Button>
                      <Button
                        type="button"
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