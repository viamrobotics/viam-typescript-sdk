#!/usr/bin/env node

/**
 * RSDK-5362: This script gets the pinned version of a buf proto from the
 * buf.lock file. We need this to generate pinned versions of our protos.
 *
 * If we find a way to make `buf generate` build proto apis using the versions
 * stored in buf.lock directly then we can retire this script.
 *
 * See this thread for more details:
 * https://viaminc.slack.com/archives/C039G724TKP/p1697119526822429
 */

'use strict';

const fs = require('node:fs');
const YAML = require('yaml');

const buflockPath = './buf.lock';

const input = process.argv[2];
if (!input) {
  throw new Error('Please specify a buf proto');
}

const [remote, owner, repository] = input.split('/');

const buflock = fs.readFileSync(buflockPath, 'utf8');
const parsed = YAML.parse(buflock);

const { commit } = parsed.deps.find(
  (dep) =>
    dep.remote === remote &&
    dep.owner === owner &&
    dep.repository === repository
);
const pinnedDep = `${remote}/${owner}/${repository}:${commit}`;

console.log(pinnedDep);
