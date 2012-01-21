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
				
				return this.each(function(idx, el){
					var $that = $(this);
					options = $.extend({
						drag:{
							stop:function(){}
						},
						axis: 'both',
						mass: 1,
						maxTravel: 0,
						constraintBy: 'firstEdge'
					}, options);
					
					$that.addClass('interactable');
					$(this).data('interactable', {});
					
					//used to prevent movements by axis if the other axis is set in options
					var maskX = (options.axis == 'both' || options.axis == 'x') ? 1:0;
					var maskY = (options.axis == 'both' || options.axis == 'y') ? 1:0;

					
					
					//extend the ANIMATION STEP method
					var stepFunction = function(correction, Now, Fx){
						var $elem = $(Fx.elem);
						var corr;
						if(Fx.prop == 'left'){
							corr = correction.x
						}else{
							corr = correction.y;
						}
						
						//Fx.end = 100;
						
						var parent = $elem.parent();
						var out = null;
						
						if(Fx.prop == 'left'){
							if(options.constraintBy == 'firstEdge'){
								out = ($elem.offset().left < parent.offset().left-100)?0:null;
								if(out===null)
									out = ($elem.offset().left + $elem.width() > parent.offset().left + parent.width()+100)?
												parent.offset().left + parent.width() - $elem.width():
												null;
							}else{
								out = ($elem.offset().left + $elem.width() < parent.offset().left)?0:null;
								if(out === null)
									out = ($elem.offset().left > parent.offset().left + parent.width())?
												parent.offset().left + parent.width() - $elem.width():
												null;
							}
						}else{
							if(options.constraintBy == 'firstEdge'){
								out = ($elem.offset().top < parent.offset().top-100)?0:null;
								if(out===null)
									out = ($elem.offset().top + $elem.height() > parent.offset().top + parent.height()+100)?
												parent.offset().top + parent.height() - $elem.height():
												null;
							}else{
								out = ($elem.offset().top + $elem.height() < parent.offset().top)?0:null;
								if(out === null)
									out = ($elem.offset().top > parent.offset().top + parent.height())?
												parent.offset().top + parent.height() - $elem.height():
												null;
							}
						}
						if(out !== null){
							Fx.end = out+corr;
							Fx.start = Now;
						}
					};
					
					//extend the DRAGGABLE STOP handler
					var customStop = options.drag.stop;
					var extendedStop = function(event, ui){
						if(this == window) return;
						var ki = $window.data('interactable').kinematics;
						var a = 0.003*Math.abs(ki.options.friction)*options.mass; //do not allow negative friction
						
						//TODO add mass feature of the objects into the game 
						
						if(a==0) a = 0.00001; //almost no friction
						var t =  ki.speed.w/a;
						var s = ki.speed.w*t - t*t*a/2;
						
						if(options.maxTravel < s && options.maxTravel > 0){
							s = options.maxTravel;
							t = Math.sqrt(s/a);
						}
						var newPosition = ki.speed.direction().
							scale(s).
							add($.interactableVector(ui.position.left, ui.position.top));
						$(this).data('interactable').targetPos = newPosition;
						if(!ui) return;
						
						var corrVector = $.interactableVector(ui.position.left - $(this).position().left, ui.position.top - $(this).position().top )
						$(this).animate({
							left: newPosition.x*maskX,
							top: newPosition.y*maskY
						},{
							duration: t,
							easing: 'easeOutQuad', 
							step: function(now, fx){
									stepFunction(corrVector, now, fx);
							}
						});
						//callout the user defined stop handler
						if(typeof(customStop) == 'function') customStop();
					};

					//extend the DRAGGABLE START handler
					var customStart = options.drag.start;
					var extendedStart = function(){
						//stop all animations
						$(this).stop();
						if(typeof(customStart) == 'function') customStart();
					}
					
					
					options.drag.stop = extendedStop;
					options.drag.start = extendedStart;
					//options.drag.drag = extendedDrag;
					
					//make it dragable
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