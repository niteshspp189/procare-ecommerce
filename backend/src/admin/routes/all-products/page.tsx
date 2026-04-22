import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Text, Button, Input, DropdownMenu, IconButton } from "@medusajs/ui"
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"

export const config = defineRouteConfig({
    label: "All Products",
    nested: "/products",
})

export default function AllProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [sortField, setSortField] = useState<"title" | "created_at" | "updated_at">("title")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)

    const navigate = useNavigate()

    useEffect(() => {
        // Fetch products from the admin API
        fetch(`/admin/products?fields=*categories,*collection,*variants,*variants.prices,*variants.options&limit=100`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setProducts(data.products || [])
                setIsLoading(false)
            })
            .catch((err) => {
                console.error("Error fetching products:", err)
                setIsLoading(false)
            })
    }, [])

    const getPriceRange = (product: any) => {
        if (!product.variants || product.variants.length === 0) return "-"

        // Attempt to find INR prices
        let prices: number[] = []
        for (const variant of product.variants) {
            if (variant.prices) {
                for (const price of variant.prices) {
                    if (price.currency_code === "inr") {
                        prices.push(price.amount)
                    }
                }
            } else if (variant.calculated_price) {
                prices.push(variant.calculated_price)
            }
        }

        if (prices.length === 0) return "-"

        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)

        if (minPrice === maxPrice) {
            return `₹${minPrice.toFixed(2)}`
        }
        return `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`
    }

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products]

        if (search) {
            const q = search.toLowerCase()
            result = result.filter(p => p.title?.toLowerCase().includes(q) || p.handle?.toLowerCase().includes(q))
        }

        if (statusFilter) {
            result = result.filter(p => p.status === statusFilter)
        }

        result.sort((a, b) => {
            let valA = a[sortField] || ""
            let valB = b[sortField] || ""

            if (valA < valB) return sortOrder === "asc" ? -1 : 1
            if (valA > valB) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        return result
    }, [products, search, sortField, sortOrder, statusFilter])

    // Pagination calculations
    const pageCount = Math.ceil(filteredAndSortedProducts.length / pageSize)
    const paginatedProducts = filteredAndSortedProducts.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    )

    // Reset pagination when searching/filtering
    useEffect(() => {
        setCurrentPage(0)
    }, [search, statusFilter, sortField, sortOrder])

    return (
        <div className="flex flex-col gap-y-4">
            <Container className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <Heading level="h1" className="text-2xl font-semibold">Products</Heading>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="small" onClick={() => navigate("/products/export")}>Export</Button>
                        <Button variant="secondary" size="small" onClick={() => navigate("/products/import")}>Import</Button>
                        <Button variant="primary" size="small" onClick={() => navigate("/products/create")}>Create</Button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                            <Button variant="secondary" size="small" className="gap-2 text-ui-fg-subtle">
                                {statusFilter ? `Status: ${statusFilter}` : "Add filter"}
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item onClick={() => setStatusFilter("published")}>Status: published</DropdownMenu.Item>
                            <DropdownMenu.Item onClick={() => setStatusFilter("draft")}>Status: draft</DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item onClick={() => setStatusFilter(null)}>Clear filter</DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                        <div className="w-64">
                            <Input
                                type="search"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenu.Trigger asChild>
                                <IconButton variant="transparent" size="small">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12m-9 6h6" /></svg>
                                </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                <DropdownMenu.Item onClick={() => setSortField("title")}>
                                    {sortField === "title" && "✓ "}Title
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => setSortField("created_at")}>
                                    {sortField === "created_at" && "✓ "}Created
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => setSortField("updated_at")}>
                                    {sortField === "updated_at" && "✓ "}Updated
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item onClick={() => setSortOrder("asc")}>
                                    {sortOrder === "asc" && "✓ "}Ascending
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => setSortOrder("desc")}>
                                    {sortOrder === "desc" && "✓ "}Descending
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>PRODUCT</Table.HeaderCell>
                                <Table.HeaderCell>COLLECTION</Table.HeaderCell>
                                <Table.HeaderCell>CATEGORY</Table.HeaderCell>
                                <Table.HeaderCell>PRICE</Table.HeaderCell>
                                <Table.HeaderCell>VARIANTS</Table.HeaderCell>
                                <Table.HeaderCell>STATUS</Table.HeaderCell>
                                <Table.HeaderCell></Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {isLoading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={7} className="text-center py-8 text-ui-fg-subtle">
                                        Loading products...
                                    </Table.Cell>
                                </Table.Row>
                            ) : paginatedProducts.map((product) => (
                                <Table.Row key={product.id}>
                                    <Table.Cell>
                                        <div
                                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => navigate(`/products/${product.id}`)}
                                        >
                                            {product.thumbnail ? (
                                                <img src={product.thumbnail} alt={product.title} className="w-10 h-10 object-cover rounded-md border" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-md border flex items-center justify-center">?</div>
                                            )}
                                            <div>
                                                <Text className="text-gray-900">{product.title}</Text>
                                                <Text className="text-xs text-ui-fg-subtle">{product.handle}</Text>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="text-ui-fg-subtle">
                                        {product.collection?.title || "-"}
                                    </Table.Cell>
                                    <Table.Cell className="text-ui-fg-subtle">
                                        {product.categories && product.categories.length > 0
                                            ? product.categories.map((c: any) => c.name).join(", ")
                                            : "-"}
                                    </Table.Cell>
                                    <Table.Cell className="text-ui-fg-subtle">
                                        {getPriceRange(product)}
                                    </Table.Cell>
                                    <Table.Cell className="text-ui-fg-subtle">
                                        {product.variants?.length || 0} variant(s)
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2 text-ui-fg-subtle">
                                            <div className={`w-1.5 h-1.5 rounded-full ${product.status === "published" ? "bg-green-500" : "bg-gray-400"}`}></div>
                                            <span className="capitalize">{product.status}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenu.Trigger asChild>
                                                <IconButton variant="transparent" size="small">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                                </IconButton>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content>
                                                <DropdownMenu.Item onClick={() => navigate(`/products/${product.id}`)}>Edit</DropdownMenu.Item>
                                                <DropdownMenu.Item className="text-red-600">Delete</DropdownMenu.Item>
                                            </DropdownMenu.Content>
                                        </DropdownMenu>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                            {!isLoading && paginatedProducts.length === 0 && (
                                <Table.Row>
                                    <Table.Cell colSpan={7} className="text-center py-8 text-ui-fg-subtle">
                                        No products found.
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>

                    {!isLoading && filteredAndSortedProducts.length > 0 && (
                        <div className="flex items-center justify-between border-t px-4 py-4 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Text className="text-xs text-ui-fg-subtle">Per page</Text>
                                    <select
                                        className="text-xs border border-gray-200 rounded p-1 bg-transparent text-ui-fg-subtle outline-none"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value))
                                            setCurrentPage(0)
                                        }}
                                    >
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                        <option value="250">250</option>
                                        <option value="500">500</option>
                                    </select>
                                </div>
                                <Text className="text-xs text-ui-fg-subtle">
                                    {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} results
                                </Text>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="small"
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(c => c - 1)}
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    disabled={currentPage >= pageCount - 1}
                                    onClick={() => setCurrentPage(c => c + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Container>
        </div>
    )
}
