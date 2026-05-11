export interface PayProIpnPayload {
  orderId: string
  orderStatus: string
  orderStatusId: number
  ipnTypeId: number
  ipnTypeName: string
  customerId: string
  customerEmail: string
  subscriptionId: string | null
  subscriptionStatusId: number | null
  subscriptionNextChargeDate: Date | null
  productId: string
  userId: string | null        // parsed from ORDER_CUSTOM_FIELDS "x-user-id=..."
  totalAmount: string
  testMode: boolean
  hash: string
  signature: string
  rawCustomFields: string      // ORDER_CUSTOM_FIELDS verbatim for audit
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value) return null
  const n = parseInt(value, 10)
  return isNaN(n) ? null : n
}

function parseOptionalDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function parseIpnPayload(body: Record<string, string>): PayProIpnPayload {
  const rawCustomFields = body['ORDER_CUSTOM_FIELDS'] ?? ''

  let userId: string | null = null
  if (rawCustomFields) {
    try {
      const params = new URLSearchParams(rawCustomFields)
      userId = params.get('x-user-id')
    } catch {
      // malformed custom fields — leave userId null
    }
  }

  const testModeRaw = body['TEST_MODE'] ?? ''
  const testMode = testModeRaw === 'true' || testModeRaw === '1'

  const orderStatusIdRaw = body['ORDER_STATUS_ID']
  const orderStatusId = orderStatusIdRaw ? (parseInt(orderStatusIdRaw, 10) || 0) : 0

  const ipnTypeIdRaw = body['IPN_TYPE_ID']
  const ipnTypeId = ipnTypeIdRaw ? (parseInt(ipnTypeIdRaw, 10) || 0) : 0

  return {
    orderId: body['ORDER_ID'] ?? '',
    orderStatus: body['ORDER_STATUS'] ?? '',
    orderStatusId,
    ipnTypeId,
    ipnTypeName: body['IPN_TYPE_NAME'] ?? '',
    customerId: body['CUSTOMER_ID'] ?? '',
    customerEmail: body['CUSTOMER_EMAIL'] ?? '',
    subscriptionId: body['SUBSCRIPTION_ID'] ?? null,
    subscriptionStatusId: parseOptionalInt(body['SUBSCRIPTION_STATUS_ID']),
    subscriptionNextChargeDate: parseOptionalDate(body['SUBSCRIPTION_NEXT_CHARGE_DATE']),
    productId: body['PRODUCT_ID'] ?? '',
    userId,
    totalAmount: body['ORDER_TOTAL_AMOUNT'] ?? '',
    testMode,
    hash: body['HASH'] ?? '',
    signature: body['SIGNATURE'] ?? '',
    rawCustomFields,
  }
}
