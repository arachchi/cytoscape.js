;(function($){
	
	var defaults = {
		forceClassName: true
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
	
	$.fn.cytoscapeNavigationPanel = function(params){
		var options = $.extend(true, {}, defaults, params);
		var fn = params;
		
		var functions = {
			destroy: function(){
				this.navigationPanel != undefined && this.navigationPanel instanceof jQuery && this.navigationPanel.remove();
			},
				
			init: function(){
				return $(this).each(function(){
					var $container = $(this)
						, $navigationPanel
						;
					
					if( options.container != undefined ){
						if( options.container instanceof jQuery ){
							if( options.container.length > 0 ){
								$navigationPanel = options.container.first();

								// Add class name
								options.forceClassName && $navigationPanel.addClass(options.className);
							} else {
								$.error("Container for jquery.cyNavigationPanel is empty");
								return;
							}
						} else if ( $(options.container).length > 0 ) {
							$navigationPanel = $(options.container).first();

							// Add class name
							options.forceClassName && $navigationPanel.addClass(options.className);
						} else {
							$.error("There is no any element matching your selector for jquery.cyNavigationPanel");
							return;
						}
					} else {
						$navigationPanel = $('<div class="cytoscape-navigationPanel"/>');
						$container.append( $navigationPanel );
					}

					// Save a reference into container dom element
					$container[0].navigationPanel = $navigationPanel;

					// TODO accept all described options
					$navigationPanel.width(options.size.width);
					$navigationPanel.height(options.size.height);
					$navigationPanel.css({top: options.position.vertical, left: options.position.horizontal});

					// Add thumbnail
					var $navigationThumbnail = $('<dib class="cytoscape-navigationThumbnail"/>')
						, navigationPanelRatio = 1.0 * $navigationPanel.width() / $navigationPanel.height()
						, navigationThumbnailRatio = 1.0 * $container.width() / $container.height()
						;

					if( navigationPanelRatio > navigationThumbnailRatio ) {
						// panel width is bigger than thumbnail width
						$navigationThumbnail.width(navigationThumbnailRatio * $navigationPanel.height());
						$navigationThumbnail.height($navigationPanel.height());
						$navigationThumbnail.css({left: ($navigationPanel.width() - $navigationThumbnail.height())/2});
					} else {
						// panel height is bigger than thumbnail height
						$navigationThumbnail.width($navigationPanel.width());
						$navigationThumbnail.height(navigationThumbnailRatio * $navigationPanel.width());
						$navigationThumbnail.css({top: ($navigationPanel.height() - $navigationThumbnail.width())/2});
					}

					// TODO Populate thumbnail with a render of graph

					// Add thumbnail to the dom
					$navigationPanel.append($navigationThumbnail);
					// Save a reference into container dom element
					$container[0].navigationThumbnail = $navigationThumbnail;

					// Add navigator view
					var $navigationView = $('<div class="cytoscape-navigationView"/>');
					$navigationThumbnail.append($navigationView);

					// Save a reference into container dom element
					$container[0].navigationView = $navigationView;

					// Set default navigaion view size
					// TODO init depending on viewport sizes
					$navigationView.width(100);
					$navigationView.height(100);

					// Make navigation view draggable
					// TODO get rid of jQuery UI 
					$navigationView.draggable({ containment: $navigationThumbnail, scroll: false });
				})
			}
		};
		
		if( functions[fn] ){
			return functions[fn].apply(this, Array.prototype.slice.call( arguments, 1 ));
		} else if( typeof fn == 'object' || !fn ) {
			return functions.init.apply( this, arguments );
		} else {
			$.error("No such function `"+ fn +"` for jquery.cyNavigationpanel");
		}
		
		return $(this);
	};

	$.fn.cyNavigationPanel = $.fn.cytoscapeNavigationPanel;
	
})(jQuery);
