export const formatDate = (date: string | number | Date) => {
  const d = new Date(date)
  const day = d.getDate()
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()
  
  return `${day}-${month}-${year}`
}

export const formatOrderDisplayId = (displayId: string | number) => {
  const idStr = displayId.toString()
  const paddedId = idStr.padStart(8, "0")
  return `OD${paddedId}`
}
