const accesToken = process.env.REACT_APP_GH_TOKEN;
const concurrency = 20;
const maxPage = 2;
const axios = require('axios');
const moment = require('moment');
const gh = axios.create({
  baseURL: 'https://api.github.com',
  params: {
    access_token: accesToken, // eslint-disable-line camelcase
  },
});
const parseLinkHeader = require('parse-link-header');
const pMap = require('p-map');

const data = {
  _formatIssue(issue) {
    return {
      title: issue.title,
      number: issue.number,
      link: `https://github.com/algolia/instantsearch.js/issues/${
        issue.number
      }`,
      daysSinceLastUpdate: moment().diff(moment(issue.updated_at), 'days'),
      upvotes: issue.upvotes,
    };
  },
  getUpvotesForIssue(number) {
    return gh
      .get(`/repos/algolia/instantsearch.js/issues/${number}/reactions`, {
        headers: {
          accept: 'application/vnd.github.squirrel-girl-preview',
        },
      })
      .then(({ data: reactions }) =>
        reactions.reduce((accumulatedUpVotesAndHearts, currentReaction) => {
          if (
            currentReaction.content !== 'heart' &&
            currentReaction.content !== '+1'
          ) {
            return accumulatedUpVotesAndHearts;
          }

          return accumulatedUpVotesAndHearts + 1;
        }, 0)
      );
  },
  async getAllIssues(userParams = {}) {
    const getIssuesForPage = page =>
      gh.get('/repos/algolia/instantsearch.js/issues', {
        params: {
          ...userParams,
          page,
          per_page: 30, // eslint-disable-line camelcase
        },
      });

    const allIssues = [];
    let page = 0;
    let hasMoreIssues = true;

    while (hasMoreIssues === true && page < maxPage) {
      page++;
      const { headers, data: issuesForCurrentPage } = await getIssuesForPage(
        page
      );
      const parsedLinkHeader = parseLinkHeader(headers.link);
      allIssues.push(...issuesForCurrentPage);
      hasMoreIssues = parsedLinkHeader.next !== undefined;
    }

    return pMap(
      allIssues,
      issue =>
        this.getUpvotesForIssue(issue.number).then(upvotes => ({
          ...issue,
          upvotes,
        })),
      { concurrency }
    ).then(issues =>
      issues.filter(
        issue => issue.hasOwnProperty('pull_request') === false // PR are issues
      )
    );
  },
  getOldIssues() {
    return this.getAllIssues({
      direction: 'asc',
      sort: 'updated',
    }).then(issues => issues.map(this._formatIssue));
  },
  getLovedIssues() {
    return this.getAllIssues().then(issues =>
      issues
        .filter(issue => issue.upvotes > 0)
        .map(this._formatIssue)
        .sort((issueA, issueB) => issueA.upvotes < issueB.upvotes)
    );
  },
};

export default data;