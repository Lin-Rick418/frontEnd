export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow Chinese descriptions and technical names such as API or Vue.
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'style',
        'docs',
        'test',
        'perf',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
  },
}
