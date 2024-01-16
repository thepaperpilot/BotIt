import { Post } from '../../lemmy/model/Post';
import { RawPost } from '../model/RawPost';

export function parseRawPosts(rawPosts: RawPost[]): Post[] {
  const posts = rawPosts.map((rawPost) => {
    const post: Post = {
      id: rawPost.data.id,
      title: rawPost.data.title,
      url: rawPost.data.url_overridden_by_dest,
    };

    if (rawPost.data.selftext.length) {
      post.content = (rawPost.data.selftext || '') + '\n\n*x-posted from [/r/' + rawPost.data.subreddit + '](https://old.reddit.com/r/' + rawPost.data.subreddit + '/comments/' + rawPost.data.id + ') by [/u/' + rawPost.data.author + '](https://old.reddit.com/u/' + rawPost.data.author + ')*';
    }
    return post;
  });

  return posts;
}
