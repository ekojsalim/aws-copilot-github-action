import * as core from "@actions/core";
import * as github from "@actions/github";
import * as os from "node:os";

import { cacheFile, downloadTool, find } from "@actions/tool-cache";
import { chmodSync } from "node:fs";
import { exec } from "@actions/exec";

const COPILOT_CLI_TOOL_NAME = "aws-copilot-cli";

run();

async function run(): Promise<void> {
  try {
    const command = core.getInput("command") || "install";
    await processCommand(command);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

/**
 * Process Commands
 */
async function processCommand(command: string): Promise<void> {
  if (command === "install") {
    await install();
  } else if (command === "package") {
    await packApp();
  } else if (command === "deploy") {
    await deployApp();
  }
}

/**
 * Install the AWS Copilot CLI
 */
async function install(): Promise<void> {
  core.info("Installing AWS Copilot...");

  const version = core.getInput("version") || (await getLatestVersion());

  const platform = os.platform();
  const packageUrl = `https://github.com/aws/copilot-cli/releases/download/${version}/copilot-${platform}-${version}`;

  core.info(`Downloading AWS Copilot CLI from ${packageUrl}`);

  let cliPath = find(COPILOT_CLI_TOOL_NAME, version);

  if (!cliPath) {
    const downloadPath = await downloadTool(packageUrl, COPILOT_CLI_TOOL_NAME);
    chmodSync(downloadPath, "755");
    cliPath = await cacheFile(
      downloadPath,
      "copilot",
      COPILOT_CLI_TOOL_NAME,
      version
    );
  }

  core.info(`Installing AWS Copilot CLI to ${cliPath}`);
  core.addPath(cliPath);

  core.info("AWS Copilot CLI installed successfully");
}

async function getLatestVersion(): Promise<string> {
  const token = core.getInput("github-token");
  const octokit = github.getOctokit(token);

  const latestRelease = await octokit.rest.repos.getLatestRelease({
    owner: "aws",
    repo: "copilot-cli",
  });

  const latestVersion = latestRelease.data.tag_name;

  return latestVersion;
}

async function checkToolIsInstalled(toolName: string): Promise<boolean> {
  const version = core.getInput("version") || (await getLatestVersion());
  const toolPath = find(toolName, version);
  return !!toolPath;
}

async function packApp(): Promise<void> {
  const isInstalled = await checkToolIsInstalled(COPILOT_CLI_TOOL_NAME);

  if (!isInstalled) {
    await install();
  }

  const app = core.getInput("app");
  const path = core.getInput("path") || ".";

  if (!app) {
    throw new Error("App name is required");
  }

  const services = await exec(
    "copilot",
    ["svc", "ls", "--app", app, "--local", "--json"],
    { cwd: path }
  );
  const jobs = await exec(
    "copilot",
    ["job", "ls", "--app", app, "--local", "--json"],
    { cwd: path }
  );

  core.debug(`Services ${services}`);
  core.debug(`Jobs ${jobs}`);

  core.info("Copilot package created successfully");
}

async function deployApp(): Promise<void> {
  const isInstalled = await checkToolIsInstalled(COPILOT_CLI_TOOL_NAME);

  if (!isInstalled) {
    await install();
  }

  const app = core.getInput("app");
  const env = core.getInput("env");
  const name = core.getInput("name");
  const tag = core.getInput("tag");
  const resourceTags = core.getInput("resource-tags");
  const path = core.getInput("path") || ".";
  const detach = core.getBooleanInput("detach");

  const force = core.getInput("force") === "true";

  if (!app) {
    throw new Error("App name is required");
  }

  if (!env) {
    throw new Error("Environment is required");
  }

  const cmd = `copilot deploy \
  --app ${app} \
  --env ${env} \
  ${name ? `--name ${name}` : ""} \
  ${tag ? `--tag ${tag}` : ""} \
  ${force ? "--force" : ""} \
	${detach ? "--detach" : ""} \
  ${resourceTags ? `--resource-tags ${resourceTags}` : ""}`;

  const deploy = await exec(cmd, [], { cwd: path });

  core.debug(
    `Deploying app ${app} to env ${env} ${
      force ? "with force" : ""
    } is done ${deploy}`
  );

  core.info("Copilot application deployed successfully");
}
