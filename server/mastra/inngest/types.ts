import type {
  AppBuildCompletedData,
  AppBuildFailedData,
  AppBuildRequestedData,
  APP_BUILD_COMPLETED_EVENT,
  APP_BUILD_FAILED_EVENT,
  APP_BUILD_REQUESTED_EVENT,
} from "./events"

export type InngestEventMap = {
  [APP_BUILD_REQUESTED_EVENT]: {
    data: AppBuildRequestedData
  }
  [APP_BUILD_COMPLETED_EVENT]: {
    data: AppBuildCompletedData
  }
  [APP_BUILD_FAILED_EVENT]: {
    data: AppBuildFailedData
  }
}

