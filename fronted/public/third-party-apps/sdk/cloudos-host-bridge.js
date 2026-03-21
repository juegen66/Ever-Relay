/**
 * CloudOS third-party iframe SDK (vanilla JS, no dependencies).
 * Load from the host origin, e.g. /third-party-apps/sdk/cloudos-host-bridge.js
 */
;(function (global) {
  "use strict"

  var CHANNEL = "cloudos:third-party:rpc"

  /**
   * @param {{ appInstanceId: string }} options
   */
  function CloudOSHostBridge(options) {
    var appInstanceId = options && options.appInstanceId
    if (!appInstanceId) {
      throw new Error("CloudOSHostBridge: appInstanceId is required (pass cloudosWindowId query param).")
    }
    this.appInstanceId = appInstanceId
    /** @type {Map<string, function(Object): Promise<unknown>|unknown>} */
    this.handlers = new Map()
    this._bound = this._onMessage.bind(this)
    global.addEventListener("message", this._bound)
  }

  CloudOSHostBridge.prototype.destroy = function () {
    global.removeEventListener("message", this._bound)
    this.handlers.clear()
  }

  /**
   * @param {string} name
   * @param {function(Object): Promise<unknown>|unknown} handler
   */
  CloudOSHostBridge.prototype.onTool = function (name, handler) {
    this.handlers.set(name, handler)
  }

  /**
   * @param {Array<{ id: string, name: string, description: string, parameters?: Object }>} tools
   */
  CloudOSHostBridge.prototype.registerTools = function (tools) {
    global.parent.postMessage(
      {
        channel: CHANNEL,
        v: 1,
        type: "register",
        appInstanceId: this.appInstanceId,
        payload: { tools: tools },
      },
      "*"
    )
  }

  CloudOSHostBridge.prototype.signalReady = function () {
    global.parent.postMessage(
      {
        channel: CHANNEL,
        v: 1,
        type: "ready",
        appInstanceId: this.appInstanceId,
        payload: {},
      },
      "*"
    )
  }

  CloudOSHostBridge.prototype._onMessage = function (event) {
    var data = event.data
    if (!data || data.channel !== CHANNEL || data.v !== 1) return
    if (data.appInstanceId !== this.appInstanceId) return
    if (data.type !== "call") return
    var payload = data.payload || {}
    var callId = payload.callId
    var toolName = payload.toolName
    var args = payload.args && typeof payload.args === "object" ? payload.args : {}
    var self = this
    var handler = this.handlers.get(toolName)

    function reply(ok, result, error) {
      var p =
        ok === true
          ? { callId: callId, ok: true, result: result }
          : { callId: callId, ok: false, error: error || "error" }
      global.parent.postMessage(
        {
          channel: CHANNEL,
          v: 1,
          type: "result",
          appInstanceId: self.appInstanceId,
          payload: p,
        },
        "*"
      )
    }

    if (!handler) {
      reply(false, undefined, "Unknown tool: " + toolName)
      return
    }

    Promise.resolve()
      .then(function () {
        return handler(args)
      })
      .then(function (res) {
        reply(true, res, undefined)
      })
      .catch(function (err) {
        reply(false, undefined, err && err.message ? err.message : String(err))
      })
  }

  /**
   * Read window id injected by CloudOS host iframe src query param.
   */
  CloudOSHostBridge.resolveAppInstanceId = function () {
    try {
      var q = new URLSearchParams(global.location.search)
      var id = q.get("cloudosWindowId")
      return id && id.length ? id : null
    } catch (e) {
      return null
    }
  }

  global.CloudOSHostBridge = CloudOSHostBridge
})(typeof window !== "undefined" ? window : globalThis)
