# Cytoscape Navigator

## About the plugin

Navigation Panel is usually a smaller window/panel/block which is a mirror of main window. It has few main purposes:

* Display a bird’s eye view over main window
* Display which part of main window now is visible
* Remote navigation over main window

## Examples

[Examples page](http://bumbu.github.io/cytoscape.js/debug/navigator.html)

## Available options

### conainer 
    container: false
    
Can be a HTML or jQuery element or jQuery selector

Used to indicate navigator HTML container. If is false then a new DOM Element is created.

### className
    className: 'cytoscape-navigator'
    
This class name will be added to navigator container
    

### position

Used to set navigator position.

Each parameter accepts following options:
* a number (will be used as px)
* a function (which returns a number)
* a string which ends in _px_ 
* a string which ends in _%_ (will be computed based on graph sizes)
* one of the strings (only for vertical):
  * top
  * bottom
  * middle
* one of the srings (only for horizontal):
  * left
  * right
  * center

#### position vertical 
    position: {
  		vertical: 'bottom'
    }
    
#### position horizontal
    position: {
    	horizontal: 'right'
    }

### size 

Used to set navigator size.

Each parameter accepts following options:
* a number (will be used as px)
* a function (which returns a number)
* a string which ends in _px_ 
* a string which ends in _%_ (will be computed based on graph sizes)

#### size width 
    size: {
    	width: 200
    }

#### size height
    size: {
    	height: 150
    }
    
### view 

#### view borderWidth 
	  view: {
			borderWidth: 0
		}
    
### viewLiveFramerate
    viewLiveFramerate: 0
    
Set false to update graph pan (position) only on navigator's view drag end.
Set 0 to instantly update graph pan when navigator's view is dragged.
Set a positive number (N frames per second) to update navigator's view not more than N times per second.

### thumbnailEventFramerate
    thumbnailEventFramerate: 10
    
Maximal number of thumbnail update's per second triggered by graph events.

### thumbnailLiveFramerate
    thumbnailLiveFramerate: false
    
Maximal number of constant thumbnail update's per second. Set false to disable.

### dblClickDelay
    dblClickDelay: 200
    
Maximal delay (in miliseconds) between two clicks to consider them as a double click.

## Public API

Access plugin methods by calling cyNavigator('function name') from jQuery element graph container:

    $('#cytoscape').cyNavigator('resize') // call resize event to refresh navigator data
    
List of available methods:
* destroy
* resize

