!(function($){

	"use strict";

	var Navigator = function ( element, options ) {
		this.init(element, options)
	}

	Navigator.prototype = {

		constructor: Navigator

	/****************************
		Main functions
	****************************/

	, init: function ( element, options ) {
			var that = this

			this.$element = $(element)
			this.options = $.extend(true, {}, $.fn.cytoscapeNavigator.defaults, options)
			this.cy = this.$element.cytoscape('get')

			// Cache sizes
			this.width = this.$element.width()
			this.height = this.$element.height()

			// Panel
			this.initPanel()
			this.setupPanel()

			// Thumbnail
			this.initThumbnail()
			this.setupThumbnail()

			// View
			this.initView()
			this.setupView()

			// Hook cy zoom and pan
			this.cy.on('zoom pan', function () {
				that.setupView()
			})

			this.hookResize()
		}

	, destroy: function () {
			this.$element.remove()
		}

	/****************************
		Navigator elements functions
	****************************/

	, initPanel: function () {
			var options = this.options

			if( options.container ) {
				if( options.container instanceof jQuery ){
					if( options.container.length > 0 ){
						this.$panel = options.container.first()

						// Add class name
						options.forceClassName && this.$panel.addClass(options.className)
					} else {
						$.error("Container for jquery.cyNavigator is empty")
						return
					}
				} else if ( $(options.container).length > 0 ) {
					this.$panel = $(options.container).first()

					// Add class name
					options.forceClassName && this.$panel.addClass(options.className)
				} else {
					$.error("There is no any element matching your selector for jquery.cyNavigator")
					return
				}
			} else {
				this.$panel = $('<div class="'+options.className+'"/>')
				this.$element.append(this.$panel)
			}

			this.initEventsHandling()
		}

	, setupPanel: function () {
			var options = this.options

			// Cache sizes
			options.size._width = this.convertSizeToNumber(options.size.width, this.width)
			options.size._height = this.convertSizeToNumber(options.size.height, this.height)

			// Set sizes
			this.$panel.width(options.size._width)
			this.$panel.height(options.size._height)

			// Cache position
			options.position._horizontal = this.convertPositionToNumber(options.position.horizontal, this.width, options.size._width)
			options.position._vertical = this.convertPositionToNumber(options.position.vertical, this.height, options.size._height)

			// Set positions
			this.$panel.css({left: options.position._horizontal, top: options.position._vertical})
		}

	, initThumbnail: function () {
			this.$thumbnail = $('<dib class="cytoscape-navigatorThumbnail"/>')
			// Create blank image tag
			this.$thumbnailImage = $('<img alt=""/>')
			// Used to capture mouse events
			this.$thumbnailOverlay = $('<dib class="cytoscape-navigatorThumbnailOverlay"/>')

			// Add thumbnail to the dom
			this.$panel.append(this.$thumbnail)
			this.$thumbnail.append(this.$thumbnailImage)
			this.$panel.append(this.$thumbnailOverlay)

			this.$thumbnailImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
		}

	, setupThumbnail: function () {
			var that = this
				, navigatorRatio = 1.0 * this.$panel.width() / this.$panel.height()
				, navigatorThumbnailRatio = 1.0 * this.width / this.height
				, _width
				, _height
				, _left = 0
				, _top = 0

			if( navigatorRatio > navigatorThumbnailRatio ) {
				// panel width is bigger than thumbnail width
				_width = navigatorThumbnailRatio * this.$panel.height()
				_height = this.$panel.height()
				_left = (this.$panel.width() - _height)/2
			} else {
				// panel height is bigger than thumbnail height
				_width =  this.$panel.width()
				_height = navigatorThumbnailRatio * this.$panel.width()
				_top = (this.$panel.height() - _width)/2
			}

			// Setup Thumbnail
			this.$thumbnail.width(_width)
			this.$thumbnail.height(_height)
			this.$thumbnail.css({left: _left, top: _top})

			// Setup Overlay
			this.$thumbnailOverlay.width(_width)
			this.$thumbnailOverlay.height(_height)
			this.$thumbnailOverlay.css({left: _left, top: _top})

			// Cache Thumbnail sizes
			this.eventData.thumbnailSizes.width = _width
			this.eventData.thumbnailSizes.height = _height

			// Populate thumbnail with a render of the graph
			this.cy.on('done', function () {
				that.updateThumbnailImage()
				that.hookGraphUpdates()
			})
		}

	, initView: function () {
			var that = this

			this.$view = $('<div class="cytoscape-navigatorView"/>')
			this.$thumbnail.append(this.$view)
		}

	, setupView: function () {
			var width = 0
				, height = 0
				, position = {left: 0, top: 0}
				, visible = true
				// thumbnail available sizes
				, borderDouble = this.options.view.borderWidth * 2
				, thumbnailWidth = this.$thumbnail.width() - borderDouble
				, thumbnailHeight = this.$thumbnail.height() - borderDouble
				// cy vieport sizes
				, cyZoom = this.cy.zoom()
				, cyPan = this.cy.pan()
				, cyWidth = this.width * cyZoom
				, cyHeight = this.height * cyZoom

			if( cyPan.x > this.width || cyPan.x < -cyWidth || cyPan.y > this.height || cyPan.y < -cyHeight) {
				visible = false
				this.$view.hide()
			} else {
				visible = true

				// Horizontal computation
				position.left = -thumbnailWidth * (cyPan.x / cyWidth)
				position.right = position.left + (thumbnailWidth / cyZoom)

				// Limit view inside thumbnails borders
				position.left = Math.max(0, position.left)
				position.right = Math.min(thumbnailWidth, position.right)

				// Compute width and remove position.right
				width = position.right - position.left
				;// for delete
				delete position.right

				// Vertical computation
				position.top = -thumbnailHeight * (cyPan.y / cyHeight)
				position.bottom = position.top + (thumbnailHeight / cyZoom)

				// Limit view inside thumbnails borders
				position.top = Math.max(0, position.top)
				position.bottom = Math.min(thumbnailHeight, position.bottom)

				// Compute width and remove position.right
				height = position.bottom - position.top
				;// for delete
				delete position.bottom

				// Set computed values
				this.$view.show().width(width).height(height).css(position)

				// Cache values into eventData
				// define like this for speed and in order not to erase additional parameters
				this.eventData.viewSetup.width = width
				this.eventData.viewSetup.height = height
				this.eventData.viewSetup.x = position.left
				this.eventData.viewSetup.y = position.top
			}

		}

	/****************************
		Converter functions
	****************************/

		// reference is used when computing from %
		// element_size is used for string positions (center, right)
	, convertPositionToNumber: function (position, reference, element_size) {
			if (position == "top" || position == "left") {
				return 0
			} else if (position == "bottom" || position == "right") {
				return reference - element_size
			} else if (position == "middle" || position == "center") {
				return ~~((reference - element_size)/2)
			} else {
				return this.convertSizeToNumber(position, reference)
			}
		}

		// reference is used when computing from %
	, convertSizeToNumber: function (size, reference) {
			// if function
			if (Object.prototype.toString.call(size) === '[object Function]') {
				return this.convertSizeToNumber(size())
			}
			// if string
			else if(Object.prototype.toString.call(size) == '[object String]') {
				if (~size.indexOf("%")) {
					return this.convertSizeToNumber(parseFloat(size.substr(0, size.indexOf("%"))) * reference / 100)
				} else {
					return this.convertSizeToNumber(parseInt(size, 10))
				}
			}
			// if number
			else if(!isNaN(parseInt(size, 10)) && isFinite(size)) {
				if (parseInt(size, 10) < 0) {
					$.error("The size shouldn't be negative")
					return 0
				} else {
					return parseInt(size, 10)
				}
			}
			// error
			else {
				$.error("The size " + size + " can't be converted to a usable number")
				return 0
			}
		}

	/****************************
		Event handling functions
	****************************/

	, hookResize: function () {
			this.$element.on('resize', $.proxy(this.resize, this))
		}

	, resize: function () {
			// Cache sizes
			this.width = this.$element.width()
			this.height = this.$element.height()

			this.setupPanel()
			this.setupThumbnail()
			this.setupView()
		}

	, initEventsHandling: function () {
			var that = this
				, eventsAll = [
				// Mouse events
					'mousedown'
				, 'mouseup'
				, 'mouseover'
				, 'mouseout'
				, 'mousemove'
				, 'mousewheel'
				, 'DOMMouseScroll' // Mozzila specific event
				// Touch events
				, 'touchstart'
				, 'touchmove'
				, 'touchend'
				]

			// Init events data storing
			this.eventData = {
				isActive: false
			, hookPoint: { // relative to View
					x: 0
				, y: 0
				}
			, thumbnailSizes: {
					width: 0
				, height: 0
				}
			, viewSetup: {
					x: 0
				, y: 0
				, width: 0
				, height: 0
				}
			, timeout: null // used to keep stable framerate
			, lastMoveStartTime: null
			}

			// handle events and stop their propagation
			this.$panel.on(eventsAll.join(' '), function (ev) {
				// Delegate event handling only for Overlay
				if (ev.target == that.$thumbnailOverlay[0]) {

					// Touch events
					if (ev.type == 'touchstart') {
						// Will count as middle of View
						ev.offsetX = that.eventData.viewSetup.x + that.eventData.viewSetup.width / 2
						ev.offsetY = that.eventData.viewSetup.y + that.eventData.viewSetup.height / 2
					} else if (ev.type == 'touchmove') {
						// Hack - we take in account only first touch
						ev.pageX = ev.originalEvent.touches[0].pageX
						ev.pageY = ev.originalEvent.touches[0].pageY
					}

					// Normalize offset for browsers which do not provide that value
					if (ev.offsetX === undefined || ev.offsetY === undefined) {
						var targetOffset = $(ev.target).offset()
						ev.offsetX = ev.pageX - targetOffset.left
						ev.offsetY = ev.pageY - targetOffset.top
					}


					if (ev.type == 'mousedown' || ev.type == 'touchstart') {
						that.eventMoveStart(ev)
					} else if (ev.type == 'mousemove' || ev.type == 'touchmove') {
						that.eventMove(ev)
					} else if (ev.type == 'mouseup' || ev.type == 'mouseout') {
						that.eventMoveEnd(ev)
					} else if (ev.type == 'mousewheel' || ev.type == 'DOMMouseScroll') {
						that.eventZoom(ev)
					} else if (ev.type == 'mouseover') {
						// console.log(ev)
					}
				}

				// Prevent default and propagation
				// Don't use peventPropagation as it cancels sometimes moure handler
				return false;
			})
			}

	, eventMoveStart: function (ev) {
			var _data = this.eventData
				, now = new Date().getTime()

			// Check if it was double click
			if (_data.lastMoveStartTime !== null
				&& _data.lastMoveStartTime + this.options.dblClickDelay > now) {
				// Reset lastMoveStartTime
				_data.lastMoveStartTime = null
				// Enable View in order to move it to the center
				_data.isActive = true

				// Set hook point as View center
				_data.hookPoint.x = _data.viewSetup.width / 2
				_data.hookPoint.y = _data.viewSetup.height / 2

				// Move View to start point
				this.eventMove({
					offsetX: _data.thumbnailSizes.width / 2
				, offsetY: _data.thumbnailSizes.height / 2
				})

				// View should be inactive as we don't want to move it right after double click
				_data.isActive = false

			}
			// This is single click
			// Take care as single click happens before double click 2 times
			else {
				_data.lastMoveStartTime = now
				_data.isActive = true

				// if event started in View
				if (ev.offsetX >= _data.viewSetup.x && ev.offsetX <= _data.viewSetup.x + _data.viewSetup.width
					&& ev.offsetY >= _data.viewSetup.y && ev.offsetY <= _data.viewSetup.y + _data.viewSetup.height
				) {
					_data.hookPoint.x = ev.offsetX - _data.viewSetup.x
					_data.hookPoint.y = ev.offsetY - _data.viewSetup.y
				}
				// if event started in Thumbnail (outside of View)
				else {
					// Set hook point as View center
					_data.hookPoint.x = _data.viewSetup.width / 2
					_data.hookPoint.y = _data.viewSetup.height / 2

					// Move View to start point
					this.eventMove(ev)
				}
			}

		}

	, eventMove: function (ev) {
			var that = this
				, _data = this.eventData
				, _x = 0
				, _y = 0

			// break if it is useless event
			if (_data.isActive === false) {
				return;
			}

			_x = ev.offsetX - _data.hookPoint.x
			_x = Math.max(0, _x)
			_x = Math.min(_data.thumbnailSizes.width - _data.viewSetup.width, _x)

			_y = ev.offsetY - _data.hookPoint.y
			_y = Math.max(0, _y)
			_y = Math.min(_data.thumbnailSizes.height - _data.viewSetup.height, _y)

			// Update view position
			this.$view.css('left', _x)
			this.$view.css('top', _y)

			// Update cache
			_data.viewSetup.x = _x
			_data.viewSetup.y = _y

			// Move Cy
			if (this.options.live) {
				// trigger instantly
				if (this.options.liveFramerate == 0) {
					this.moveCy()
				}
				// trigger only once in time/framerate
				else if (_data.timeout === null) {
					_data.timeout = setTimeout($.proxy(this.moveCyClearTimeout, this), 1000/this.options.liveFramerate)
				}
			}
		}

	, eventMoveEnd: function (ev) {
			var _data = this.eventData

			if (_data.isActive === false) {
				return;
			}

			// Trigger one last move
			this.eventMove(ev)

			// If mode is not live then move Cy on drag end
			if (!this.options.live) {
				this.moveCy()
			}

			// State
			_data.isActive = false
		}

	, eventZoom: function (ev) {
			var zoomIn

			if (ev.originalEvent.wheelDelta !== undefined) {
				zoomIn = ev.originalEvent.wheelDelta > 0
			}
			// Mozilla specific event
			else if (ev.originalEvent.detail !== undefined) {
				zoomIn = ev.originalEvent.detail > 0
			} else {
				return;
			}

			if (this.cy.zoomingEnabled()) {
				this.zoomCy(zoomIn)
			}
		}

	, moveCyClearTimeout: function () {
			this.moveCy()
			this.eventData.timeout = null
		}

	, hookGraphUpdates: function () {
			this.cy.on('position add remove data', $.proxy(this.updateThumbnailImage, this, false))
		}

	, updateThumbnailImage: function (force_refresh) {
			var that = this
				, timeout = 0 // leave as 0 if force_refresh
				, pan = this.cy.pan()
				, zoom = this.cy.zoom()

			// Set thumbnail framerate
			!force_refresh && this.options.thumbnailFramerate > 0 && (timeout = ~~(1000 / this.options.thumbnailFramerate))

			// Clear old timeout as we are going to create new one
			if (this.thumbUpdateTimeout !== undefined) {
				clearTimeout(this.thumbUpdateTimeout)
			}

			// Call it in the next queue frame
			this.thumbUpdateTimeout = setTimeout(function(){
				// TODO: Lock

				// If graph is in basic position
				if (zoom === 1 && pan.x === 0 && pan.y === 0) {
					that.$thumbnailImage[0].src = that.cy.png()
				}
				// If we have to resize graph
				else{
					if (zoom !== 1) {
						that.cy.zoom(1)
					}
					if (pan.x !== 0 || pan.y !== 0) {
						that.cy.pan({x: 0, y: 0})
					}

					// Call it in the next queue frame
					setTimeout(function () {
						that.$thumbnailImage[0].src = that.cy.png()

						if (zoom !== 1) {
							that.cy.zoom(zoom)
						}
						if (pan.x !== 0 || pan.y !== 0) {
							that.cy.pan(pan)
						}
					})
				}
			}, timeout)
		}

	/****************************
		Navigator view moving
	****************************/

	, moveCy: function () {
			var that = this
				, _data = this.eventData
				// thumbnail available sizes
				, thumbnailBorderDouble = this.options.view.borderWidth * 2
				, thumbnailWidth = _data.thumbnailSizes.width - thumbnailBorderDouble
				, thumbnailHeight = _data.thumbnailSizes.height - thumbnailBorderDouble
				// cy vieport zoom
				, cyZoom = this.cy.zoom()

			this.cy.pan({
				x: -_data.viewSetup.x * this.width * cyZoom / thumbnailWidth
			, y: -_data.viewSetup.y * this.height * cyZoom / thumbnailHeight
			})
		}

	, zoomCy: function (zoomIn) {
			var _data = this.eventData
				, view = _data.viewSetup
				, scale = 1.0 * this.width / _data.thumbnailSizes.width
				, zoomDelta = this.options.zoomStep * (zoomIn ? 1 : -1)

			// Zoom about View center
			this.cy.zoom({
				level: this.cy.zoom() * (1 + zoomDelta)
			, renderedPosition: {
					x: scale * (view.x + view.width/2)
				, y: scale * (view.y + view.height/2)
				}
			})
		}

	}

	$.fn.cytoscapeNavigator = function ( option ) {
		var _arguments = arguments

		return this.each(function () {
			var $this = $(this)
				, data = $this.data('navigator')
				, options = typeof option == 'object' && option

			if (!data) {
				$this.data('navigator', (data = new Navigator(this, options)))
			}

			if (typeof option == 'string') {
				if (data[option] === undefined) {
					$.error("cyNavigator has no such method")
				} else if (typeof data[option] !== typeof function(){}) {
					$.error("cyNavigator."+option+" is not a function")
				} else {
					data[option].call(data, Array.prototype.slice.call(_arguments, 1))
				}
			}
		})
	}

	$.fn.cytoscapeNavigator.Constructor = Navigator

	$.fn.cytoscapeNavigator.defaults = {
		container: false
	, forceClassName: true
	, className: 'cytoscape-navigator'
	, position: {
			vertical: 450 // can be 'top', 'bottom', 'middle', a number (will be used as px), a function (which returns a number) or a string which contains a number +px or +%. Percent will be computed based on container size.
		, horizontal: 400 // can be 'left', 'right', 'center', a number (will be used as px), a function (which returns a number) or a string which contains a number +px or +%. Percent will be computed based on container size.
		}
	, size: {
			width: 200 // can be a number (will be used as px), a function (which returns a number) or a string which contains a number +px or +%. Percent will be computed based on container size.
		, height: 150 // can be a number (will be used as px), a function (which returns a number) or a string which contains a number +px or +%. Percent will be computed based on container size.
		}
	, view: {
			borderWidth: 0
		}
	, live: true // if true than cy is moved when dragging, otherwise it will be done when dragging was finished
	, liveFramerate: 0 // max number of graph changing; if is set 0 then the framerate is max
	, zoomStep: 0.25
	, thumbnailFramerate: 10
	, dblClickDelay: 200
	}

	$.fn.cyNavigator = $.fn.cytoscapeNavigator

})(jQuery)
