"use client"

import React, { useState } from "react"

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
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/80">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 tracking-tight">Send an Enquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider pl-1">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your Full Name"
                            className="w-full bg-slate-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm text-gray-800 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider pl-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            className="w-full bg-slate-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm text-gray-800 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider pl-1">Subject</label>
                        <input
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="How can we help?"
                            className="w-full bg-slate-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm text-gray-800 focus:bg-white outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider pl-1">Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Your message details..."
                            rows={4}
                            className="w-full bg-slate-50 border border-gray-200 focus:border-black rounded-xl px-4 py-3 text-sm text-gray-800 focus:bg-white outline-none transition-all resize-none"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#0bb799] text-white font-semibold py-3.5 rounded-xl hover:bg-[#099980] transition-all tracking-wide text-xs uppercase shadow-md shadow-[#0bb799]/20 transform active:scale-[0.98]"
                >
                    Send Message
                </button>
            </form>
        </div>
    )
}
