'use strict';

const crypto = require('crypto');

/**
 * Staff Bearer auth (fax-auth HMAC tokens).
 * TOKEN_SECRET must match fax-auth TOKEN_SECRET. Fail closed if unset.
 */
const TOKEN_SECRET = process.env.TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || '';

function verifyToken(token) {
  if (!TOKEN_SECRET) {
    return { valid: false, error: 'Server auth not configured' };
  }
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadString);
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadString)
      .digest('hex');
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Token verification failed: ' + error.message };
  }
}

function authenticate(event) {
  if (!TOKEN_SECRET) {
    return { ok: false, error: 'Server auth not configured' };
  }
  const h = event.headers || {};
  const authHeader = h.Authorization || h.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing Authorization header' };
  }
  const result = verifyToken(authHeader.slice(7));
  if (!result.valid) return { ok: false, error: result.error };
  return { ok: true, payload: result.payload };
}

function unauthorizedResponse(corsHeaders, error) {
  return {
    statusCode: 401,
    headers: corsHeaders,
    body: JSON.stringify({ message: error || 'Unauthorized' }),
  };
}

module.exports = { authenticate, verifyToken, unauthorizedResponse, TOKEN_SECRET };
