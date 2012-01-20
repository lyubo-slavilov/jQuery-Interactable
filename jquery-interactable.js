/*
jQuery Interactable
author: Lyubomir Slavilov
*/
(function($){
	//CLASSES
	$.interactableVector = function(x, y){
		var length = function(vector){
			return Math.sqrt(vector.x*vector.x + vector.y*vector.y);
		}
		return {
			x: x,
			y: y,
			w: length(this),
			add: function(vector){
				this.x = this.x + vector.x;
				this.y = this.y + vector.y;
				this.w = length(this);
				return this;
			},
			scale: function(factor){
				this.x = factor*this.x;
				this.y = factor*this.y;
				this.w = length(this);
				return this;
			},
			direction: function(){
				return $.interactableVector(this.x/this.w, this.y/this.w);
			}
			
		}
	};
	$.interactableKinematics = function(options){
		var KI={};
		KI.space = $.interactableVector(0,0);
		KI.space.delta = $.interactableVector(0,0);
		KI.speed = $.interactableVector(0,0);
		KI.speed.delta = $.interactableVector(0,0);
		KI.acceleration = $.interactableVector(0,0);
		KI.deltaT = 0;
		KI.time = parseInt(new Date().getTime()),
		KI.options = options;
		
		//update()
		KI.update = function(newX, newY){
			var timeDelta = parseInt(new Date().getTime()) - this.time;
			if(timeDelta == 0) return this;
			var oldSpace = this.space;
			var oldSpeed = this.speed;
			
			//Radius vector and space characteristics
			this.space = $.interactableVector(newX, newY);
			this.space.delta = $.interactableVector(newX - oldSpace.x, newY - oldSpace.y);

			//speed
			this.speed = this.space.delta.scale(1/timeDelta);
			this.speed.delta = $.interactableVector(this.speed.x - oldSpeed.x, this.speed.y - oldSpeed.y);

			//acceleration
			this.acceleration = this.speed.delta.scale(1/timeDelta);
			this.time = parseInt(new Date().getTime());
			this.deltaT = this.time - this.time;
			return this;
		}
		return KI;
	};
	//INTERACTABLE
	var methods = {
		init: function(options){
		  
			var
			$window = $(window),
			wdata = $(window).data('interactable');
		  
			
			if($window[0] === this[0]){
				//intitialize the window object
				options = $.extend({
					friction: 1
				}, options);
			  
				if(!wdata){
					wdata= {
						kinematics: $.interactableKinematics(options)
					};
					$window.data('interactable', wdata);					
					$window.bind('mousemove.interactable', function(e){
						$window.data('interactable').kinematics.update(e.pageX, e.pageY);
					});
				}
				return this;
			}else{
				//initialize other objects
				
				return this.each(function(){
					var $that = $(this);
					
					//fixes some hilarious bug - the DOMWindow object is in the set ???
					if($that[0] == $window) return;
					
					options = $.extend({
						drag:{
							stop:function(){}
						},
						axis: 'both',
						mass: 1
					}, options);
					$that.addClass('interactable');
					$that.attr('position', 'absolute');
					//used to prevent movements by axis if the other axis is set in options
					var maskX = (options.axis == 'both' || options.axis == 'x') ? 1:0;
					var maskY = (options.axis == 'both' || options.axis == 'y') ? 1:0;

					var customStop = options.drag.stop

					//make it dragable

					//extend the draggable stop method
					var extendedStop = function(event, ui){
						var ki = $window.data('interactable').kinematics;
						var a = 0.003*Math.abs(ki.options.friction)*options.mass; //do not allow negative friction
						
						//TODO add mass feature of the objects into the game 

						if(a==0) a = 0.00001; //almost no friction
						var t =  ki.speed.w/a;
						var s = ki.speed.w*t - t*t*a/2;
						var newPosition = ki.speed.direction().scale(s);
						if(!ui) return;
						$(this).animate({
							left: ui.position.left + newPosition.x*maskX,
							top: ui.position.top + newPosition.y*maskY
						}, t, 'easeOutQuad');
						//callout the user defined stop method
						if(typeof(customStop) == 'function') customStop();
					};

					//extend the draggable start method
					var customStart = options.drag.start;
					var extendedStart = function(){
						//stop all animations
						$(this).stop();
						if(typeof(customStart) == 'function') customStart();
					}
					options.drag.stop = extendedStop;
					options.drag.start = extendedStart;
					$that.draggable(options.drag);
				});
			}
		},
		destroy: function(){
			if($(this)[0] === $(window)[0]){
				$('.interactable').interactable('destroy');
				$(window).unbind('.interactable');
				$(window).removeData('interactable')
			}else{
				$(this).draggable('destroy');
			}
		}
	};
	
	//extend the jQuery
	$.fn.interactable = function( method ) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.interactable' );
		}    
  
	};
})(jQuery)