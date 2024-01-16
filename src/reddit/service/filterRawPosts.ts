import { PostFilter } from '../model/PostFilter';
import { RawPost } from '../model/RawPost';
import { isPostWithinTimeLimit } from './isPostWithinTimeLimit';
import { logger, LogContext, LogDomain } from '../../logger';

export function filterRawPosts(
  rawPosts: RawPost[],
  {
    minUpvotes,
    maxDownvotes,
    minUpvoteRatio,
    maxTimeHours,
    excludedUrlPatterns,
  }: PostFilter
) {
  let stickiedOrRemoved = 0;
  let notEnoughUpvotes = 0;
  let tooManyDownVotes = 0;
  let badUpvoteRatio = 0;
  let tooOld = 0;
  let noLink = 0;
  let excluded = 0;

  // Convert excludedUrlPatterns to an array of regular expressions
  const regexPatterns: RegExp[] = [];
  if (excludedUrlPatterns) {
    for (const pattern of excludedUrlPatterns) {
      try {
        const regex = new RegExp(pattern);
        regexPatterns.push(regex);
      } catch (error) {
        // Handle the error (e.g., log or ignore)
        logger(
          LogContext.Error,
          `Invalid regular expression pattern: ${pattern}`,
          LogDomain.Reddit
        );
      }
    }
  }

  const filteredPosts = rawPosts.filter((rawPost) => {
    if (rawPost.data.removal_reason) {
      stickiedOrRemoved++;
      return false;
    }

    if (minUpvotes && rawPost.data.ups < minUpvotes) {
      notEnoughUpvotes++;
      return false;
    }

    if (maxDownvotes && rawPost.data.downs > maxDownvotes) {
      tooManyDownVotes++;
      return false;
    }

    if (minUpvoteRatio && rawPost.data.upvote_ratio < minUpvoteRatio) {
      badUpvoteRatio++;
      return false;
    }

    if (maxTimeHours && !isPostWithinTimeLimit(rawPost, maxTimeHours)) {
      tooOld++;
      return false;
    }

    if (
      regexPatterns.some((regex) => {
        return regex.test(rawPost.data.url_overridden_by_dest);
      })
    ) {
      excluded++;
      return false;
    }
    return true;
  });

  if (filteredPosts.length > 0) {
    logger(
      LogContext.Info,
      `${filteredPosts.length} viable posts found:`,
      LogDomain.Reddit
    );
    filteredPosts.forEach((post) => {
      logger(
        LogContext.Info,
        `* ${post.data.url_overridden_by_dest} (${post.data.title}) -- ${post.data.ups} Upvotes ${post.data.downs} Downvotes`,
        LogDomain.Reddit
      );
    });
    if (stickiedOrRemoved > 0 || excluded > 0 || tooOld > 0 || notEnoughUpvotes > 0 || tooManyDownVotes > 0 || badUpvoteRatio > 0) {
      logger(
        LogContext.Info,
        `Additional posts were found non-viable. Here is the breakdown:
* ${stickiedOrRemoved} were removed
* ${excluded} were exluded by regex
* ${tooOld} were too old (max hours: ${maxTimeHours})
* ${notEnoughUpvotes} didn't have enough upvotes (min: ${minUpvotes})
* ${tooManyDownVotes} had too many downvotes (max: ${maxDownvotes})
* ${badUpvoteRatio} had bad upvote ratios (min ratio: ${minUpvoteRatio})`,
        LogDomain.Reddit
      );
    }
  } else {
    logger(
      LogContext.Info,
      `No valid posts found in the subreddit ${rawPosts[0].data.subreddit}. Here is the breakdown:
* ${stickiedOrRemoved} were removed
* ${excluded} were exluded by regex
* ${tooOld} were too old (max hours: ${maxTimeHours})
* ${notEnoughUpvotes} didn't have enough upvotes (min: ${minUpvotes})
* ${tooManyDownVotes} had too many downvotes (max: ${maxDownvotes})
* ${badUpvoteRatio} had bad upvote ratios (min ratio: ${minUpvoteRatio})

Please try again later or update the config.yml values to adjust your configurations (min upvotes, max downvotes, min ratio)`,
      LogDomain.Reddit
    );
  }

  return filteredPosts;
}
