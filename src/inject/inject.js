browser.runtime.sendMessage({}, function(o) {
  var p = {
    settings: {
      speed: 1.0,
      speedStep: 0.25,
      slowerKeyCode: '109,189,173',
      fasterKeyCode: '107,187,61',
      resetKeyCode: '106',
      displayOption: 'FadeInFadeOut',
      allowMouseWheel: true,
      mouseInvert: false,
      rememberSpeed: false
    }
  }

  var q

  browser.storage.sync.get(p.settings).then(function(M) {
    p.settings.speed = Number(M.speed)
    p.settings.speedStep = Number(M.speedStep)
    p.settings.slowerKeyCode = M.slowerKeyCode
    p.settings.fasterKeyCode = M.fasterKeyCode
    p.settings.resetKeyCode = M.resetKeyCode
    p.settings.displayOption = M.displayOption
    p.settings.allowMouseWheel = Boolean(M.allowMouseWheel)
    p.settings.mouseInvert = Boolean(M.mouseInvert)
    p.settings.rememberSpeed = Boolean(M.rememberSpeed)
    q = setInterval(r, 10)
  })

  function r() {
    if (document.readyState === 'complete') {
      clearInterval(q)

      p.videoController = function(R) {
        this.video = R
        if (!p.settings.rememberSpeed) {
          p.settings.speed = 1.0
        }

        this.initializeControls()
        R.addEventListener('play', function(V) {
          R.playbackRate = p.settings.speed
        })

        R.addEventListener(
          'ratechange',
          function(V) {
            if (R.readyState === 0) {
              return
            }
            var W = this.getSpeed()
            this.speedIndicator.textContent = W
            p.settings.speed = W
            browser.storage.sync.set({ speed: W })
          }.bind(this)
        )

        R.playbackRate = p.settings.speed
      }

      p.videoController.prototype.getSpeed = function() {
        return parseFloat(this.video.playbackRate).toFixed(2)
      }

      p.videoController.prototype.remove = function() {
        this.parentElement.removeChild(this)
      }

      p.videoController.prototype.initializeControls = function() {
        var R = document.createDocumentFragment()
        var S = document.createElement('div')
        S.setAttribute('id', 'PlayBackRatePanel')
        S.className = 'PlayBackRatePanel'
        var T = document.createElement('button')
        T.setAttribute('id', 'PlayBackRate')
        T.className = 'btn'
        var U = document.createElement('button')
        U.setAttribute('id', 'SpeedDown')
        U.className = 'btn btn-left'
        U.textContent = '<<'
        var NR = document.createElement('button')
        NR.setAttribute('id', 'SpeedUp')
        NR.className = 'btn btn-right'
        NR.textContent = '>>'
        if (p.settings.displayOption == 'None') {
          S.style.display = 'none'
        } else if (p.settings.displayOption == 'Always') {
          S.style.display = 'inline'
        } else if (p.settings.displayOption == 'Simple') {
          S.style.display = 'inline'
          NR.style.display = 'none'
          U.style.display = 'none'
          T.style.border = 'none'
          T.style.background = 'transparent'
        } else if (p.settings.displayOption == 'FadeInFadeOut') {
          S.style.display = 'none'
        } else {
          S.style.display = 'inline'
        }

        S.appendChild(NR)
        S.appendChild(T)
        S.appendChild(U)
        R.appendChild(S)

        this.video.parentElement.parentElement.insertBefore(R, this.video.parentElement)

        this.video.parentElement.parentElement.addEventListener('mouseover', M)
        this.video.parentElement.parentElement.addEventListener('mouseout', N)

        var NS = parseFloat(p.settings.speed).toFixed(2)

        T.textContent = NS
        this.speedIndicator = T

        S.addEventListener(
          'click',
          function(V) {
            if (V.target === U) {
              P('slower')
            } else if (V.target === NR) {
              P('faster')
            } else if (V.target === T) {
              P('reset')
            }
            V.preventDefault()
            V.stopPropagation()
          },
          true
        )

        S.addEventListener(
          'dblclick',
          function(V) {
            V.preventDefault()
            V.stopPropagation()
          },
          true
        )
      }

      function M() {
        var R = document.getElementById('PlayBackRatePanel')
        if (p.settings.displayOption == 'FadeInFadeOut') {
          R.style.display = 'inline'
        }
      }

      function N() {
        var R = document.getElementById('PlayBackRatePanel')
        if (p.settings.displayOption == 'FadeInFadeOut' && R.className != 'PlayBackRatePanelFullScreen') {
          R.style.display = 'none'
        }
      }

      function changeSpeed(videoElem, speed) {
        videoElem.playbackRate = speed
      }

      function P(R) {
        var S = document.getElementsByTagName('video')

        for (let videoElem of S) {
          if (!videoElem.classList.contains('vc-cancelled')) {
            var newSpeed

            if (R === 'faster') {
              newSpeed = Math.min(videoElem.playbackRate + p.settings.speedStep, 16)
            }
            if (R === 'slower') {
              newSpeed = Math.max(videoElem.playbackRate - p.settings.speedStep, 0)
            }
            if (R === 'reset') {
              newSpeed = Math.max(1, 0)
            }

            changeSpeed(videoElem, newSpeed)
          }
        }

        var T = document.getElementById('PlayBackRatePanel')
        var U = T.style.display
        if (U === 'none') {
          T.style.display = 'inline'
          setTimeout(function() {
            T.style.display = U
          }, 300)
        }
      }

      document.addEventListener(
        'keydown',
        function(R) {
          var S = R.which
          console.log('keydown', R)
          if (
            document.activeElement.nodeName === 'INPUT' &&
            document.activeElement.getAttribute('type') === 'text'
          ) {
            return false
          }

          if (p.settings.fasterKeyCode.match(new RegExp('(?:^|,)' + S + '(?:,|$)'))) {
            P('faster')
          } else if (p.settings.slowerKeyCode.match(new RegExp('(?:^|,)' + S + '(?:,|$)'))) {
            P('slower')
          } else if (p.settings.resetKeyCode.match(new RegExp('(?:^|,)' + S + '(?:,|$)'))) {
            P('reset')
          }
          return false
        },
        true
      )

      document.addEventListener('DOMNodeInserted', function(R) {
        var S = R.target || null
        if (S && S.nodeName === 'VIDEO') {
          new p.videoController(S)
        }
      })

      if (p.settings.allowMouseWheel) {
        document.addEventListener(
          'wheel',
          function(R) {
            if (R.shiftKey) {
              if ('deltaY' in R) {
                rolled = R.deltaY
                if (p.settings.mouseInvert) {
                  if (rolled > 0) P('faster')
                  else if (rolled < 0) P('slower')
                } else {
                  if (rolled > 0) P('slower')
                  else if (rolled < 0) P('faster')
                }
              }
            }
          },
          false
        )
      }

      function onFullscreen() {
        var R = document.getElementById('PlayBackRatePanel')
        if (document.fullscreenElement !== null) {
          R.className = 'PlayBackRatePanelFullScreen'
        } else {
          R.className = 'PlayBackRatePanel'
        }
      }

      document.addEventListener('webkitfullscreenchange', onFullscreen, false)
      document.addEventListener('mozfullscreenchange', onFullscreen, false)
      document.addEventListener('fullscreenchange', onFullscreen, false)

      var Q = document.getElementsByTagName('video')
      for (let R of Q) {
        var S = new p.videoController(R)
      }
    }
  }
})

browser.runtime.sendMessage('show_page_action')
