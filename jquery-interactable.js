/*
author: Lyubomir Slavilov
*/
(function($){
	//CLASSES
	$.interactableVector = function(x, y){
		length = function(vector){
			return Math.sqrt(vector.x*vector.x + vector.y*vector.y);
		}
		return {
			x: x,
			y: y,
			w: Math.sqrt(x*x + y*y),
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
		KI.update = function(newX, newY, speedFactor){
			var timeDelta = parseInt(new Date().getTime()) - this.time;
			if(timeDelta == 0) return this;
			var oldSpace = this.space;
			var oldSpeed = this.speed;
			
			//Radius vector and space characteristics
			this.space = $.interactableVector(newX, newY);
			this.space.delta = $.interactableVector(newX - oldSpace.x, newY - oldSpace.y);

			//speed
			this.speed = this.space.delta.scale(speedFactor/timeDelta);
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
			$this = $(this),
			$window = $(window),
			wdata = $(window).data('interactable');
		  
			//intitialize the window object
			if($window[0]+'interactable' === $this[0]+'interactable'){
				options = $.extend({
					friction: 1,
					speedFactor:1
				}, options);
			  
				if(!wdata){
					
					wdata= {
						kinematics: $.interactableKinematics(options)
					};
					$window.data('interactable', wdata);					
					$window.bind('mousemove.interactable', function(e){
						var KI = $window.data('interactable').kinematics;					
						$window.data('interactable').kinematics.update(e.pageX, e.pageY, options.speedFactor);
						/*
						$window.data('interactable',{
							kinematics: KI
						});
						*/
					}); //bind mousemove.tooltip 
				}
			}else{
				//initialize other objects
				options = $.extend({
					drag:{
						stop:function(){}
					},
					axis: 'both',
					mass: 10
				}, options);
				
				var corrX = (options.axis == 'both' || options.axis == 'x') ? 1:0;
				var corrY = (options.axis == 'both' || options.axis == 'y') ? 1:0;
				
				var origStop = options.drag.stop
				var customStop = function(){
					var ki = $window.data('interactable').kinematics;
					var a = 0.003*Math.abs(ki.options.friction); //do not allow negative friction
					
					//TODO add mass feature to the objects :)
					
					if(a==0) a = 0.00001; //almost no friction
					var t =  ki.speed.w/a;
					var s = ki.speed.w*t - t*t*a/2;
					console.log(
						'a: '+a+'\n'+'v: '+ki.speed.w+'\n'+'t: '+t+'\n'+'s: '+s
					);
					var newPosition = ki.speed.direction().scale(s);
					$this.animate({
						left: $this.position().left + newPosition.x*corrX,
						top: $this.position().top + newPosition.y*corrY
					}, t, 'easeOutQuad');
					if(typeof(origStop) == 'function') origStop();
				};
				
				//handle the dragable
				var origStart = options.drag.start;
				var customStart = function(){
					//stop all animations
					$this.stop();
					if(typeof(origStart) == 'function') origStart();
				}
				options.drag.stop = customStop;
				options.drag.start = customStart;
				$this.draggable(options.drag);
			}
			return this;
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