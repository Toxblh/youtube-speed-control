browser.runtime.sendMessage({}, function (o) {
  /**
   * Enum string values.
   * @enum {string}
   */
  const RATE_ACTIONS = {
    FASTER: 'faster',
    SLOWER: 'slower',
    RESET: 'reset',
  }

  var state = {
    settings: {
      speed: 1,
      speedStep: 0.25,
      slowerKeyCode: '109,189,173',
      fasterKeyCode: '107,187,61',
      resetKeyCode: '106',
      displayOption: 'FadeInFadeOut',
      allowMouseWheel: true,
      mouseInvert: false,
      rememberSpeed: false,
    },
  }

  var refInterval

  const setStorage = (data) => {
    if (chrome) {
      return new Promise((resolve, reject) =>
        chrome.storage.sync.set(data, () =>
          chrome.runtime.lastError
            ? reject(Error(chrome.runtime.lastError.message))
            : resolve()
        )
      )
    }

    return browser.storage.sync.set(data)
  }

  const getStorage = (key) => {
    if (chrome) {
      return new Promise((resolve, reject) =>
        chrome.storage.sync.get(key, (result) =>
          chrome.runtime.lastError
            ? reject(Error(chrome.runtime.lastError.message))
            : resolve(result)
        )
      )
    }
    return browser.storage.sync.get(key)
  }

  getStorage(state.settings).then(function (storage) {
    state.settings.speed = Number(storage.speed) * 100
    state.settings.speedStep = Number(storage.speedStep) * 100
    state.settings.slowerKeyCode = storage.slowerKeyCode
    state.settings.fasterKeyCode = storage.fasterKeyCode
    state.settings.resetKeyCode = storage.resetKeyCode
    state.settings.displayOption = storage.displayOption
    state.settings.allowMouseWheel = Boolean(storage.allowMouseWheel)
    state.settings.mouseInvert = Boolean(storage.mouseInvert)
    state.settings.rememberSpeed = Boolean(storage.rememberSpeed)
    refInterval = setInterval(refreshFn, 16)
  })

  function getStateSpeed() {
    return isNaN(Number(state.settings.speed))
      ? 100
      : Number(state.settings.speed)
  }

  function getStateStepSpeed() {
    return isNaN(Number(state.settings.speedStep))
      ? 25
      : Number(state.settings.speedStep)
  }

  function getPlaybackReadySpeed() {
    return getStateSpeed() / 100
  }

  function setStateSpeed(value) {
    state.settings.speed = Number(value)
  }

  function refreshFn() {
    if (document.readyState === 'complete') {
      clearInterval(refInterval)

      state.videoController = function (videoElem) {
        this.video = videoElem
        if (!state.settings.rememberSpeed) {
          setStateSpeed(100)
        }

        this.initializeControls()

        videoElem.addEventListener('play', function () {
          videoElem.playbackRate = getPlaybackReadySpeed()
        })

        videoElem.addEventListener(
          'ratechange',
          function () {
            if (videoElem.readyState === 0) {
              return
            }
            var currentSpeed = this.getVideoSpeed()
            setStateSpeed(currentSpeed)
            this.speedIndicator.textContent = (currentSpeed / 100).toFixed(2)
            setStorage({ speed: currentSpeed / 100 })
          }.bind(this)
        )

        videoElem.playbackRate = getPlaybackReadySpeed()
      }

      state.videoController.prototype.getVideoSpeed = function () {
        return Number(
          String(this.video.playbackRate.toFixed(2)).replace('.', '')
        ) // trick how to parse like 1.12 to 112 without any phantom 0.(0)1
      }

      state.videoController.prototype.remove = function () {
        this.parentElement.removeChild(this)
      }

      state.videoController.prototype.initializeControls = function () {
        var docFragment = document.createDocumentFragment()

        var box = document.createElement('div')
        box.setAttribute('id', 'PlayBackRatePanel')
        box.className = 'PlayBackRatePanel'

        var btnRateView = document.createElement('button')
        btnRateView.setAttribute('id', 'PlayBackRate')
        btnRateView.className = 'ysc-btn'

        var btnDecreaseSpeed = document.createElement('button')
        btnDecreaseSpeed.setAttribute('id', 'SpeedDown')
        btnDecreaseSpeed.className = 'ysc-btn ysc-btn-left'
        btnDecreaseSpeed.textContent = '<<'

        var btnIncreaseSpeed = document.createElement('button')
        btnIncreaseSpeed.setAttribute('id', 'SpeedUp')
        btnIncreaseSpeed.className = 'ysc-btn ysc-btn-right'
        btnIncreaseSpeed.textContent = '>>'

        if (state.settings.displayOption == 'None') {
          box.style.display = 'none'
          btnIncreaseSpeed.style.display = 'none'
          btnDecreaseSpeed.style.display = 'none'
          btnRateView.style.border = 'none'
          btnRateView.style.background = 'transparent'
        } else if (state.settings.displayOption == 'Always') {
          box.style.display = 'inline'
        } else if (state.settings.displayOption == 'Simple') {
          box.style.display = 'inline'
          btnIncreaseSpeed.style.display = 'none'
          btnDecreaseSpeed.style.display = 'none'
          btnRateView.style.border = 'none'
          btnRateView.style.background = 'transparent'
        } else if (state.settings.displayOption == 'FadeInFadeOut') {
          box.style.display = 'none'
        } else {
          box.style.display = 'inline'
        }

        box.appendChild(btnIncreaseSpeed)
        box.appendChild(btnRateView)
        box.appendChild(btnDecreaseSpeed)
        docFragment.appendChild(box)

        this.video.parentElement.parentElement.insertBefore(
          docFragment,
          this.video.parentElement
        )

        this.video.parentElement.parentElement.addEventListener(
          'mouseover',
          handleMouseIn
        )
        this.video.parentElement.parentElement.addEventListener(
          'mouseout',
          handleMouseOut
        )

        var currentSpeed = getStateSpeed() / 100

        btnRateView.textContent = currentSpeed.toFixed(2)
        this.speedIndicator = btnRateView

        box.addEventListener(
          'click',
          function (value) {
            if (value.target === btnDecreaseSpeed) {
              changeRate(RATE_ACTIONS.SLOWER)
            } else if (value.target === btnIncreaseSpeed) {
              changeRate(RATE_ACTIONS.FASTER)
            } else if (value.target === btnRateView) {
              changeRate(RATE_ACTIONS.RESET)
            }
            value.preventDefault()
            value.stopPropagation()
          },
          true
        )

        box.addEventListener(
          'dblclick',
          function (value) {
            value.preventDefault()
            value.stopPropagation()
          },
          true
        )
      }

      function handleMouseIn() {
        var box = document.getElementById('PlayBackRatePanel')
        if (state.settings.displayOption == 'FadeInFadeOut') {
          box.style.display = 'inline'
        }
      }

      function handleMouseOut() {
        var box = document.getElementById('PlayBackRatePanel')
        if (
          state.settings.displayOption == 'FadeInFadeOut' &&
          box.className != 'PlayBackRatePanelFullScreen'
        ) {
          box.style.display = 'none'
        }
      }

      function changeVideoSpeed(videoElem, speed) {
        videoElem.playbackRate = speed / 100
      }

      /**
       *
       * @param {RATE_ACTIONS} action
       */
      function changeRate(action) {
        var videoElems = document.getElementsByTagName('video')

        for (let videoElem of videoElems) {
          if (!videoElem.classList.contains('vc-cancelled')) {
            var newSpeed

            if (action === RATE_ACTIONS.FASTER) {
              newSpeed = Math.min(getStateSpeed() + getStateStepSpeed(), 1600)
            }
            if (action === RATE_ACTIONS.SLOWER) {
              newSpeed = Math.max(getStateSpeed() - getStateStepSpeed(), 0)
            }
            if (action === RATE_ACTIONS.RESET) {
              if (getStateSpeed() === 100) {
                newSpeed = state.resetedSpeed
              } else {
                state.resetedSpeed = getStateSpeed()
                newSpeed = 100
              }
            }

            changeVideoSpeed(videoElem, newSpeed)
          }
        }

        var box = document.getElementById('PlayBackRatePanel')
        var savedStyleDisplay = box.style.display
        if (savedStyleDisplay === 'none') {
          box.style.display = 'inline'

          setTimeout(function () {
            box.style.display = savedStyleDisplay
          }, 300)
        }
      }

      function handleWheel(e) {
        if (e.shiftKey) {
          if ('deltaY' in e) {
            rolled = e.deltaY
            if (state.settings.mouseInvert) {
              if (rolled > 0) changeRate(RATE_ACTIONS.FASTER)
              else if (rolled < 0) changeRate(RATE_ACTIONS.SLOWER)
            } else {
              if (rolled > 0) changeRate(RATE_ACTIONS.SLOWER)
              else if (rolled < 0) changeRate(RATE_ACTIONS.FASTER)
            }
          }
        }
      }

      function handleDOMInserted(e) {
        var domInserted = e.target || null
        if (domInserted && domInserted.nodeName === 'VIDEO') {
          new state.videoController(domInserted)
        }
      }

      function handleKeyDown(e) {
        var keyPressed = e.which
        if (
          document.activeElement.nodeName === 'INPUT' &&
          document.activeElement.getAttribute('type') === 'text'
        ) {
          return false
        }

        if (
          state.settings.fasterKeyCode.match(
            new RegExp('(?:^|,)' + keyPressed + '(?:,|$)')
          )
        ) {
          changeRate(RATE_ACTIONS.FASTER)
        } else if (
          state.settings.slowerKeyCode.match(
            new RegExp('(?:^|,)' + keyPressed + '(?:,|$)')
          )
        ) {
          changeRate(RATE_ACTIONS.SLOWER)
        } else if (
          state.settings.resetKeyCode.match(
            new RegExp('(?:^|,)' + keyPressed + '(?:,|$)')
          )
        ) {
          changeRate(RATE_ACTIONS.RESET)
        }

        return false
      }

      function onFullscreen() {
        var box = document.getElementById('PlayBackRatePanel')
        if (document.fullscreenElement !== null) {
          box.className = 'PlayBackRatePanelFullScreen'
        } else {
          box.className = 'PlayBackRatePanel'
        }
      }

      if (state.settings.allowMouseWheel) {
        document.addEventListener('wheel', handleWheel, false)
      }

      document.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('DOMNodeInserted', handleDOMInserted)
      document.addEventListener('webkitfullscreenchange', onFullscreen, false)
      document.addEventListener('mozfullscreenchange', onFullscreen, false)
      document.addEventListener('fullscreenchange', onFullscreen, false)

      var videoElements = document.getElementsByTagName('video')
      for (let videoElement of videoElements) {
        new state.videoController(videoElement)
      }
    }
  }
})

browser.runtime.sendMessage('show_page_action')
