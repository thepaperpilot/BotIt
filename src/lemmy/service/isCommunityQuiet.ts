import { LemmyHttp } from 'lemmy-js-client';
import { getCommunityId } from '../api/getCommunityId';
import { getCommunityPosts } from '../api/getCommunityPosts';
import { isPostOlderThanHours } from './isPostOlderThanHours';

export async function isCommunityQuiet(
  lemmyClient: LemmyHttp,
  communityName: string,
  quietFor: number
) {
  const communityId = await getCommunityId(
    lemmyClient,
    communityName
  );

  const latestPosts = await getCommunityPosts(
    lemmyClient,
    communityId
  );

  for (let postView of latestPosts) {
    const post = postView.post;

    if (post.deleted || post.removed) {
      continue;
    }
    return isPostOlderThanHours(post, quietFor);
  }
  return true;
}
