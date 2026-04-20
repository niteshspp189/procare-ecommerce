"use client"

import React, { useState } from "react"
import { Input, Text, Button } from "@medusajs/ui"

export default function EnquiryForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert(`Thank you ${formData.name}! Your enquiry has been sent. Our team will contact you soon.`)
        setFormData({ name: "", email: "", subject: "", message: "" })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl animate-fade-in-up">
            <h3 className="text-2xl font-black uppercase mb-6 tracking-tight">Send An Enquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest pl-1">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your Full Name"
                            className="w-full bg-[#f9f9f9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest pl-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            className="w-full bg-[#f9f9f9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest pl-1">Subject</label>
                        <input
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="How can we help?"
                            className="w-full bg-[#f9f9f9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest pl-1">Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Your message details..."
                            rows={4}
                            className="w-full bg-[#f9f9f9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest text-xs shadow-lg transform active:scale-[0.98]"
                >
                    Send Message
                </button>
            </form>
        </div>
    )
}
