import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button, Textarea, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { ChatBubbleLeftRight } from "@medusajs/icons"

const TicketsPage = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [reply, setReply] = useState("")
  const [status, setStatus] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/admin/support-tickets", {
        credentials: "include",
      })
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (e) {
      console.error("Failed to fetch tickets", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleUpdate = async () => {
    if (!selectedTicket) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/admin/support-tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_reply: reply,
          status: status || selectedTicket.status
        }),
        credentials: "include",
      })
      
      if (response.ok) {
        await fetchTickets()
        setSelectedTicket(null)
        setReply("")
        setStatus("")
      }
    } catch (e) {
      console.error("Failed to update ticket", e)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="py-8">
        <div className="flex items-center justify-between mb-8">
          <Heading level="h1">Support Tickets</Heading>
          <Button variant="secondary" size="small" onClick={fetchTickets}>Refresh</Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Customer ID</Table.HeaderCell>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell className="text-center py-12">Loading tickets...</Table.Cell>
                </Table.Row>
              ) : tickets.length === 0 ? (
                  <Table.Row>
                    <Table.Cell className="text-center py-12">No tickets found.</Table.Cell>
                  </Table.Row>
              ) : tickets.map((ticket: any) => (
                <Table.Row key={ticket.id}>
                  <Table.Cell className="font-bold">{ticket.display_id}</Table.Cell>
                  <Table.Cell className="text-[10px] text-ui-fg-subtle">{ticket.customer_id}</Table.Cell>
                  <Table.Cell>{ticket.subject}</Table.Cell>
                  <Table.Cell>
                    <Badge color={ticket.status === "resolved" ? "green" : ticket.status === "in_progress" ? "orange" : "blue"}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle text-xs">{new Date(ticket.created_at).toLocaleDateString()}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={() => {
                        setSelectedTicket(ticket)
                        setReply(ticket.admin_reply || "")
                        setStatus(ticket.status)
                      }}
                    >
                      Manage
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Container>

      {selectedTicket && (
        <Container className="py-8">
          <div className="flex items-center justify-between mb-8">
            <Heading level="h2">Manage Ticket: {selectedTicket.display_id}</Heading>
            <Button variant="transparent" size="small" onClick={() => setSelectedTicket(null)}>Close</Button>
          </div>
          
          <div className="flex flex-col gap-y-6 max-w-2xl">
            <div className="bg-ui-bg-subtle p-6 rounded-xl border border-ui-border-base">
              <Heading level="h3" className="mb-2">{selectedTicket.subject}</Heading>
              <Text className="text-ui-fg-subtle italic whitespace-pre-wrap">
                "{selectedTicket.message}"
              </Text>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-y-2">
                <Text size="small" weight="plus" className="text-ui-fg-subtle uppercase tracking-wider">Update Status</Text>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-ui-bg-base border border-ui-border-base rounded-md p-3 text-ui-fg-base outline-none focus:border-ui-border-interactive transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="flex flex-col gap-y-2">
                <Text size="small" weight="plus" className="text-ui-fg-subtle uppercase tracking-wider">Admin Reply / Resolution</Text>
                <Textarea 
                  placeholder="Provide an update or resolution to the customer..." 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={6}
                  className="bg-ui-bg-base border border-ui-border-base rounded-md p-3 text-ui-fg-base"
                />
              </div>
            </div>

            <div className="flex items-center gap-x-3 pt-4 border-t border-ui-border-base">
              <Button 
                variant="primary" 
                onClick={handleUpdate} 
                isLoading={isUpdating}
                className="px-8"
              >
                Save Changes
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setSelectedTicket(null)}
                className="px-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Support Tickets",
  icon: ChatBubbleLeftRight,
})

export default TicketsPage
