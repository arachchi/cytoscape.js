!(function($){

	"use strict";

	var Navigator = function ( element, options ) {
		this.init(element, options)
	}

	Navigator.prototype = {

		constructor: Navigator

	, init: function ( element, options ) {
			this.$element = $(element)
			this.options = $.extend(true, {}, $.fn.cytoscapeNavigator.defaults, options)
			this.initPanel()
		}

	, destroy: function () {
			this.$element.remove()
		}

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

			// TODO accept all described options
			// TODO move to other function
			this.$panel.width(options.size.width)
			this.$panel.height(options.size.height)
			this.$panel.css({top: options.position.vertical, left: options.position.horizontal})

			this.initThumbnail()
		}

	, initThumbnail: function () {
			this.$thumbnail = $('<dib class="cytoscape-navigatorThumbnail"/>')

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

			// TODO Populate thumbnail with a render of graph

			// Add thumbnail to the dom
			this.$panel.append(this.$thumbnail)

			this.initView()
		}

	, initView: function () {
			var that = this
				// , cy = this.$element.cytoscape('get')
				

			this.$view = $('<div class="cytoscape-navigatorView"/>')
			this.$thumbnail.append(this.$view)

			// Make navigator view draggable
			// TODO get rid of jQuery UI 
			this.$view.draggable({
				containment: this.$thumbnail
			, scroll: false
			, start: function () {}
			, drag: function () {
					if( that.options.live ) {
						// TODO move only when cy fineshed previous rendering
						that.moveCy()
					}
				}
			, stop: function () {
					if( !that.options.live ) {
						that.moveCy()
					}
				}
			})

			// TODO find a way to stop propadation of mousemove. May be achived by replacing jQuery UI
			this.$view.on('click.navigator mousedown.navigator touchstart.navigator ', function (ev) {
				ev.stopPropagation()
			})

			// Set default navigaion view size
			this.setView()

			// Hook cy zoom
			this.$element.cytoscape('get').on('zoom pan', function () {
				that.setView()
			})
			// TODO hook cy move/pan
		}

	, setView: function () {
			var width = 0
				, height = 0
				, position = {left: 0, top: 0}
				, visible = true
				// thumbnail available sizes
				, borderDouble = this.options.view.borderWidth * 2
				, thumbnailWidth = this.$thumbnail.width() - borderDouble
				, thumbnailHeight = this.$thumbnail.height() - borderDouble
				// cy wieport sizes
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
			}

		}

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
				// cy wieport sizes
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
