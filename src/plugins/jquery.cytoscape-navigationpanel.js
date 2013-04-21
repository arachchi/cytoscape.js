;(function($){
	
	var defaults = {
		forceClassName: true
	, className: 'cytoscape-navigationpanel'
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
	
	$.fn.cytoscapeNavigationpanel = function(params){
		var options = $.extend(true, {}, defaults, params);
		var fn = params;
		
		var functions = {
			destroy: function(){
				this.navigationpanel != undefined && this.navigationpanel instanceof jQuery && this.navigationpanel.remove();
			},
				
			init: function(){
				return $(this).each(function(){
					var $container = $(this)
						, $navigationpanel
						;
					
					if( options.container != undefined ){
						if( options.container instanceof jQuery ){
							if( options.container.length > 0 ){
								$navigationpanel = options.container.first();

								// Add class name
								options.forceClassName && $navigationpanel.addClass(options.className);
							} else {
								$.error("Container for jquery.cyNavigationpanel is empty");
								return;
							}
						} else if ( $(options.container).length > 0 ) {
							$navigationpanel = $(options.container).first();

							// Add class name
							options.forceClassName && $navigationpanel.addClass(options.className);
						} else {
							$.error("There is no any element matching your selector for jquery.cyNavigationpanel");
							return;
						}
					} else {
						$navigationpanel = $('<div class="cytoscape-navigationpanel"/>');
						$container.append( $navigationpanel );
					}

					// Save a reference to navigation panel into dom element
					$container[0].navigationpanel = $navigationpanel

					// TODO accept all described options
					$navigationpanel.width(options.size.width)
					$navigationpanel.height(options.size.height)
					$navigationpanel.css({top: options.position.vertical, left: options.position.horizontal})

					// Add navigator view
					$navigationview = $('<div class="cytoscape-navigationview"/>');
					$navigationpanel.append($navigationview);

					// Save a reference to navigation view
					$container[0].navigationview = $navigationview;

					// Set default navigaion view size
					// TODO init depending on viewport sizes
					$navigationview.width(100)
					$navigationview.height(100)

					// Make navigation view draggable
					// TODO get rid of jQuery UI 
					$navigationview.draggable({ containment: $navigationpanel, scroll: false })
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

	$.fn.cyNavigationpanel = $.fn.cytoscapeNavigationpanel;
	
})(jQuery);
