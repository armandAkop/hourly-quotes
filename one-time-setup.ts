import { google } from 'googleapis';
import express from 'express';

const app = express();

/**
 * Only used this to generate the initial refresh token
 */
app.get('/auth/code', async (req, res) => {
  const code = req.query.code as string;
  const { tokens } = await authClient.getToken(code);
  res.json({ ...tokens });
});

app.listen(3000);

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
  process.env;

const scopes = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const authClient = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Past this to begin auth flow
console.log(
  authClient.generateAuthUrl({
    scope: scopes,
    access_type: 'offline',
  })
);
