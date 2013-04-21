;(function($){
	
	var defaults = {
		forceClassName: true
	, className: 'cytoscape-navigationPanel'
	, position: {
			vertical: 400 // can be 'top', 'bottom', 'middle', a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		, horizontal: 400 // can be 'left', 'right', 'center', a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		}
	, size: {
			width: 200 // can be a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
		, height: 200 // can be a number (will be used as px), a string which contains a number +px or +%. Percent will be computed based on container size.
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

					// Save a reference to navigation panel into dom element
					$container[0].navigationPanel = $navigationPanel

					// TODO accept all described options
					$navigationPanel.width(options.size.width)
					$navigationPanel.height(options.size.height)
					$navigationPanel.css({top: options.position.vertical, left: options.position.horizontal})

					// Add navigator view
					$navigationView = $('<div class="cytoscape-navigationView"/>');
					$navigationPanel.append($navigationView);

					// Save a reference to navigation view
					$container[0].navigationView = $navigationView;

					// Set default navigaion view size
					// TODO init depending on viewport sizes
					$navigationView.width(100)
					$navigationView.height(100)

					// Make navigation view draggable
					// TODO get rid of jQuery UI 
					$navigationView.draggable({ containment: $navigationPanel, scroll: false })
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
