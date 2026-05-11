/**
 * lib/deliveryDate.ts
 *
 * HCI Principle 3 — Visibility:
 * Instead of "Delivers in 3 days", show "Arrives Friday 2 May".
 * Real dates are more meaningful and easier to plan around.
 *
 * Logic:
 * - Counts only working days (Monday–Saturday)
 * - Skips Sunday (no deliveries in Uganda)
 * - Returns a human-readable string with day name + date
 *
 * Examples:
 *   deliveryDate(1) → "Arrives Tomorrow, Tue 29 Apr"
 *   deliveryDate(2) → "Arrives Wed 30 Apr"
 *   deliveryDate(3) → "Arrives Fri 2 May"
 */

export function getDeliveryDate(workingDays: number): string {
  if (!workingDays || workingDays <= 0) return ''

  const today = new Date()
  let daysAdded = 0
  const date = new Date(today)

  while (daysAdded < workingDays) {
    date.setDate(date.getDate() + 1)
    // Skip Sunday (0) — no Racks deliveries on Sunday
    if (date.getDay() !== 0) {
      daysAdded++
    }
  }

  const day  = date.toLocaleDateString('en-UG', { weekday:'short' })
  const d    = date.getDate()
  const mon  = date.toLocaleDateString('en-UG', { month:'short' })

  // Special case: 1 working day = tomorrow (cleaner)
  if (workingDays === 1) {
    return `Tomorrow, ${day} ${d} ${mon}`
  }

  return `${day} ${d} ${mon}`
}

export function getDeliveryLabel(workingDays: number, fee: number, freeAbove: number, orderTotal: number): string {
  const dateStr   = getDeliveryDate(workingDays)
  const isFree    = fee === 0 || (freeAbove > 0 && orderTotal >= freeAbove)
  const feeStr    = isFree ? 'FREE delivery' : `UGX ${fee.toLocaleString()} delivery`

  return `Arrives ${dateStr} · ${feeStr}`
}
