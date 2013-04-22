;(function($){

	"use strict"; // jshint ;_;

	var NavigationPanel = function ( element, options ) {
		this.init(element, options);
	};

	NavigationPanel.prototype = {

		constructor: NavigationPanel

	, init: function ( element, options ) {
			this.$element = $(element)
			this.options = $.extend(true, {}, $.fn.cytoscapeNavigationPanel.defaults, options);
			this.initPanel()
		}

	, destroy: function () {
			this.$element.remove();
		}

	, initPanel: function () {
			var options = this.options;

			if( options.container ) {
				if( options.container instanceof jQuery ){
					if( options.container.length > 0 ){
						this.$panel = options.container.first();

						// Add class name
						options.forceClassName && this.$panel.addClass(options.className);
					} else {
						$.error("Container for jquery.cyNavigationPanel is empty");
						return;
					}
				} else if ( $(options.container).length > 0 ) {
					this.$panel = $(options.container).first();

					// Add class name
					options.forceClassName && this.$panel.addClass(options.className);
				} else {
					$.error("There is no any element matching your selector for jquery.cyNavigationPanel");
					return;
				}
			} else {
				this.$panel = $('<div class="'+options.className+'"/>');
				this.$element.append(this.$panel);
			}

			// TODO accept all described options
			// TODO move to other function
			this.$panel.width(options.size.width);
			this.$panel.height(options.size.height);
			this.$panel.css({top: options.position.vertical, left: options.position.horizontal});

			this.initThumbnail();
		}

	, initThumbnail: function () {
			this.$thumbnail = $('<dib class="cytoscape-navigationThumbnail"/>');

			var navigationPanelRatio = 1.0 * this.$panel.width() / this.$panel.height()
				, navigationThumbnailRatio = 1.0 * this.$element.width() / this.$element.height()
				;

			if( navigationPanelRatio > navigationThumbnailRatio ) {
				// panel width is bigger than thumbnail width
				this.$thumbnail.width(navigationThumbnailRatio * this.$panel.height());
				this.$thumbnail.height(this.$panel.height());
				this.$thumbnail.css({left: (this.$panel.width() - this.$thumbnail.height())/2});
			} else {
				// panel height is bigger than thumbnail height
				this.$thumbnail.width(this.$panel.width());
				this.$thumbnail.height(navigationThumbnailRatio * this.$panel.width());
				this.$thumbnail.css({top: (this.$panel.height() - this.$thumbnail.width())/2});
			}

			// TODO Populate thumbnail with a render of graph

			// Add thumbnail to the dom
			this.$panel.append(this.$thumbnail);

			this.initView();
		}

	, initView: function () {
			this.$view = $('<div class="cytoscape-navigationView"/>');
			this.$thumbnail.append(this.$view);

			// Set default navigaion view size
			// TODO init depending on viewport sizes
			this.$view.width(100).height(100);

			// Make navigation view draggable
			// TODO get rid of jQuery UI 
			this.$view.draggable({ containment: this.$thumbnail, scroll: false });
		}

	}

	$.fn.cytoscapeNavigationPanel = function ( option ) {
		return this.each(function () {
			var $this = $(this)
				, data = $this.data('navigationPanel')
				, options = typeof option == 'object' && option
				;
			if ( !data ) $this.data('navigationPanel', (data = new NavigationPanel(this, options)));
			// TODO add handling of more function arguments
			if ( typeof option == 'string' ) data[option]();
		})
	}

	$.fn.cytoscapeNavigationPanel.Constructor = NavigationPanel;

	$.fn.cytoscapeNavigationPanel.defaults = {
		container: false
	, forceClassName: true
	, className: 'cytoscape-navigationPanel'
	, position: {
			vertical: 450 // can be 'top', 'bottom', 'middle', a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		, horizontal: 400 // can be 'left', 'right', 'center', a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		}
	, size: {
			width: 200 // can be a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		, height: 150 // can be a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		}
	, view: {
			borderWidth: 1
		}
	};

	$.fn.cyNavigationPanel = $.fn.cytoscapeNavigationPanel;

})(jQuery);
