import express from 'express';
import { google, youtube_v3 } from 'googleapis';
import './process-env-d';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
  VIDEO_ID,
} = process.env;
const scopes = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const authClient = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
const app = express();

app.get('/auth/code', async (req, res) => {
  const code = req.query.code as string;
  const { tokens } = await authClient.getToken(code);
  res.json({ ...tokens });
});

app.listen(3000);

function getRefreshToken() {
  console.log(
    authClient.generateAuthUrl({
      scope: scopes,
      access_type: 'offline',
    })
  );
}

async function main() {
  authClient.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  const opts: youtube_v3.Options = { version: 'v3', auth: authClient };
  const youtube = google.youtube(opts);
  const videoResponse = await youtube.videos.list({
    part: ['id', 'snippet', 'statistics'],
    id: [VIDEO_ID],
  });

  if (videoResponse.data.items) {
    const video = videoResponse.data.items[0];
    const commentCount =
      videoResponse.data.items[0]?.statistics?.commentCount ?? 0;
    const commentsResponse = await youtube.commentThreads.list({
      part: ['id', 'snippet'],
      videoId: VIDEO_ID,
      maxResults: 100,
    });
    const comments = commentsResponse.data.items || [];
    console;
    const winningComment =
      comments[Math.floor(Math.random() * comments.length)];

    const winnersDisplayName =
      winningComment.snippet?.topLevelComment?.snippet?.authorDisplayName;
    const title = `Hourly quote brought to you by ${winnersDisplayName}`;

    const description = `"${
      winningComment.snippet?.topLevelComment?.snippet?.textOriginal
    }"\n\nThank you for those wise words, ${winnersDisplayName}!\nAnd thank you to the other ${commentCount} philosophers!\n Updated at ${new Date().toISOString()}`;

    const updated = await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: VIDEO_ID,
        snippet: {
          ...video.snippet,
          title,
          description,
        },
      },
    });

    // console.log('Updated!', updated);
    process.exit(0);
  }
}

main();
