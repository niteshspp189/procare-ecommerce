"use client"

import { Button, Input, Text, Textarea, clx } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Support = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const searchParams = useSearchParams()
  const orderIdFromQuery = searchParams.get("order_id")
  
  const [selectedOrder, setSelectedOrder] = useState<string>(orderIdFromQuery || "")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/support/tickets")
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (e) {
      console.error("Failed to fetch tickets", e)
    } finally {
      setIsLoadingTickets(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (orderIdFromQuery) {
      setSelectedOrder(orderIdFromQuery)
      setIsSubmitted(false) // Reset if coming from a "Raise Complaint" button again
    }
  }, [orderIdFromQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          order_id: selectedOrder,
        }),
      })
      
      if (response.ok) {
        setIsSubmitted(true)
        setSubject("")
        setMessage("")
        fetchTickets() // Refresh history
      }
    } catch (e) {
      console.error("Failed to submit ticket", e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-y-12">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl-semi mb-2">Help & Support</h1>
          <Text className="text-ui-fg-subtle">
            Have an issue with an order? Raise a complaint and our team will help you resolve it.
          </Text>
        </div>

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-green-50 rounded-2xl border border-green-100 animate-in fade-in zoom-in duration-500">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Registered</h2>
            <p className="text-gray-600 max-w-md">
              Thank you for reaching out. Your ticket has been created successfully. Our support team will get back to you via email within 24-48 hours.
            </p>
            <Button 
              variant="secondary" 
              className="mt-8 !rounded-full px-8"
              onClick={() => setIsSubmitted(false)}
            >
              Create another ticket
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
            <div className="flex flex-col gap-y-2">
              <label className="text-small-regular font-bold uppercase text-ui-fg-subtle">
                Select Order (Optional)
              </label>
              <select 
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 text-small-regular shadow-buttons-neutral transition-colors focus:border-ui-border-interactive focus:outline-none"
              >
                <option value="">No specific order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order OD{(order.display_id || "").toString().padStart(8, '0')} - {new Date(order.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-small-regular font-bold uppercase text-ui-fg-subtle">
                Subject
              </label>
              <Input 
                placeholder="e.g., Damaged item, Late delivery" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-small-regular font-bold uppercase text-ui-fg-subtle">
                Message
              </label>
              <Textarea 
                placeholder="Please describe your issue in detail..." 
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="w-full !bg-[#00b5a4] !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full py-6 text-lg font-bold shadow-lg shadow-green-100"
            >
              Submit Complaint
            </Button>
          </form>
        )}
      </div>

      <div className="w-full">
        <h2 className="text-xl-semi mb-6">Your Ticket History</h2>
        {isLoadingTickets ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00b5a4]"></div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 font-bold text-small-regular uppercase text-ui-fg-subtle">Ticket ID</th>
                  <th className="py-4 font-bold text-small-regular uppercase text-ui-fg-subtle">Subject</th>
                  <th className="py-4 font-bold text-small-regular uppercase text-ui-fg-subtle">Status</th>
                  <th className="py-4 font-bold text-small-regular uppercase text-ui-fg-subtle">Date</th>
                  <th className="py-4 font-bold text-small-regular uppercase text-ui-fg-subtle">Admin Reply</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-bold">{ticket.display_id}</td>
                    <td className="py-4">{ticket.subject}</td>
                    <td className="py-4">
                      <span className={clx("px-3 py-1 rounded-full text-[10px] font-bold uppercase", {
                        "bg-blue-100 text-blue-700": ticket.status === "open",
                        "bg-orange-100 text-orange-700": ticket.status === "in_progress",
                        "bg-green-100 text-green-700": ticket.status === "resolved",
                      })}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 text-ui-fg-subtle">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td className="py-4 italic text-ui-fg-subtle">
                      {ticket.admin_reply || "Awaiting response..."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Text className="text-ui-fg-subtle">No ticket history found.</Text>
          </div>
        )}
      </div>

      <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-100 max-w-2xl">
        <h3 className="font-bold mb-2">Other ways to reach us</h3>
        <p className="text-small-regular text-ui-fg-subtle mb-4">
          Our customer desk is available Mon-Sat, 10 AM - 6 PM.
        </p>
        <div className="flex flex-col gap-y-2 text-small-regular">
          <div className="flex items-center gap-x-2">
            <span className="font-bold">Email:</span> support@procare.com
          </div>
          <div className="flex items-center gap-x-2">
            <span className="font-bold">WhatsApp:</span> +91 99999 99999
          </div>
        </div>
      </div>
    </div>
  )
}

export default Support
