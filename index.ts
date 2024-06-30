import { google, youtube_v3 } from 'googleapis';

const VIDEO_ID = process.env.VIDEO_ID as string;
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

// Description has a max limit of 5000 characters, comments can be 10,000 so let's play it safe
function isSuitableCommentLength(comment: youtube_v3.Schema$CommentThread) {
  return (
    comment.snippet?.topLevelComment?.snippet?.textOriginal &&
    comment.snippet?.topLevelComment?.snippet?.textOriginal?.length < 4500
  );
}

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

  if (videoResponse.data.items?.length === 0) {
    console.log(`No video found for videoId=${VIDEO_ID}`);
    process.exit(0);
  }
  const video = videoResponse.data.items?.shift()!!;
  const commentsResponse = await youtube.commentThreads.list({
    part: ['id', 'snippet'],
    videoId: VIDEO_ID,
    maxResults: 100,
  });

  const comments = (commentsResponse.data.items || []).filter(
    isSuitableCommentLength
  );

  if (comments.length === 0) {
    console.log('No comments found');
    process.exit(0);
  }

  const winningComment =
    comments[Math.floor(Math.random() * comments.length)].snippet
      ?.topLevelComment?.snippet;

  if (!winningComment) {
    console.log('Unable to select winning comment');
    process.exit(0);
  }

  const {
    authorDisplayName: winnersDisplayName,
    textOriginal: winnersQuote,
    authorChannelUrl: winnersChannel,
  } = winningComment;
  const title = `Hourly quote brought to you by ${winnersDisplayName}`;
  const footerText =
    'Remember to leave your favorite quote for a chance to be displayed at the top of the hour!';
  const description = `And the winner is...  ${winnersChannel}   "${winnersQuote}"\n\n${footerText}`;

  await youtube.videos.update({
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

  process.exit(0);
}

main();
