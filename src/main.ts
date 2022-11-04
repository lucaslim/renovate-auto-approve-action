/* eslint-disable no-console */
/* eslint-disable-file */
import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'

// const APPROVE = 'APPROVE'
const AUTOMERGE_MESSAGE = '**Automerge**: Enabled'
const RENOVATE_BOT = process.env.RENOVATE_BOT_USER || 'renovate[bot]'
const MEND_BOT = 'mend-for-github-com[bot]'
const RENOVATE_APPROVE_BOT =
  process.env.RENOVATE_APPROVE_BOT_USER || 'renovate-approve[bot]'

const isValidBot = (context: Context): boolean => {
  try {
    return (
      context.payload.sender?.login === RENOVATE_BOT ||
      context.payload.sender?.login === MEND_BOT
    )
  } catch (err) {
    // core.log(context.payload)
    // core.log(err)
    return false
  }
}

const isAutomerging = (context: Context): boolean => {
  try {
    return (
      context.payload.pull_request?.body?.includes(AUTOMERGE_MESSAGE) || false
    )
  } catch (err) {
    // context.log(context.payload)
    // context.log(err)
    return false
  }
}

const isRenovateApprover = (context: Context): boolean => {
  try {
    return context.payload.review.user.login === RENOVATE_APPROVE_BOT
  } catch (err) {
    // context.log(err)
    return false
  }
}

const isRenovateUser = (context: Context): boolean => {
  try {
    return context.payload.pull_request?.user.login === RENOVATE_BOT
  } catch (err) {
    // context.log(context.payload)
    // context.log(err)
    return false
  }
}
// const approvePr = (context: Context): boolean => {
//   try {
//     const params = context.issue({event: APPROVE})
//     return context.github.pulls.createReview(params)
//   } catch (err) {
//     context.log(err)
//     context.log(context.payload)
//   }
// }

async function run(): Promise<void> {
  try {
    const context = github.context
    console.log(context.eventName)
    console.log(context.action)

    console.log(isValidBot(context))
    console.log(isAutomerging(context))
    console.log(isRenovateApprover(context))
    console.log(isRenovateUser(context))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
