import { createHash } from 'crypto'

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
  ORDER_ID: string
  TEST_MODE: string
  HASH: string
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
  return expected.toLowerCase() === fields.SIGNATURE.toLowerCase()
}

// Verifies the PayPro HASH field using MD5.
// For test orders (TEST_MODE=true or TEST_MODE=1), hash is always md5("1").
export function verifyPayProHash(
  fields: HashFields,
  validationKey: string
): boolean {
  const isTest = fields.TEST_MODE === 'true' || fields.TEST_MODE === '1'

  const raw = isTest ? '1' : fields.ORDER_ID + validationKey
  const expected = createHash('md5').update(raw).digest('hex')
  return expected.toLowerCase() === fields.HASH.toLowerCase()
}

// Combined check: returns true if SIGNATURE verifies, or (fallback) if HASH verifies.
// Prefers SIGNATURE; accepts HASH as fallback for test mode compatibility.
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
  }

  const hashFields: HashFields = {
    ORDER_ID: body['ORDER_ID'] ?? '',
    TEST_MODE: body['TEST_MODE'] ?? '',
    HASH: body['HASH'] ?? '',
  }

  if (hashFields.HASH) {
    return verifyPayProHash(hashFields, validationKey)
  }

  return false
}
