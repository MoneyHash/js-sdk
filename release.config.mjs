/* eslint-disable no-template-curly-in-string */
const branch = process.env.GITHUB_REF_NAME;

/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  branches: ["main", { name: "beta", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
  ],
  preset: "angular",
};

if (
  config.branches.some(
    it => it === branch || (it.name === branch && !it.prerelease),
  )
) {
  config.plugins.push([
    "@semantic-release/changelog",
    {
      changelogFile: "CHANGELOG.md",
    },
  ]);
}

config.plugins.push(
  "@semantic-release/npm",
  [
    "@semantic-release/git",
    {
      assets: ["package.json", "yarn.lock", "CHANGELOG.md"],
      message:
        "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
    },
  ],
  "@semantic-release/github",
);

export default config;
