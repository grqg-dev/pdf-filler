const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const BUCKET = 'dr-julia-ray-generated-documents';

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
