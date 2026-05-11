import { createHash, timingSafeEqual } from 'crypto'
import { isSandboxMode } from './config'

interface SignatureFields {
  ORDER_ID: string
  ORDER_STATUS: string
  ORDER_TOTAL_AMOUNT: string
  CUSTOMER_EMAIL: string
  TEST_MODE: string
  IPN_TYPE_NAME: string
  SIGNATURE: string
}

interface HashFields {
  HASH: string
}

function timingSafeHexEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a.toLowerCase(), 'hex')
    const bufB = Buffer.from(b.toLowerCase(), 'hex')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

// Verifies the PayPro SIGNATURE field using SHA256.
// Concatenates ORDER_ID + ORDER_STATUS + ORDER_TOTAL_AMOUNT + CUSTOMER_EMAIL
// + VALIDATION_KEY + TEST_MODE + IPN_TYPE_NAME with no separator.
export function verifyPayProSignature(
  fields: SignatureFields,
  validationKey: string
): boolean {
  const raw =
    fields.ORDER_ID +
    fields.ORDER_STATUS +
    fields.ORDER_TOTAL_AMOUNT +
    fields.CUSTOMER_EMAIL +
    validationKey +
    fields.TEST_MODE +
    fields.IPN_TYPE_NAME

  const expected = createHash('sha256').update(raw).digest('hex')
  return timingSafeHexEqual(expected, fields.SIGNATURE)
}

// Verifies the PayPro HASH field using MD5.
// ONLY accepted in sandbox mode (PAYPRO_SANDBOX=true).
// In test mode: hash is always md5("1") = c4ca4238a0b923820dcc509a6f75849b.
export function verifyPayProHash(fields: HashFields): boolean {
  if (!isSandboxMode()) return false
  const expected = createHash('md5').update('1').digest('hex')
  return timingSafeHexEqual(expected, fields.HASH)
}

// Verifies an incoming IPN request.
// SHA256 SIGNATURE is always attempted first.
// MD5 HASH fallback is only accepted when running in sandbox mode.
// Returns false (→ 401) if neither check passes.
export function verifyIpnRequest(
  body: Record<string, string>,
  validationKey: string
): boolean {
  const signatureFields: SignatureFields = {
    ORDER_ID: body['ORDER_ID'] ?? '',
    ORDER_STATUS: body['ORDER_STATUS'] ?? '',
    ORDER_TOTAL_AMOUNT: body['ORDER_TOTAL_AMOUNT'] ?? '',
    CUSTOMER_EMAIL: body['CUSTOMER_EMAIL'] ?? '',
    TEST_MODE: body['TEST_MODE'] ?? '',
    IPN_TYPE_NAME: body['IPN_TYPE_NAME'] ?? '',
    SIGNATURE: body['SIGNATURE'] ?? '',
  }

  if (signatureFields.SIGNATURE) {
    if (verifyPayProSignature(signatureFields, validationKey)) {
      return true
    }
    // SIGNATURE was present but invalid — reject immediately; don't fall through to HASH.
    return false
  }

  // No SIGNATURE field — try HASH only in sandbox mode.
  const hash = body['HASH'] ?? ''
  if (hash && isSandboxMode()) {
    return verifyPayProHash({ HASH: hash })
  }

  return false
}
