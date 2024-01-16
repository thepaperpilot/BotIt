import { LemmyHttp } from 'lemmy-js-client';

export async function getCommunityId(
  client: LemmyHttp,
  communityName: string
) {
  const response = await client.getCommunity({
    name: communityName,
  });

  return response.community_view.community.id;
}
