import { google, youtube_v3 } from 'googleapis';

const VIDEO_ID = process.env.VIDEO_ID as string;
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

async function main() {
  const authClient = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
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

    const description = `"${winningComment.snippet?.topLevelComment?.snippet?.textOriginal}"\n\nCongratulations to the winner, ${winnersDisplayName}!\nRemember to leave your favorite quote for a chance to be displayed at the top of the hour!`;

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
