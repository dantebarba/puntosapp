// netlify/functions/admin-auth-config.js

exports.handler = async function(event, context) {
  // Puedes controlar esto con una variable de entorno en Netlify
  // Por ejemplo: process.env.ADMIN_LOGIN_ENABLED === 'true'
  const loginEnabled = process.env.ADMIN_LOGIN_ENABLED !== 'false'; // default: true
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ loginEnabled })
  };
};
