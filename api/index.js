const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const { authenticate, unauthorizedResponse } = require('./staff-auth');

const BUCKET = 'dr-julia-ray-generated-documents';

// Dr. Ray's signature for the editor's Sign tool. Served here, behind staff
// auth, so it is never a public static asset on the Amplify app.
const SIGNATURE = { Bucket: 'dr-julia-ray-templates', Key: 'signatures/julia-ray.png' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
};

function sanitize(name) {
  return name.replace(/[/\\]/g, '').replace(/[^\w .\-()]/g, '');
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const auth = authenticate(event);
  if (!auth.ok) return unauthorizedResponse({ ...CORS_HEADERS, 'Content-Type': 'application/json' }, auth.error);

  if (event.queryStringParameters?.asset === 'signature') {
    try {
      const obj = await S3.getObject(SIGNATURE).promise();
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ dataUrl: `data:image/png;base64,${obj.Body.toString('base64')}` }),
      };
    } catch (err) {
      console.error('Error loading signature:', err);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to load signature' }),
      };
    }
  }

  const rawFilename = event.queryStringParameters?.filename || 'document.pdf';
  const basename = rawFilename.split('/').pop().replace(/\.pdf$/i, '') || 'document';
  const s3Key = `filled/${sanitize(basename)} - ${Date.now()}.pdf`;

  try {
    const uploadUrl = await new Promise((resolve, reject) => {
      S3.getSignedUrl(
        'putObject',
        { Bucket: BUCKET, Key: s3Key, Expires: 3600, ContentType: 'application/pdf' },
        (err, url) => (err ? reject(err) : resolve(url))
      );
    });

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadUrl, s3Key }),
    };
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate upload URL' }),
    };
  }
};
