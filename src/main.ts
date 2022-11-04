import * as core from '@actions/core'
import * as github from '@actions/github'

// const APPROVE = 'APPROVE'
const AUTOMERGE_MESSAGE = '**Automerge**: Enabled'
const RENOVATE_BOT = process.env.RENOVATE_BOT_USER || 'renovate[bot]'
const MEND_BOT = 'mend-for-github-com[bot]'
const RENOVATE_APPROVE_BOT =
  process.env.RENOVATE_APPROVE_BOT_USER || 'renovate-approve[bot]'

const context = github.context

const isValidBot = (): boolean => {
  try {
    return (
      context.payload.sender?.login === RENOVATE_BOT ||
      context.payload.sender?.login === MEND_BOT
    )
  } catch (err) {
    return false
  }
}

const isAutomerging = (): boolean => {
  try {
    return (
      context.payload.pull_request?.body?.includes(AUTOMERGE_MESSAGE) || false
    )
  } catch (err) {
    return false
  }
}

const isRenovateApprover = (): boolean => {
  try {
    return context.payload.review.user.login === RENOVATE_APPROVE_BOT
  } catch (err) {
    return false
  }
}

const isRenovateUser = (): boolean => {
  try {
    return context.payload.pull_request?.user.login === RENOVATE_BOT
  } catch (err) {
    return false
  }
}

const getPrNumber = (): number | null => {
  if (
    context.eventName !== 'pull_request' &&
    context.eventName !== 'pull_request_review'
  ) {
    return null
  }

  return context.payload.pull_request?.number || null
}

const approvePr = async (): Promise<void> => {
  const prNumber = getPrNumber()
  if (!prNumber) {
    throw new Error(
      "Event payload missing `pull_request` key. Make sure you're triggering this action on the `pull_request` or `pull_request_review` events."
    )
  }

  const token = core.getInput('token', {required: true})
  const client = github.getOctokit(token)

  await client.rest.pulls.createReview({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    event: 'APPROVE'
  })

  core.info(`Approved pull request #${prNumber}`)
}

async function run(): Promise<void> {
  try {
    if (
      context.eventName !== 'pull_request' &&
      context.eventName !== 'pull_request_review'
    ) {
      throw new Error(
        'This action can only be run on `pull_request` or `pull_request_review`'
      )
    }

    if (
      context.eventName === 'pull_request' &&
      context.payload.action === 'opened'
    ) {
      core.debug('Received PR open event')
      if (isValidBot() && isAutomerging()) {
        core.debug('Approving new PR')

        approvePr()
        return
      }
    }

    if (
      context.eventName === 'pull_request_review' &&
      context.payload.action === 'dismissed'
    ) {
      if (
        isValidBot() &&
        isAutomerging() &&
        isRenovateApprover() &&
        isRenovateUser()
      ) {
        core.debug('Re-approving dismissed approval')

        approvePr()
        return
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
