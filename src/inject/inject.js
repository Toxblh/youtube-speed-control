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
      speed: 1.0,
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

  browser.storage.sync.get(state.settings).then(function (storage) {
    state.settings.speed = Number(storage.speed)
    state.settings.speedStep = Number(storage.speedStep)
    state.settings.slowerKeyCode = storage.slowerKeyCode
    state.settings.fasterKeyCode = storage.fasterKeyCode
    state.settings.resetKeyCode = storage.resetKeyCode
    state.settings.displayOption = storage.displayOption
    state.settings.allowMouseWheel = Boolean(storage.allowMouseWheel)
    state.settings.mouseInvert = Boolean(storage.mouseInvert)
    state.settings.rememberSpeed = Boolean(storage.rememberSpeed)
    refInterval = setInterval(refreshFn, 10)
  })

  function refreshFn() {
    if (document.readyState === 'complete') {
      clearInterval(refInterval)

      state.videoController = function (videoElem) {
        this.video = videoElem
        if (!state.settings.rememberSpeed) {
          state.settings.speed = 1.0
        }

        this.initializeControls()
        videoElem.addEventListener('play', function (e) {
          videoElem.playbackRate = state.settings.speed
        })

        videoElem.addEventListener(
          'ratechange',
          function () {
            if (videoElem.readyState === 0) {
              return
            }
            var currentSpeed = this.getSpeed()
            this.speedIndicator.textContent = currentSpeed
            state.settings.speed = currentSpeed
            browser.storage.sync.set({ speed: currentSpeed })
          }.bind(this)
        )

        videoElem.playbackRate = state.settings.speed
      }

      state.videoController.prototype.getSpeed = function () {
        return parseFloat(this.video.playbackRate).toFixed(2)
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
        btnRateView.className = 'btn'
        var btnDecreaseSpeed = document.createElement('button')
        btnDecreaseSpeed.setAttribute('id', 'SpeedDown')
        btnDecreaseSpeed.className = 'btn btn-left'
        btnDecreaseSpeed.textContent = '<<'
        var btnIncreaseSpeed = document.createElement('button')
        btnIncreaseSpeed.setAttribute('id', 'SpeedUp')
        btnIncreaseSpeed.className = 'btn btn-right'
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

        this.video.parentElement.parentElement.insertBefore(docFragment, this.video.parentElement)

        this.video.parentElement.parentElement.addEventListener('mouseover', handleMouseIn)
        this.video.parentElement.parentElement.addEventListener('mouseout', handleMouseOut)

        var currentSpeed = parseFloat(state.settings.speed).toFixed(2)

        btnRateView.textContent = currentSpeed
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
        videoElem.playbackRate = speed
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
              newSpeed = Math.min(videoElem.playbackRate + state.settings.speedStep, 16)
            }
            if (action === RATE_ACTIONS.SLOWER) {
              newSpeed = Math.max(videoElem.playbackRate - state.settings.speedStep, 0)
            }
            if (action === RATE_ACTIONS.RESET) {
              newSpeed = Math.max(1, 0)
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

      document.addEventListener(
        'keydown',
        function (e) {
          var keyPressed = e.which
          if (
            document.activeElement.nodeName === 'INPUT' &&
            document.activeElement.getAttribute('type') === 'text'
          ) {
            return false
          }

          if (state.settings.fasterKeyCode.match(new RegExp('(?:^|,)' + keyPressed + '(?:,|$)'))) {
            changeRate(RATE_ACTIONS.FASTER)
          } else if (state.settings.slowerKeyCode.match(new RegExp('(?:^|,)' + keyPressed + '(?:,|$)'))) {
            changeRate(RATE_ACTIONS.SLOWER)
          } else if (state.settings.resetKeyCode.match(new RegExp('(?:^|,)' + keyPressed + '(?:,|$)'))) {
            changeRate(RATE_ACTIONS.RESET)
          }

          return false
        },
        true
      )

      document.addEventListener('DOMNodeInserted', function (e) {
        var domInserted = e.target || null
        if (domInserted && domInserted.nodeName === 'VIDEO') {
          new state.videoController(domInserted)
        }
      })

      if (state.settings.allowMouseWheel) {
        document.addEventListener(
          'wheel',
          function (e) {
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
          },
          false
        )
      }

      function onFullscreen() {
        var box = document.getElementById('PlayBackRatePanel')
        if (document.fullscreenElement !== null) {
          box.className = 'PlayBackRatePanelFullScreen'
        } else {
          box.className = 'PlayBackRatePanel'
        }
      }

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
