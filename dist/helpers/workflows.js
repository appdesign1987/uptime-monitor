"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uptimeCiWorkflow = exports.updatesCiWorkflow = exports.updateTemplateCiWorkflow = exports.summaryCiWorkflow = exports.siteCiWorkflow = exports.setupCiWorkflow = exports.responseTimeCiWorkflow = exports.graphsCiWorkflow = exports.getUptimeMonitorVersion = void 0;
const github_1 = require("./github");
const config_1 = require("./config");
const constants_1 = require("./constants");
let release = undefined;
const getUptimeMonitorVersion = async () => {
    if (release)
        return release;
    const octokit = await github_1.getOctokit();
    const releases = await octokit.repos.listReleases({
        owner: "upptime",
        repo: "uptime-monitor",
        per_page: 1,
    });
    release = releases.data[0].tag_name;
    return release;
};
exports.getUptimeMonitorVersion = getUptimeMonitorVersion;
const introComment = async () => `# This file was generated by upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
#
# ===============================
# Do not edit this file directly!
# ===============================
#
# Your changes will be overwritten when the template updates (daily)
# Instead, change your .upptimerc.yml configuration: https://upptime.js.org/docs`;
const graphsCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Graphs CI
on:
  schedule:
    - cron: "${workflowSchedule.graphs || constants_1.GRAPHS_CI_SCHEDULE}"
  repository_dispatch:
    types: [graphs]
  workflow_dispatch:
jobs:
  release:
    name: Generate graphs
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Generate graphs
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "graphs"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
`;
};
exports.graphsCiWorkflow = graphsCiWorkflow;
const responseTimeCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Response Time CI
on:
  schedule:
    - cron: "${workflowSchedule.responseTime || constants_1.RESPONSE_TIME_CI_SCHEDULE}"
  repository_dispatch:
    types: [response_time]
  workflow_dispatch:
jobs:
  release:
    name: Check status
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Update response time
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "response-time"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
          SECRETS_CONTEXT: \${{ toJson(secrets) }}
`;
};
exports.responseTimeCiWorkflow = responseTimeCiWorkflow;
const setupCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Setup CI
on:
  push:
    paths:
      - ".upptimerc.yml"
  repository_dispatch:
    types: [setup]
  workflow_dispatch:
jobs:
  release:
    name: Setup Upptime
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Update template
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "update-template"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
      - name: Update response time
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "response-time"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
          SECRETS_CONTEXT: \${{ toJson(secrets) }}
      - name: Update summary in README
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "readme"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
      - name: Generate graphs
        uses: benc-uk/workflow-dispatch@v1
        with:
          workflow: Graphs CI
          token: \${{ secrets.GH_PAT }}
      - name: Generate site
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "site"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
      - uses: maxheld83/ghpages@v0.3.0
        name: GitHub Pages Deploy
        env:
          BUILD_DIR: "site/status-page/__sapper__/export/"
          GH_PAT: \${{ secrets.GH_PAT }}
`;
};
exports.setupCiWorkflow = setupCiWorkflow;
const siteCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Static Site CI
on:
  schedule:
    - cron: "${workflowSchedule.staticSite || constants_1.STATIC_SITE_CI_SCHEDULE}"
  repository_dispatch:
    types: [static_site]
  workflow_dispatch:
jobs:
  release:
    name: Build and deploy site
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Generate site
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "site"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
      - uses: maxheld83/ghpages@v0.3.0
        name: GitHub Pages Deploy
        env:
          BUILD_DIR: "site/status-page/__sapper__/export/"
          GH_PAT: \${{ secrets.GH_PAT }}
`;
};
exports.siteCiWorkflow = siteCiWorkflow;
const summaryCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Summary CI
on:
  schedule:
    - cron: "${workflowSchedule.summary || constants_1.SUMMARY_CI_SCHEDULE}"
  repository_dispatch:
    types: [summary]
  workflow_dispatch:
jobs:
  release:
    name: Generate README
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Update summary in README
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "readme"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
      - name: Run readme-repos-list
        uses: koj-co/readme-repos-list@master
        with:
          token: \${{ secrets.GH_PAT }}
          query: "topic:upptime"
          size: 20
          max: 1000
          one-per-owner: true
`;
};
exports.summaryCiWorkflow = summaryCiWorkflow;
const updateTemplateCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Update Template CI
on:
  schedule:
    - cron: "${workflowSchedule.updateTemplate || constants_1.UPDATE_TEMPLATE_CI_SCHEDULE}"
  repository_dispatch:
    types: [update_template]
  workflow_dispatch:
jobs:
  release:
    name: Build
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Update template
        uses: upptime/uptime-monitor@master
        with:
          command: "update-template"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
`;
};
exports.updateTemplateCiWorkflow = updateTemplateCiWorkflow;
const updatesCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Updates CI
on:
  schedule:
    - cron: "${workflowSchedule.updates || constants_1.UPDATES_CI_SCHEDULE}"
  repository_dispatch:
    types: [updates]
  workflow_dispatch:
jobs:
  release:
    name: Deploy updates
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Update code
        uses: upptime/updates@master
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
`;
};
exports.updatesCiWorkflow = updatesCiWorkflow;
const uptimeCiWorkflow = async () => {
    const config = await config_1.getConfig();
    const workflowSchedule = config.workflowSchedule || {};
    return `${await introComment()}

name: Uptime CI
on:
  schedule:
    - cron: "${workflowSchedule.uptime || constants_1.UPTIME_CI_SCHEDULE}"
  repository_dispatch:
    types: [uptime]
  workflow_dispatch:
jobs:
  release:
    name: Check status
    runs-on: ${config.runner || constants_1.DEFAULT_RUNNER}
    steps:
      - name: Checkout
        uses: actions/checkout@v2.3.3
        with:
          ref: \${{ github.head_ref }}
          token: \${{ secrets.GH_PAT }}
      - name: Check endpoint status
        uses: upptime/uptime-monitor@${await exports.getUptimeMonitorVersion()}
        with:
          command: "update"
        env:
          GH_PAT: \${{ secrets.GH_PAT }}
          SECRETS_CONTEXT: \${{ toJson(secrets) }}
`;
};
exports.uptimeCiWorkflow = uptimeCiWorkflow;
//# sourceMappingURL=workflows.js.map