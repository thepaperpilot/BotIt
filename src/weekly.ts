import * as fs from 'fs';
import * as yaml from 'yaml';

import { Config } from './model/Config';
import { LemmyHttp } from 'lemmy-js-client';
import { getJwt } from './lemmy/api/getJwt';
import { createPost, getCommunityId } from './lemmy';
import { logger, LogContext, LogDomain } from './logger';

const dotenv = require('dotenv');
dotenv.config();

function getConfig(): Config {
  try {
    // Read the YAML configuration file
    const configFile = fs.readFileSync('config.yml', 'utf-8');
    return yaml.parse(configFile);
  } catch (error) {
    logger(
      LogContext.Error,
      `Error reading the configuration file: ${error}`,
      LogDomain.Scheduler
    );
    throw new Error(`Error reading the configuration file: ${error}`);
  }
}

async function makeWeeklyPost(): Promise<void> {
  const config = getConfig();

  const lemmyClient = new LemmyHttp(config.lemmy.baseUrl);
  let jwt = await getJwt(lemmyClient);

  const communityId = await getCommunityId(lemmyClient, "incremental_games@incremental.social");
  createPost(lemmyClient, communityId, {
    id: "ignored",
    title: "Weekly Incremental Check-in",
    content: "This thread is meant for people to share what they've been doing this week. Incremental game recommendations are encouraged, although other topics are welcome as well. Just remember to keep it casual, be helpful, and have fun!",
    url: ""
  });
}

makeWeeklyPost().catch((error) => {
  logger(LogContext.Error, `An error occurred: ${error}`, LogDomain.Scheduler);
});
