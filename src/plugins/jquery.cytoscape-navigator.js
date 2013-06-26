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
			this.$element.cytoscape('get').on('zoom pan', function () {
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
			options.size._width = this.convertSizeToNumber(options.size.width, this.$element.width())
			options.size._height = this.convertSizeToNumber(options.size.height, this.$element.height())

			// Set sizes
			this.$panel.width(options.size._width)
			this.$panel.height(options.size._height)

			// Cache position
			options.position._horizontal = this.convertPositionToNumber(options.position.horizontal, this.$element.width(), options.size._width)
			options.position._vertical = this.convertPositionToNumber(options.position.vertical, this.$element.height(), options.size._height)

			// Set positions
			this.$panel.css({left: options.position._horizontal, top: options.position._vertical})
		}

	, initThumbnail: function () {
			this.$thumbnail = $('<dib class="cytoscape-navigatorThumbnail"/>')

			// Add thumbnail to the dom
			this.$panel.append(this.$thumbnail)
		}

	, setupThumbnail: function () {
			var navigatorRatio = 1.0 * this.$panel.width() / this.$panel.height()
				, navigatorThumbnailRatio = 1.0 * this.$element.width() / this.$element.height()

			if( navigatorRatio > navigatorThumbnailRatio ) {
				// panel width is bigger than thumbnail width
				this.$thumbnail.width(navigatorThumbnailRatio * this.$panel.height())
				this.$thumbnail.height(this.$panel.height())
				this.$thumbnail.css({left: (this.$panel.width() - this.$thumbnail.height())/2})
			} else {
				// panel height is bigger than thumbnail height
				this.$thumbnail.width(this.$panel.width())
				this.$thumbnail.height(navigatorThumbnailRatio * this.$panel.width())
				this.$thumbnail.css({top: (this.$panel.height() - this.$thumbnail.width())/2})
			}

			this.eventData.thumbnailSizes.width = this.$thumbnail.width()
			this.eventData.thumbnailSizes.height = this.$thumbnail.height()

			// TODO Populate thumbnail with a render of the graph
		}

	, initView: function () {
			var that = this
				// , cy = this.$element.cytoscape('get')

			this.$view = $('<div class="cytoscape-navigatorView"/>')
			this.$thumbnail.append(this.$view)

			// Make navigator view draggable
			// TODO get rid of jQuery UI
/*			this.$view.draggable({
				containment: this.$thumbnail
			, scroll: false
			, start: function () {}
			, drag: function () {
					if( that.options.live ) {
						// TODO move only when cy finished previous rendering
						that.moveCy()
					}
				}
			, stop: function () {
					if( !that.options.live ) {
						that.moveCy()
					}
				}
			})*/

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
				, cy = this.$element.cytoscape('get')
				, cyZoom = cy.zoom()
				, cyPan = cy.pan()
				, elementWidth = this.$element.width()
				, elementHeight = this.$element.height()
				, cyWidth = elementWidth * cyZoom
				, cyHeight = elementHeight * cyZoom

			if( cyPan.x > elementWidth || cyPan.x < -cyWidth || cyPan.y > elementHeight || cyPan.y < -cyHeight) {
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
				// Touch events
				, 'touchstart'
				, 'touchmove'
				, 'touchend'
				]
				, eventsGlobal = [
				// Mouse events
				  'mouseup'
				, 'mousemove'
				// Touch events
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
			, mousePositionPrev: { // relative to Thumbnail
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
			}

			// handle events and stop their propagation
			this.$panel.on(eventsAll.join(' '), function (ev) {
				if (ev.stopPropagation) {
					ev.stopPropagation()
				}
				// otherwise set the cancelBubble property of the original event to true (IE)
				ev.cancelBubble = true;

				// Delegate event handling
				if (ev.type == 'mousedown' || ev.type == 'touchstart') {
					that.eventMoveStart(ev)
				} else if (ev.type == 'mousemove' || ev.type == 'touchmove') {
					that.eventMove(ev)
				} else if (ev.type == 'mouseup' || ev.type == 'touchend') {
					that.eventMoveEnd(ev)
				} else if (ev.type == 'mouseover' || ev.type == 'mouseout') {
					// console.log(ev)
				}
			})

			// Hook move and up/end globally
			$(window).on(eventsGlobal.join(' '), function (ev) {
				// Delegate event handling
				if (ev.type == 'mousemove' || ev.type == 'touchmove') {
					that.eventMove(ev)
				} else if (ev.type == 'mouseup' || ev.type == 'touchend') {
					that.eventMoveEnd(ev)
				}
			})
		}

	, eventMoveStart: function (ev) {
			var _data = this.eventData

			// if event started in View
			if (ev.target == this.$view[0]) {
				_data.isActive = true
				_data.hookPoint.x = ev.offsetX
				_data.hookPoint.y = ev.offsetY
				_data.mousePositionPrev.x = _data.viewSetup.x + ev.offsetX
				_data.mousePositionPrev.y = _data.viewSetup.y + ev.offsetY
			}
			// if event started in Thumbnail (outside of View)
			else if (ev.target == this.$thumbnail[0]) {
				// TODO move View into given position
			}

			// console.log(ev)
		}

	, eventMove: function (ev) {
			var _data = this.eventData

			if (_data.isActive === false) {
				return;
			}

			//
			console.log(ev)
		}

	, eventMoveEnd: function (ev) {
			var _data = this.eventData

			if (_data.isActive === false) {
				return;
			}

			//

			// State
			_data.isActive = false
			console.log(ev)
		}

	/****************************
		Navigator view moving
	****************************/

	, moveCy: function () {
			var that = this
				, position = {
						left: parseFloat(that.$view.css('left'))
					, top: parseFloat(that.$view.css('top'))
					}
				// thumbnail available sizes
				, borderDouble = this.options.view.borderWidth * 2
				, thumbnailWidth = this.$thumbnail.width() - borderDouble
				, thumbnailHeight = this.$thumbnail.height() - borderDouble
				// cy vieport sizes
				, cy = this.$element.cytoscape('get')
				, cyZoom = cy.zoom()
				, cyPanNew = {x: 0, y: 0}
				, elementWidth = this.$element.width()
				, elementHeight = this.$element.height()
				, cyWidth = elementWidth * cyZoom
				, cyHeight = elementHeight * cyZoom

			cyPanNew.x = -position.left * cyWidth / thumbnailWidth
			cyPanNew.y = -position.top * cyHeight / thumbnailHeight

			cy.pan(cyPanNew)
		}

	}

	$.fn.cytoscapeNavigator = function ( option ) {
		return this.each(function () {
			var $this = $(this)
				, data = $this.data('navigator')
				, options = typeof option == 'object' && option

			if (!data) {
				$this.data('navigator', (data = new Navigator(this, options)))
			}
			// TODO add handling of more function arguments
			if (typeof option == 'string') {
				data[option]()
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
	}

	$.fn.cyNavigator = $.fn.cytoscapeNavigator

})(jQuery)
