# git3po
[![NPM Package](https://badge.fury.io/js/git3po.svg)](https://www.npmjs.com/package/git3po)
[![Build Status](https://travis-ci.org/patrickhulce/git3po.svg?branch=master)](https://travis-ci.org/patrickhulce/git3po)
[![Coverage Status](https://coveralls.io/repos/github/patrickhulce/git3po/badge.svg?branch=master)](https://coveralls.io/github/patrickhulce/git3po?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Dependencies](https://david-dm.org/patrickhulce/git3po.svg)](https://david-dm.org/patrickhulce/git3po)

Automatically comments, labels, and closes GitHub issues and pull requests according to a configurable set of filters.

## Usage

### Install

`npm install -g git3po`

### Configure

```yaml
token: <secret>  # alternatively set via the `GIT3PO_GH_TOKEN` env variable.
repo: patrickhulce/git3po
startAt: 2017-07-01
filters:
  - type: issue
    criteria:
      state: open # open issues
      text:
        $match: test phrase # with title or body containing 'test phrase'
      author:
        $not:
          $in: [janesmith, johndoe] # whose author is not janesmith or johndoe
actions:
  - type: add_comment
    body: >
      Hello from the bots

      I'm an awesome multi-line comment
  - type: add_label
    label: duplicate
  - type: close
```

See also

* [`examples/unable-to-load-page.yaml`](./examples/unable-to-load-page.yaml)
* [`examples/apply-waiting4reviewer.yaml`](./examples/apply-waiting4reviewer.yaml)
* [Many real scripts used by Lighthouse](https://github.com/GoogleChrome/lighthouse/tree/master/lighthouse-core/scripts/git3po-rules)

### Use

```sh
git3po -c config.yaml
💎  Found #1 (test phrase), processing...
     Applying add comment...             ⏳
     Applying add label...               ⏳
     Applying close...                   ⏳
✅  Done with #1
```
