!(function($){

	"use strict";

	var Navigator = function ( element, options ) {
		this._init(element, options)
	}

	Navigator.prototype = {

		constructor: Navigator

	/****************************
		Main functions
	****************************/

	, _init: function ( element, options ) {
			var that = this

			this.$element = $(element)
			this.options = $.extend(true, {}, $.fn.cytoscapeNavigator.defaults, options)
			this.cy = this.$element.cytoscape('get')

			// Cache sizes
			this.width = this.$element.width()
			this.height = this.$element.height()

			// Panel
			this._initPanel()
			this._setupPanel()

			// Thumbnail
			this._initThumbnail()

			// View
			this._initView()

			// Listen for events
			this._initEventsHandling()

			// Populate thumbnail with a render of the graph after it is rendered
			this.cy.on('initrender', $.proxy(this.initrender, this))
		}

	, initrender: function () {
			var that = this

			if (this.initialized) return
			else this.initialized = true

			this._setupThumbnailSizes()
			this._setupThumbnail()

			this._updateThumbnailImage()
			if (this.options.thumbnailLiveFramerate === false) {
				this._hookGraphUpdates()
			} else {
				this._setGraphUpdatesTimer()
			}

			// Setup view based on thumbnail
			this._setupView()

			// Hook graph zoom and pan
			this.cy.on('zoom pan', $.proxy(this._setupView, this))

			// Hook element resize
			this.$element.on('resize', $.proxy(this.resize, this))
		}

	, destroy: function () {
			this.$panel.remove()
		}

	/****************************
		Navigator elements functions
	****************************/

	, _initPanel: function () {
			var options = this.options

			if( options.container ) {
				if( options.container instanceof jQuery ){
					if( options.container.length > 0 ){
						this.$panel = options.container.first()
					} else {
						$.error("Container for jquery.cyNavigator is empty")
						return
					}
				} else if ( $(options.container).length > 0 ) {
					this.$panel = $(options.container).first()
				} else {
					$.error("There is no any element matching your selector for jquery.cyNavigator")
					return
				}
			} else {
				this.$panel = $('<div class="cytoscape-navigator"/>')
				this.$element.append(this.$panel)
			}
		}

	, _setupPanel: function () {
			var options = this.options

			// Cache sizes
			this.$panel._width = this.$panel.width()
			this.$panel._height = this.$panel.height()
		}

	, _initThumbnail: function () {
			this.$thumbnail = $('<dib class="cytoscape-navigatorThumbnail"/>')
			// Create thumbnail
			this.$thumbnailCanvas = $('<canvas/>')
			// Create thumbnail cache level
			this.$thumbnailCanvasBufferContainer = $('<div/>')
			this.$thumbnailCanvasBuffer = $('<canvas/>')
			// Used to capture mouse events
			this.$thumbnailOverlay = $('<dib class="cytoscape-navigatorThumbnailOverlay"/>')

			// Add thumbnail container to the DOM
			this.$panel.append(this.$thumbnail)
			// Add canvas cache and its container to the DOM
			this.$thumbnailCanvasBufferContainer.appendTo(this.$panel).hide().append(this.$thumbnailCanvasBuffer)
			// Add thumbnail canvas to the DOM
			this.$thumbnail.append(this.$thumbnailCanvas)
			// Add thumbnail overlay to the DOM
			this.$panel.append(this.$thumbnailOverlay)
		}

	, _setupThumbnail: function () {
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
				_left = (this.$panel.width() - _width)/2
			} else {
				// panel height is bigger than thumbnail height
				_width = this.$panel.width()
				_height = this.$panel.width() / navigatorThumbnailRatio
				_top = (this.$panel.height() - _height)/2
			}

			// Setup Thumbnail
			this.$thumbnail.width(_width)
			this.$thumbnail.height(_height)
			this.$thumbnail.css({left: _left, top: _top})

			// Setup Canvas
			this.$thumbnailCanvas.attr('width', _width)
			this.$thumbnailCanvas.attr('height', _height)

			// Setup Canvas cache
			this.$thumbnailCanvasBuffer.attr('width', this.width)
			this.$thumbnailCanvasBuffer.attr('height', this.height)

			// Setup Overlay
			this.$thumbnailOverlay.width(_width)
			this.$thumbnailOverlay.height(_height)
			this.$thumbnailOverlay.css({left: _left, top: _top})

			// Cache Thumbnail sizes
			this.eventData.thumbnailSizes.width = _width
			this.eventData.thumbnailSizes.height = _height

			that._updateThumbnailImage()
		}

	, _setupThumbnailSizes: function () {
			var boundingBox = this.cy.elements().boundingBox()

			this.$thumbnail.zoom = Math.min(this.height /  boundingBox.h, this.width /  boundingBox.w)

			// Used on thumbnail generation
			this.$thumbnail.pan = {
				x: (this.width - this.$thumbnail.zoom * (boundingBox.x1 + boundingBox.x2))/2
			, y: (this.height - this.$thumbnail.zoom * (boundingBox.y1 + boundingBox.y2))/2
			}
		}

		// If bounding box has changed then update sizes
		// Else just update thumbnail
	, _checkThumbnailSizeAndUpdate: function () {
			// TODO make this part beautiful
			var _zoom = this.$thumbnail.zoom
				, _pan_x = this.$thumbnail.pan.x
				, _pan_y = this.$thumbnail.pan.y

			this._setupThumbnailSizes()

			if (_zoom != this.$thumbnail.zoom || _pan_x != this.$thumbnail.pan.x || _pan_y != this.$thumbnail.pan.y) {
				this._setupThumbnail()
				this._setupView()
			} else {
				this._updateThumbnailImage()
			}
		}

	, _initView: function () {
			var that = this

			this.$view = $('<div class="cytoscape-navigatorView"/>')
			this.$thumbnail.append(this.$view)
		}

	, _setupView: function () {
			if (this.eventData.viewSetup.locked)
				return

			this.$view.borderWidth = parseInt(this.$view.css('border-left-width'), 10)

			var width = 0
				, height = 0
				, position = {left: 0, top: 0}
				// thumbnail available sizes
				, thumbnailBorderDouble = this.$view.borderWidth * 2
				, thumbnailWidth = this.$thumbnail.width() - thumbnailBorderDouble
				, thumbnailHeight = this.$thumbnail.height() - thumbnailBorderDouble
				, cyZoom = this.cy.zoom()
				// , cyWidth = this.width * cyZoom
				// , cyHeight = this.height * cyZoom
				, cyPan = {
						x: this.cy.pan().x
					, y: this.cy.pan().y
					}
				, bb = this.cy.elements().boundingBox()
				, bb_w = this.width / this.$thumbnail.zoom  // bounding box with graph's proportions
				, bb_h = this.height / this.$thumbnail.zoom // bounding box with graph's proportions

			// TODO restore condition
			// if (cyPan.x > this.width || cyPan.x < -cyWidth || cyPan.y > this.height || cyPan.y < -cyHeight) {
			if (false) {
				this.$view.hide()
			} else {
				// Horizontal computation
				position.left = -((cyPan.x - bb_w + bb.w)/cyZoom + bb.x1) * thumbnailWidth / bb_w
				position.right = position.left + (thumbnailWidth / cyZoom * this.$thumbnail.zoom)

				// Limit view inside thumbnails borders
				position.left = Math.max(0, position.left)
				position.right = Math.min(thumbnailWidth, position.right)

				// Compute width and remove position.right
				width = position.right - position.left
				;// for delete
				delete position.right

				// Vertical computation
				position.top = -((cyPan.y - bb_h + bb.h)/cyZoom + bb.y1) * thumbnailHeight / bb_h
				position.bottom = position.top + (thumbnailHeight / cyZoom * this.$thumbnail.zoom)

				// Limit view inside thumbnails borders
				position.top = Math.max(0, position.top)
				position.bottom = Math.min(thumbnailHeight, position.bottom)

				// Compute width and remove position.bottom
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
		Event handling functions
	****************************/

	, resize: function () {
			this.initrender()

			// Cache sizes
			this.width = this.$element.width()
			this.height = this.$element.height()

			this._setupPanel()
			this._checkThumbnailSizeAndUpdate()
			this._setupView()
		}

	, _initEventsHandling: function () {
			var that = this
				, eventsAll = [
				// Mouse events
					'mousedown'
				, 'mouseup'
				, 'mouseover'
				, 'mouseout'
				, 'mousemove'
				, 'mousewheel'
				, 'DOMMouseScroll' // Mozilla specific event
				// Touch events
				, 'touchstart'
				, 'touchmove'
				, 'touchend'
				]

			// Initial events data storing
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
				, locked: false
				}
			, timeout: null // used to keep stable frame rate
			, lastMoveStartTime: null
			, thumbnailUpdateLock: false
			, thumbnailUpdateDirty: false
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
						that._eventMoveStart(ev)
					} else if (ev.type == 'mousemove' || ev.type == 'touchmove') {
						that._eventMove(ev)
					} else if (ev.type == 'mouseup' || ev.type == 'mouseout') {
						that._eventMoveEnd(ev)
					} else if (ev.type == 'mousewheel' || ev.type == 'DOMMouseScroll') {
						that._eventZoom(ev)
					} else if (ev.type == 'mouseover') {
						// console.log(ev)
					}
				}

				// Prevent default and propagation
				// Don't use peventPropagation as it breaks mouse events
				return false;
			})
		}

	, _eventMoveStart: function (ev) {
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
				this._eventMove({
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
				// Lock view moving caused by cy events
				_data.viewSetup.locked = true

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
					this._eventMove(ev)
				}
			}
		}

	, _eventMove: function (ev) {
			var that = this
				, _data = this.eventData
				, _x = 0
				, _y = 0
				, thumbnailToViewScale = this.cy.zoom() / this.$thumbnail.zoom
				, viewsMaxSizes

			if (thumbnailToViewScale > 1)
				viewsMaxSizes = {
					width: _data.thumbnailSizes.width / thumbnailToViewScale
				,	height: _data.thumbnailSizes.height / thumbnailToViewScale
				}
			else
				viewsMaxSizes = _data.viewSetup

			this._checkMousePosition(ev)

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
			if (this.options.viewLiveFramerate !== false) {
				// trigger instantly
				if (this.options.viewLiveFramerate == 0) {
					this._moveCy()
				}
				// trigger less often than frame rate
				else if (_data.timeout === null) {
					_data.timeout = setTimeout($.proxy(this._moveCyClearTimeout, this), 1000/this.options.viewLiveFramerate)
				}
			}
		}

	, _checkMousePosition: function (ev) {
			var that = this
				, _view = this.eventData.viewSetup
				, view_border = this.$view.borderWidth

			// All caught events are over thumbnail
			this.$panel.addClass('mouseover-thumbnail')

			if(ev.offsetX > _view.x && ev.offsetX < _view.x + view_border * 2 + _view.width
				&& ev.offsetY > _view.y && ev.offsetY < _view.y + view_border * 2 + _view.height) {
				this.$panel.addClass('mouseover-view')
			} else {
				this.$panel.removeClass('mouseover-view')
			}
		}

	, _eventMoveEnd: function (ev) {
			var _data = this.eventData

			// Unlock view changing caused by graph events
			_data.viewSetup.locked = false

			// Remove classes when mouse is outside of thumbnail
			this.$panel.removeClass('mouseover-thumbnail mouseover-view')

			if (_data.isActive === false) {
				return;
			}

			// Trigger one last move
			this._eventMove(ev)

			// If mode is not live then move graph on drag end
			if (this.options.viewLiveFramerate === false) {
				this._moveCy()
			}

			// State
			_data.isActive = false
		}

	, _eventZoom: function (ev) {
			var zoomRate = Math.pow(10, ev.originalEvent.wheelDeltaY / 1000 || ev.originalEvent.detail / -32)
				, overlay_offset = this.$thumbnailOverlay.offset()
				, mouse_position = {
						left: ev.originalEvent.pageX - overlay_offset.left
					, top: ev.originalEvent.pageY - overlay_offset.top
					}

			if (this.cy.zoomingEnabled()) {
				this._zoomCy(zoomRate, mouse_position)
			}
		}

	, _moveCyClearTimeout: function () {
			this._moveCy()
			this.eventData.timeout = null
		}

	, _hookGraphUpdates: function () {
			this.cy.on('position add remove data', $.proxy(this._checkThumbnailSizeAndUpdate, this, false))
		}

	, _setGraphUpdatesTimer: function () {
			var delay = 1000.0 / this.options.thumbnailLiveFramerate
				, that = this
				, updateFunction = function () {
						// Use timeout instead of interval as it is not accumulating events if events pool is not processed fast enough
						setTimeout(function (){
							that._checkThumbnailSizeAndUpdate(true)
							updateFunction()
						}, delay)
					}

			// Init continuous update
			updateFunction()
		}

	, _updateThumbnailImage: function (force_refresh) {
			var that = this
				, timeout = 0 // will remain 0 if force_refresh is true

			// Set thumbnail update frame rate
			!force_refresh && this.options.thumbnailEventFramerate > 0 && (timeout = ~~(1000 / this.options.thumbnailEventFramerate))

			if (this._thumbUpdateTimeout === undefined || this._thumbUpdateTimeout === null) {
				this._thumbUpdateTimeout = setTimeout(function(){
					// TODO remove double buffering as now it doesn't help to prevent bug #313
					// Copy scaled thumbnail to buffer
					that.cy.renderTo(that.$thumbnailCanvasBuffer[0].getContext('2d'), that.$thumbnail.zoom, that.$thumbnail.pan)
					// Copy thumbnail from buffer to visible canvas
					// Do it in next frame
					setTimeout(function () {
						var context = that.$thumbnailCanvas[0].getContext("2d")
							, thumbnailSizes = that.eventData.thumbnailSizes

						context.globalCompositeOperation = "copy"
						context.drawImage(that.$thumbnailCanvasBuffer[0], 0, 0, that.width, that.height, 0, 0, thumbnailSizes.width, thumbnailSizes.height)

						that._thumbUpdateTimeout = null
					}, 1)
				}, timeout)
			}
		}

	/****************************
		Navigator view moving
	****************************/

	, _moveCy: function () {
			var that = this
				, _data = this.eventData
				// thumbnail available sizes
				, thumbnailBorderDouble = this.$view.borderWidth * 2
				, thumbnailWidth = _data.thumbnailSizes.width - thumbnailBorderDouble
				, thumbnailHeight = _data.thumbnailSizes.height - thumbnailBorderDouble
				, cyZoom = this.cy.zoom()
				, bb = this.cy.elements().boundingBox()
				, bb_w = this.width / this.$thumbnail.zoom  // bounding box with graph's proportions
				, bb_h = this.height / this.$thumbnail.zoom // bounding box with graph's proportions

			this.cy.pan({
				x: -(_data.viewSetup.x / thumbnailWidth * bb_w + bb.x1) * cyZoom + (bb_w - bb.w)
			, y: -(_data.viewSetup.y / thumbnailHeight * bb_h + bb.y1) * cyZoom + (bb_h - bb.h)
			})
		}

	/**
	 * Zooms graph.
	 *
	 * @this {cytoscapeNavigator}
	 * @param {number} zoomRate The zoom rate value. 1 is 100%.
	 */
	, _zoomCy: function (zoomRate, zoomCenterRaw) {
			var _data = this.eventData
				, view = _data.viewSetup
				, scale = 1.0 * this.width / _data.thumbnailSizes.width
				, zoomCenter
				, zoomCenterRelative
				, isZoomCenterInView = false

			if (zoomCenterRaw) {
				isZoomCenterInView = (zoomCenterRaw.left > view.x) && (zoomCenterRaw.left < view.x + view.width)
					&& (zoomCenterRaw.top > view.y) && (zoomCenterRaw.top < view.y + view.height)
			}

			if (zoomCenterRaw && isZoomCenterInView) {
				zoomCenter = {
					x: (zoomCenterRaw.left - view.x) * (1.0 * this.width / view.width)
				, y: (zoomCenterRaw.top - view.y) * (1.0 * this.height / view.height)
				}
			} else {
				zoomCenter = {
					x: scale * (view.x + view.width/2)
				, y: scale * (view.y + view.height/2)
				}
			}

			// Zoom about View center
			this.cy.zoom({
				level: this.cy.zoom() * zoomRate
			, position: zoomCenter
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
				} else if (option.charAt(0) == '_') {
					$.error("cyNavigator."+option+" is a private function")
				} else {
					data[option].call(data, Array.prototype.slice.call(_arguments, 1))
				}
			}
		})
	}

	$.fn.cytoscapeNavigator.Constructor = Navigator

	$.fn.cytoscapeNavigator.defaults = {
		container: false // can be a HTML or jQuery element or jQuery selector
	, viewLiveFramerate: 0 // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
	, thumbnailEventFramerate: 10 // max thumbnail's updates per second triggered by graph updates
	, thumbnailLiveFramerate: false // max thumbnail's updates per second. Set false to disable
	, dblClickDelay: 200 // milliseconds
	}

	$.fn.cyNavigator = $.fn.cytoscapeNavigator

})(jQuery)
